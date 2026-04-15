"use client";

import { useState } from "react";
import { BrowserProvider } from "ethers";
import { saveBlockchainAnchor } from "./actions";

// Sepolia testnet — free ETH from any Sepolia faucet
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in decimal
const SEPOLIA_CHAIN_ID_DEC = 11155111;

// Minimal type for window.ethereum (MetaMask / EIP-1193 provider)
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

export type RecordData = {
  projectId: string;
  title: string;
  confirmedAt: string | null;
  collaborators: string[];
  compositionSplits: Array<{ name: string; percent: number }>;
  masterSplits: Array<{ name: string; percent: number }>;
};

type Props = {
  recordData: RecordData;
  existingTxHash?: string | null;
};

/** SHA-256 hash of the canonical JSON record, returned as 0x-prefixed hex. */
async function hashRecord(data: object): Promise<string> {
  const json = JSON.stringify(data, null, 0);
  const encoded = new TextEncoder().encode(json);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

type AnchorStatus =
  | "idle"
  | "connecting"
  | "switching"
  | "hashing"
  | "signing"
  | "waiting"
  | "done"
  | "error";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/tx";

export function AnchorToBlockchain({ recordData, existingTxHash }: Props) {
  const [status, setStatus] = useState<AnchorStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(existingTxHash ?? null);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Already anchored ──────────────────────────────────────────────────────
  if (txHash) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-base text-emerald-600">✓</span>
          <p className="text-sm font-semibold text-emerald-800">
            Anchored to blockchain
          </p>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-emerald-700">
          This record is permanently timestamped on Ethereum (Sepolia testnet).
          The hash below is immutable on-chain proof that these splits existed
          at this moment.
        </p>
        <a
          href={`${SEPOLIA_EXPLORER}/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-mono text-xs text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
        >
          {txHash}
        </a>
        <p className="mt-3 text-xs text-emerald-600">
          ↗ View on Sepolia Etherscan
        </p>
      </div>
    );
  }

  // ── Anchor flow ───────────────────────────────────────────────────────────
  async function handleAnchor() {
    if (!window.ethereum) {
      setErrorMsg(
        "MetaMask not detected. Install the MetaMask browser extension, then try again.",
      );
      setStatus("error");
      return;
    }

    try {
      // 1. Connect wallet
      setStatus("connecting");
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      // 2. Switch to Sepolia
      setStatus("switching");
      try {
        await provider.send("wallet_switchEthereumChain", [
          { chainId: SEPOLIA_CHAIN_ID },
        ]);
      } catch (switchErr: unknown) {
        const code = (switchErr as { code?: number }).code;
        if (code === 4902) {
          // Chain not added yet — add it
          await provider.send("wallet_addEthereumChain", [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ]);
        } else {
          throw switchErr;
        }
      }

      // 3. Hash the canonical record
      setStatus("hashing");
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      const canonicalRecord = {
        platform: "SessionLedger",
        version: "1",
        project_id: recordData.projectId,
        title: recordData.title,
        confirmed_at: recordData.confirmedAt,
        collaborators: recordData.collaborators,
        composition_splits: recordData.compositionSplits,
        master_splits: recordData.masterSplits,
      };
      const recordHash = await hashRecord(canonicalRecord);

      // 4. Send 0-ETH self-transaction with hash as calldata
      //    This writes an immutable, timestamped record on-chain at minimal cost.
      setStatus("signing");
      const tx = await signer.sendTransaction({
        to: signerAddress,
        value: BigInt(0),
        data: recordHash,
      });

      // 5. Wait for on-chain confirmation
      setStatus("waiting");
      await tx.wait(1);

      // 6. Persist tx hash to Supabase
      await saveBlockchainAnchor(recordData.projectId, tx.hash, SEPOLIA_CHAIN_ID_DEC);

      setTxHash(tx.hash);
      setStatus("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("user rejected") ||
        msg.toLowerCase().includes("user denied")
      ) {
        setErrorMsg("Transaction cancelled — nothing was sent.");
      } else {
        setErrorMsg(msg.slice(0, 160));
      }
      setStatus("error");
    }
  }

  const isPending = ["connecting", "switching", "hashing", "signing", "waiting"].includes(
    status,
  );

  const buttonLabel: Record<AnchorStatus, string> = {
    idle: "Anchor to Blockchain",
    connecting: "Connecting wallet…",
    switching: "Switching to Sepolia…",
    hashing: "Hashing record…",
    signing: "Confirm in MetaMask…",
    waiting: "Waiting for confirmation…",
    done: "✓ Anchored",
    error: "Try again",
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-neutral-900">
        Anchor to Blockchain
      </p>
      <p className="mb-4 text-xs leading-relaxed text-neutral-500">
        Write a SHA-256 hash of this record to Ethereum (Sepolia testnet).
        Creates a permanent, tamper-evident timestamp — anyone can verify the
        record existed at this exact moment without trusting SessionLedger.
      </p>

      {status === "error" && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMsg}
        </p>
      )}

      <button
        onClick={handleAnchor}
        disabled={isPending}
        className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {buttonLabel[status]}
      </button>

      <p className="mt-3 text-xs text-neutral-400">
        Requires MetaMask and a small amount of Sepolia ETH (free —{" "}
        <a
          href="https://sepoliafaucet.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-neutral-600"
        >
          get test ETH here
        </a>
        ).
      </p>
    </div>
  );
}
