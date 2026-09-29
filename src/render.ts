/**
 * Turns a catalog entry into the exact text that ends up in LICENSE.
 *
 * Full texts come from the SPDX license list. Placeholders that SPDX templates
 * spell as `[year]`, `<year>`, `<copyright holders>` and friends are swapped for
 * the values the user (or their environment) provides.
 */

import { readFileSync } from "node:fs";
import spdxFull from "spdx-license-list/full";
import type { LicenseEntry } from "./catalog.ts";

export interface FillValues {
  year: string;
  holder: string;
  program: string;
}

/** Raw SPDX text for an entry, before any placeholder substitution. */
export function rawText(entry: LicenseEntry): string {
  const record = (spdxFull as Record<string, { licenseText?: string } | undefined>)[entry.spdx];
  if (!record?.licenseText) {
    throw new Error(`no license text available for ${entry.spdx}`);
  }
  return record.licenseText;
}

const YEAR_TOKENS = /\[year\]|\[yyyy\]|<year>|<copyright year>/gi;
const HOLDER_TOKENS =
  /\[fullname\]|\[name of copyright owner\]|\[name of author\]|<copyright holders?>|<owner>|<organization>|<name of author>/gi;
const PROGRAM_TOKENS = /\[program\]|<program>/gi;

/** Replace the placeholder spellings used across SPDX templates. */
export function fillPlaceholders(text: string, values: FillValues): string {
  return text
    .replace(YEAR_TOKENS, values.year || " ")
    .replace(PROGRAM_TOKENS, values.program || " ")
    .replace(HOLDER_TOKENS, values.holder || " ");
}

export function defaultYear(now: Date = new Date()): string {
  return String(now.getFullYear());
}

/** Best-effort copyright holder: `git config user.name`. */
export function defaultHolder(): string {
  try {
    const proc = Bun.spawnSync({
      cmd: ["git", "config", "--get", "user.name"],
      stdout: "pipe",
      stderr: "ignore",
    });
    return proc.stdout?.toString().trim() || "";
  } catch {
    return "";
  }
}

/** Best-effort program name: `name` from package.json in `cwd`. */
export function defaultProgram(cwd: string = process.cwd()): string {
  try {
    const parsed = JSON.parse(readFileSync(`${cwd}/package.json`, "utf8"));
    const name = typeof parsed?.name === "string" ? parsed.name : "";
    if (!name) return "this program";
    // Strip the scope: `@gojogs/lisense` -> `lisense`.
    return name.includes("/") ? name.slice(name.indexOf("/") + 1) : name;
  } catch {
    return "this program";
  }
}
