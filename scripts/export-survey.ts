#!/usr/bin/env npx tsx
/**
 * Export survey data from Supabase and decrypt encrypted fields to CSV.
 *
 * Usage:
 *   npx tsx scripts/export-survey.ts
 *   npx tsx scripts/export-survey.ts --survey-id layoff-survey-2026
 *   npx tsx scripts/export-survey.ts --env .env.production.local
 *
 * Reads from .env.local by default. Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SURVEY_ENCRYPTION_KEY    (64-char hex, 32 bytes for AES-256)
 *   SURVEY_DOMAIN_SALT       (64-char hex, 32 bytes — needed only for reference, not decryption)
 */

import { createClient } from "@supabase/supabase-js";
import { createDecipheriv } from "crypto";
import { config } from "dotenv";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { surveyConfigs } from "@/lib/survey/config";

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getFlag(name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

const envFile = getFlag("--env") ?? ".env.local";
const surveyIdFilter = getFlag("--survey-id");

// ── Load env ────────────────────────────────────────────────────────────────

config({ path: resolve(process.cwd(), envFile) });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKeyHex = process.env.SURVEY_ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env"
  );
  process.exit(1);
}
if (!encryptionKeyHex) {
  console.error("Missing SURVEY_ENCRYPTION_KEY in env");
  process.exit(1);
}

const encryptionKey = Buffer.from(encryptionKeyHex, "hex");
if (encryptionKey.length !== 32) {
  console.error("SURVEY_ENCRYPTION_KEY must be 64-char hex (32 bytes)");
  process.exit(1);
}

// ── Crypto (inlined to avoid server-only import) ────────────────────────────

const AUTH_TAG_BYTES = 16;

