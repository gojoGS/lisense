/** `lisense explain <id>` - print the full license text and nothing else. */

import { resolveLicense } from "../catalog.ts";
import { rawText } from "../render.ts";
import { failMissing } from "./add.ts";

export function explainCommand(identifier: string | undefined): void {
  if (!identifier) {
    process.stderr.write("error: no license specified.\n");
    process.exit(1);
  }

  const entry = resolveLicense(identifier);
  if (!entry) failMissing(identifier);

  // Exactly the license text on stdout: no headers, no colour, no trailing notes.
  process.stdout.write(`${rawText(entry).replace(/\s*$/, "")}\n`);
}
