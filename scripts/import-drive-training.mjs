#!/usr/bin/env node
// F-005 Drive ingestion. Reads files from a Google Drive folder via the Composio
// v3 REST API and creates one training_materials row per file. Re-runnable:
// skips files whose source_file_id already exists.
//
// Usage: node scripts/import-drive-training.mjs --source-id <uuid> --folder <drive_folder_id>
// Env (B-001): COMPOSIO_API_KEY, COMPOSIO_CONNECTED_ACCOUNT (Drive),
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { readFileSync } from "node:fs";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : null;
}

const sourceId = arg("source-id");
const folder = arg("folder");
if (!sourceId || !folder) {
  process.stderr.write("usage: --source-id <uuid> --folder <drive_folder_id>\n");
  process.exit(2);
}

function env() {
  const e = {};
  try {
    for (const line of readFileSync("client-portal/.env.prod", "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
      if (m) e[m[1]] = m[2];
    }
  } catch {
    // fall back to process.env
  }
  return {
    composioKey: process.env.COMPOSIO_API_KEY || e.COMPOSIO_API_KEY,
    account: process.env.COMPOSIO_CONNECTED_ACCOUNT || e.COMPOSIO_CONNECTED_ACCOUNT,
    sbUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || e.NEXT_PUBLIC_SUPABASE_URL,
    sbKey: process.env.SUPABASE_SERVICE_ROLE_KEY || e.SUPABASE_SERVICE_ROLE_KEY,
  };
}

const cfg = env();
const missing = ["composioKey", "account", "sbUrl", "sbKey"].filter((k) => !cfg[k]);
if (missing.length) {
  process.stderr.write(`BLOCKED (B-001): missing ${missing.join(", ")}. Provide Composio Drive AC + Supabase creds.\n`);
  process.exit(1);
}

const COMPOSIO = process.env.COMPOSIO_API_BASE || "https://backend.composio.dev/api/v3";

async function composio(action, args) {
  const res = await fetch(`${COMPOSIO}/actions/${action}/execute`, {
    method: "POST",
    headers: { "x-api-key": cfg.composioKey, "Content-Type": "application/json" },
    body: JSON.stringify({ connectedAccountId: cfg.account, input: args }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Composio ${action}: ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

async function sb(method, path, body) {
  const res = await fetch(`${cfg.sbUrl}/rest/v1/${path}`, {
    method,
    headers: { apikey: cfg.sbKey, Authorization: `Bearer ${cfg.sbKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Supabase ${method} ${path}: ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

async function main() {
  // 1. list files in the Drive folder
  const list = await composio("GOOGLEDRIVE_LIST_FILES", { query: `'${folder}' in parents and trashed = false` });
  const files = list?.data?.files ?? list?.files ?? [];
  process.stdout.write(`found ${files.length} files in folder ${folder}\n`);

  let created = 0;
  let skipped = 0;
  for (const f of files) {
    const fileId = f.id;
    const existing = await sb("GET", `training_materials?source_file_id=eq.${encodeURIComponent(fileId)}&select=id&limit=1`);
    if (existing && existing.length) {
      skipped++;
      continue;
    }
    const dl = await composio("GOOGLEDRIVE_DOWNLOAD_FILE", { file_id: fileId });
    const content = dl?.data?.content ?? dl?.content ?? "";
    await sb("POST", "training_materials", {
      training_source_id: sourceId,
      title: f.name,
      summary: null,
      content_markdown: String(content),
      source_file_id: fileId,
      embedding_status: "skipped",
      tags: [],
      business_types: [],
      use_cases: [],
    });
    created++;
  }
  process.stdout.write(`done: ${created} created, ${skipped} skipped\n`);
}

main().catch((e) => {
  process.stderr.write(`import failed: ${e.message}\n`);
  process.exit(1);
});