function decrypt(ciphertext: string, iv: string, key: Buffer, aadContext?: string): string {
  const ivBuffer = Buffer.from(iv, "hex");
  const combined = Buffer.from(ciphertext, "hex");
  const authTag = combined.subarray(combined.length - AUTH_TAG_BYTES);
  const encrypted = combined.subarray(0, combined.length - AUTH_TAG_BYTES);

  const decipher = createDecipheriv("aes-256-gcm", key, ivBuffer);
  if (aadContext) {
    decipher.setAAD(Buffer.from(aadContext, "utf8"));
  }
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Decrypt an inline-encrypted JSONB value ("iv_hex:ciphertext_hex").
 * Returns the original value if it doesn't match the pattern.
 */
function decryptInlineValue(value: string, key: Buffer, aadContext?: string): string {
  // Encrypted values are stored as "iv_hex:ciphertext_hex" — both parts are hex-only
  const colonIdx = value.indexOf(":");
  if (colonIdx === -1) return value;

  const iv = value.slice(0, colonIdx);
  const ciphertext = value.slice(colonIdx + 1);

  // Sanity check: IV should be 24 hex chars (12 bytes)
  if (iv.length !== 24 || !/^[0-9a-f]+$/i.test(iv)) return value;
  if (!/^[0-9a-f]+$/i.test(ciphertext)) return value;

  try {
    return decrypt(ciphertext, iv, key, aadContext);
  } catch {
    return `[DECRYPT_FAILED] ${value}`;
  }
}

// ── Supabase client ─────────────────────────────────────────────────────────

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── CSV helpers ─────────────────────────────────────────────────────────────

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  // Escape fields containing commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.map(escapeCsvField).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvField(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

// ── Encrypted field IDs from survey config ──────────────────────────────────

// Question IDs with encrypted: true and storageTarget: "responses" across all surveys.
const ENCRYPTED_ANSWER_KEYS = new Set([
  "laid_off_team",
  "grievance_story",
  "support_questions",
  "current_team",
  "layoff_concerns",
  "current_story",
  "impact_story",
]);

// ── Fetch & export ──────────────────────────────────────────────────────────

async function fetchAll<T extends Record<string, unknown>>(
  table: string,
  surveyId?: string
): Promise<T[]> {
  const allRows: T[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    // Build a fresh query each iteration — the builder is mutated by .range()
    let query = supabase.from(table).select("*");
    if (surveyId) {
      query = query.eq("survey_id", surveyId);
    }
    const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      console.error(`Error fetching ${table}: ${error.message}`);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allRows.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

async function main() {
  const outputDir = resolve(dirname(new URL(import.meta.url).pathname), "output");
  mkdirSync(outputDir, { recursive: true });

  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Env file: ${envFile}`);
  if (surveyIdFilter) console.log(`Filtering to survey_id: ${surveyIdFilter}`);

  // ── survey_responses ────────────────────────────────────────────────────

  console.log("\nFetching survey_responses...");
  const responses = await fetchAll<Record<string, unknown>>(
    "survey_responses",
    surveyIdFilter
  );
  console.log(`  ${responses.length} rows`);

  // Collect all unique answer keys across rows to build CSV columns.
  // Matrix answers (object values) are expanded to "questionId.rowKey" columns
  // in config row order for deterministic output across partial fills.
  const answerKeysSet = new Set<string>();
  for (const row of responses) {
    const answers = row.answers as Record<string, unknown> | null;
    if (!answers) continue;
    const surveyConfig = surveyConfigs[row.survey_id as string];
    for (const [key, val] of Object.entries(answers)) {
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        // Matrix answer — use config rows for deterministic column order
        const questionDef = surveyConfig?.questions.find((q) => q.id === key);
        if (questionDef?.rows) {
          for (const matrixRow of questionDef.rows) {
            answerKeysSet.add(`${key}.${matrixRow.key}`);
          }
        } else {
          // Fallback: discovery order (unknown question not in any config)
          for (const rowKey of Object.keys(val as Record<string, unknown>)) {
            answerKeysSet.add(`${key}.${rowKey}`);
          }
        }
      } else {
        answerKeysSet.add(key);
      }
    }
  }
  const answerKeys = [...answerKeysSet].sort();

  // Flatten: top-level columns + each answer key as its own column
  const responseHeaders = [
    "id",
    "survey_id",
    "respondent_type",
    "created_at",
    ...answerKeys,
  ];

  const flatResponses = responses.map((row) => {
    const answers = (row.answers as Record<string, unknown>) ?? {};
    const flat: Record<string, unknown> = {
      id: row.id,
      survey_id: row.survey_id,
      respondent_type: row.respondent_type,
      created_at: row.created_at,
    };
    for (const key of answerKeys) {
      const dotIdx = key.indexOf(".");
      if (dotIdx !== -1) {
        // Matrix sub-key: "questionId.rowKey"
        const questionId = key.slice(0, dotIdx);
        const rowKey = key.slice(dotIdx + 1);
        const matrixVal = answers[questionId];
        if (typeof matrixVal === "object" && matrixVal !== null && !Array.isArray(matrixVal)) {
          flat[key] = (matrixVal as Record<string, string>)[rowKey] ?? "";
        } else {
          flat[key] = "";
        }
      } else {
        let val = answers[key];
        // Decrypt encrypted answer fields
        if (
          ENCRYPTED_ANSWER_KEYS.has(key) &&
          typeof val === "string" &&
          val.length > 0
        ) {
          val = decryptInlineValue(val, encryptionKey, `${key}:${row.survey_id}`);
        }
        // Multi-select arrays → semicolon-separated
        if (Array.isArray(val)) {
          flat[key] = val.join("; ");
        } else {
          flat[key] = val ?? "";
        }
      }
    }
    return flat;
  });

  const responseCsv = toCsv(responseHeaders, flatResponses);
  const responsePath = resolve(outputDir, "survey_responses.csv");
  writeFileSync(responsePath, responseCsv, "utf8");
  console.log(`  Written to ${responsePath}`);

  // ── survey_sensitive ────────────────────────────────────────────────────

  console.log("\nFetching survey_sensitive...");
  const sensitive = await fetchAll<Record<string, unknown>>(
    "survey_sensitive",
    surveyIdFilter
  );
  console.log(`  ${sensitive.length} rows`);

  const sensitiveHeaders = [
    "id",
    "survey_id",
    "employment_status",
    "willingness",
    "contact_type",
    "contact",
    "domain_hash",
    "key_version",
  ];

  const flatSensitive = sensitive.map((row) => {
    let contact = "";
    const encContact = row.encrypted_contact as string | null;
    const contactIv = row.contact_iv as string | null;
    if (encContact && contactIv) {
      try {
        contact = decrypt(encContact, contactIv, encryptionKey, `contact:${row.survey_id}`);
      } catch {
        contact = `[DECRYPT_FAILED]`;
      }
    }

    return {
      id: row.id,
      survey_id: row.survey_id,
      employment_status: row.employment_status,
      willingness: row.willingness,
      contact_type: row.contact_type ?? "",
      contact,
      domain_hash: row.domain_hash ?? "",
      key_version: row.key_version,
    };
  });

  const sensitiveCsv = toCsv(sensitiveHeaders, flatSensitive);
  const sensitivePath = resolve(outputDir, "survey_sensitive.csv");
  writeFileSync(sensitivePath, sensitiveCsv, "utf8");
  console.log(`  Written to ${sensitivePath}`);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
