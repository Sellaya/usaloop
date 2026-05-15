#!/usr/bin/env node
/**
 * Reads repo-root .env and upserts each non-empty KEY into Vercel for
 * production, preview, and development (linked project in .vercel/).
 *
 * Usage: node scripts/push-env-to-vercel.mjs
 * Requires: npx vercel, logged-in CLI (`vercel login`), linked project.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const vercelBin = join(root, "node_modules", ".bin", "vercel");

const SENSITIVE = new Set([
  "OPENWEATHER_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "GOOGLE_MAPS_SERVER_KEY",
  "GOOGLE_CLIENT_SECRET",
]);

/** Do not push Vercel runtime / OIDC tokens from a local machine into project env. */
function shouldSkipKey(key) {
  if (!key) return true;
  if (key.startsWith("VERCEL_")) return true;
  return false;
}

function parseEnvFile(content) {
  const out = {};
  for (const line of content.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let key = line.slice(0, eq).trim();
    const raw = line.slice(eq + 1).trim();
    if (key.startsWith("export ")) key = key.slice(7).trim();
    let val = raw;
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!key || val === "") continue;
    out[key] = val;
  }
  return out;
}

function vercel(args) {
  const bin = existsSync(vercelBin) ? vercelBin : "npx";
  const argv = existsSync(vercelBin) ? args : ["--yes", "vercel@latest", ...args];
  const r = spawnSync(bin, argv, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
    env: { ...process.env, CI: "1", VERCEL_NONINTERACTIVE: "1" },
  });
  if (r.error) throw r.error;
  if (r.status === 0) return;
  const err = `${r.stderr || ""}\n${r.stdout || ""}`.trim();
  const e = new Error(err || `vercel exited ${r.status}`);
  e.status = r.status;
  throw e;
}

function upsert(key, value, target) {
  const updateTail = ["--value", value, "-y"];
  if (SENSITIVE.has(key) && target !== "development") updateTail.push("--sensitive");

  const addTail = ["--value", value, "-y"];
  if (target === "development") addTail.push("--no-sensitive");
  else if (SENSITIVE.has(key)) addTail.push("--sensitive");
  else addTail.push("--no-sensitive");

  if (target === "preview") {
    try {
      vercel(["env", "update", key, "preview", ...updateTail]);
      return;
    } catch {
      /* Empty git-branch arg = all Preview deployments (Vercel CLI quirk; see vercel/vercel#15763). */
      vercel(["env", "add", key, "preview", "", ...addTail, "--force"]);
    }
    return;
  }

  try {
    vercel(["env", "update", key, target, ...updateTail]);
  } catch {
    vercel(["env", "add", key, target, ...addTail, "--force"]);
  }
}

if (!existsSync(envPath)) {
  console.error("Missing .env — copy .env.example to .env and set keys first.");
  process.exit(1);
}

const pairs = parseEnvFile(readFileSync(envPath, "utf8"));
const keys = Object.keys(pairs).filter((k) => !shouldSkipKey(k));
if (!keys.length) {
  console.error(".env has no non-empty app keys to sync (VERCEL_* keys are skipped).");
  process.exit(1);
}

const targets = ["production", "preview", "development"];
console.log(`Syncing ${keys.length} variable(s) × ${targets.length} environments to linked Vercel project…`);

for (const target of targets) {
  for (const key of keys) {
    process.stdout.write(`  ${target} / ${key} … `);
    upsert(key, pairs[key], target);
    console.log("ok");
  }
}

console.log("Done. Redeploy on Vercel if the build should pick up new values.");
