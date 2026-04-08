"use client";

import { useState } from "react";

export function CopyRecordLinkButton() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:opacity-80"
    >
      {copied ? "Link copied" : "Copy record link"}
    </button>
  );
}

