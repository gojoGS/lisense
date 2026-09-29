/** `lisense list` - every license that can be generated. */

import { CATALOG } from "../catalog.ts";

export interface ListOptions {
  json: boolean;
}

export function listCommand(options: ListOptions): void {
  if (options.json) {
    const rows = CATALOG.map((entry) => ({
      id: entry.id,
      spdx: entry.spdx,
      name: entry.name,
      aliases: entry.aliases,
    }));
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    return;
  }

  const idWidth = Math.max(...CATALOG.map((entry) => entry.id.length), 2);
  const spdxWidth = Math.max(...CATALOG.map((entry) => entry.spdx.length), 4);

  const header = `${"ID".padEnd(idWidth)}  ${"SPDX".padEnd(spdxWidth)}  NAME`;
  process.stdout.write(`${header}\n`);
  for (const entry of CATALOG) {
    process.stdout.write(`${entry.id.padEnd(idWidth)}  ${entry.spdx.padEnd(spdxWidth)}  ${entry.name}\n`);
  }
}
