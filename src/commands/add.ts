/** `lisense <license>` - write a LICENSE file into the current directory. */

import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveLicense, suggestLicense } from "../catalog.ts";
import { fillPlaceholders, rawText } from "../render.ts";
import { fail } from "../ui.ts";

export interface AddOptions {
  cwd: string;
  year: string;
  holder: string;
  program: string;
  force: boolean;
}

/** GitHub's convention: the file is always named LICENSE, all uppercase. */
export const LICENSE_FILENAME = "LICENSE";

export function addCommand(identifier: string | undefined, options: AddOptions): void {
  if (!identifier) {
    fail("no license specified. Run `lisense list` to see available licenses.");
  }

  const entry = resolveLicense(identifier);
  if (!entry) {
    failMissing(identifier);
  }

  const target = join(options.cwd, LICENSE_FILENAME);
  if (existsSync(target) && !options.force) {
    fail(`${LICENSE_FILENAME} already exists. Use --force to overwrite.`);
  }

  const body = ensureTrailingNewline(
    fillPlaceholders(rawText(entry), {
      year: options.year,
      holder: options.holder,
      program: options.program,
    }),
  );

  writeFileSync(target, body, "utf8");
  process.stdout.write(`Created ${LICENSE_FILENAME} (${entry.name})\n`);
}

function ensureTrailingNewline(text: string): string {
  return `${text.replace(/\s+$/, "")}\n`;
}

/** Shared by every command that takes a license id. */
export function failMissing(identifier: string): never {
  const suggestion = suggestLicense(identifier);
  const hint = suggestion ? ` Did you mean \`${suggestion.id}\`?` : " Run `lisense list` to see all licenses.";
  return fail(`unknown license: ${identifier}.${hint}`);
}
