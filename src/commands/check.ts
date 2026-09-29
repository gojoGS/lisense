/** `lisense check` - is a license already present here or in this repository? */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { detectLicenseId, isLicenseFileName, licenseDisplayName } from "../detect.ts";
import { repoRoot, trackedFiles } from "../git.ts";
import { relativeTo } from "../ui.ts";

export interface CheckOptions {
  cwd: string;
  json: boolean;
}

export interface FoundLicense {
  /** Path shown to the user, relative to the working directory when possible. */
  path: string;
  /** Absolute path, used for de-duplication. */
  absolutePath: string;
  /** Detected catalog id, when the content is recognisable. */
  id?: string;
  name?: string;
  /** Where it was found. */
  source: "directory" | "repository" | "tracked";
}

export function findLicenses(cwd: string): FoundLicense[] {
  const found = new Map<string, FoundLicense>();
  const add = (absolutePath: string, source: FoundLicense["source"]) => {
    const key = absolutePath.replaceAll("\\", "/").toLowerCase();
    if (!found.has(key)) found.set(key, describe(absolutePath, source, cwd));
  };

  for (const name of safeReaddir(cwd)) {
    if (isLicenseFileName(name)) add(resolve(cwd, name), "directory");
  }

  const root = repoRoot(cwd);
  if (root) {
    for (const name of safeReaddir(root)) {
      if (isLicenseFileName(name)) add(resolve(root, name), "repository");
    }
    for (const relative of trackedFiles(cwd)) {
      if (isLicenseFileName(basename(relative))) add(resolve(root, relative), "tracked");
    }
  }

  return [...found.values()];
}

function describe(absolutePath: string, source: FoundLicense["source"], cwd: string): FoundLicense {
  const record: FoundLicense = {
    path: toDisplayPath(absolutePath, cwd),
    absolutePath,
    source,
  };
  const text = readText(absolutePath);
  if (text === undefined) return record;

  const id = detectLicenseId(text);
  if (id) {
    record.id = id;
    record.name = licenseDisplayName(id);
  } else {
    record.name = "unrecognised license text";
  }
  return record;
}

function readText(absolutePath: string): string | undefined {
  try {
    if (statSync(absolutePath).size > 2_000_000) return "";
    return readFileSync(absolutePath, "utf8");
  } catch {
    return undefined;
  }
}

function toDisplayPath(absolutePath: string, cwd: string): string {
  const shown = relativeTo(absolutePath, cwd);
  return shown.startsWith("..") ? absolutePath.replaceAll("\\", "/") : shown;
}

function safeReaddir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

export function checkCommand(options: CheckOptions): void {
  const found = findLicenses(options.cwd);

  if (options.json) {
    process.stdout.write(
      `${JSON.stringify(
        found.map((entry) => ({
          path: entry.path,
          id: entry.id ?? null,
          name: entry.name ?? null,
          source: entry.source,
        })),
        null,
        2,
      )}\n`,
    );
    if (found.length === 0) process.exit(1);
    return;
  }

  if (found.length === 0) {
    process.stdout.write("No license found in this directory or repository.\n");
    process.exit(1);
  }

  for (const entry of found) {
    const label = entry.id ? `${entry.id} (${entry.name})` : (entry.name ?? "unrecognised license text");
    process.stdout.write(`${entry.path}  ${label}\n`);
  }
}
