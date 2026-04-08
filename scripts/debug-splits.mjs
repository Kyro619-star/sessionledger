import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

async function loadDotEnvLocal() {
  try {
    const txt = await readFile(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

function mustEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env ${name} (check .env.local)`);
  }
  return v;
}

async function main() {
  await loadDotEnvLocal();
  const url = mustEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = mustEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const supabase = createClient(url, key);

  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("id, collaborators")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (projectErr) {
    console.error("projects select error:", projectErr);
    process.exitCode = 1;
    return;
  }
  if (!project?.id) {
    console.error("No projects found. Create a project first.");
    process.exitCode = 1;
    return;
  }

  const raw = String(project.collaborators ?? "");
  const participants = Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

  console.log("Using project:", project.id);
  console.log("Participants:", participants);

  const { data: splitSample, error: splitSelectErr } = await supabase
    .from("project_splits")
    .select("*")
    .limit(1);

  if (splitSelectErr) {
    console.error("project_splits select error:", splitSelectErr);
  } else {
    const keys = splitSample?.[0] ? Object.keys(splitSample[0]) : [];
    console.log("project_splits sample keys:", keys);
  }

  const { error: delErr } = await supabase
    .from("project_splits")
    .delete()
    .eq("project_id", project.id);

  if (delErr) {
    console.error("project_splits delete error:", delErr);
    process.exitCode = 1;
    return;
  }

  const first = participants[0] ?? "Test Collaborator";
  const { error: insErr } = await supabase.from("project_splits").insert([
    {
      project_id: project.id,
      collaborator_name: first,
      split_percentage: 100,
    },
  ]);

  if (insErr) {
    console.error("project_splits insert error:", insErr);
    process.exitCode = 1;
    return;
  }

  console.log("OK: delete+insert succeeded.");
}

await main();

