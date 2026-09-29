#!/usr/bin/env bun
/** lisense - write standard LICENSE files into your projects. */

import { readFileSync } from "node:fs";
import { Command } from "commander";
import { addCommand } from "./commands/add.ts";
import { checkCommand } from "./commands/check.ts";
import { explainCommand } from "./commands/explain.ts";
import { listCommand } from "./commands/list.ts";
import { defaultHolder, defaultProgram, defaultYear } from "./render.ts";
import { LisenseError } from "./ui.ts";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as {
  version: string;
};

interface AddFlags {
  year: string;
  name: string;
  program: string;
  force?: boolean;
}

const program = new Command();

program
  .name("lisense")
  .description("Create LICENSE files for your software projects.")
  .version(pkg.version, "-v, --version", "print the version")
  .helpOption("-h, --help", "print help");

program
  .command("add")
  .description("add a LICENSE file for a license id")
  .argument("<license>", "license id, e.g. mit, apache2, gpl3")
  .option("-y, --year <year>", "copyright year", defaultYear())
  .option("-n, --name <name>", "copyright holder", defaultHolder())
  .option("-p, --program <program>", "program name", defaultProgram())
  .option("-f, --force", "overwrite an existing LICENSE file")
  .action((license: string, flags: AddFlags) => {
    addCommand(license, {
      cwd: process.cwd(),
      year: String(flags.year),
      holder: String(flags.name ?? ""),
      program: String(flags.program),
      force: Boolean(flags.force),
    });
  });

program
  .command("list")
  .description("list every supported license")
  .option("--json", "print machine readable JSON")
  .action((options: { json?: boolean }) => {
    listCommand({ json: Boolean(options.json) });
  });

program
  .command("check")
  .description(
    "check for an existing license in this directory or git repository",
  )
  .option("--json", "print machine readable JSON")
  .action((options: { json?: boolean }) => {
    checkCommand({ cwd: process.cwd(), json: Boolean(options.json) });
  });

program
  .command("explain")
  .description("print the full text of a license to stdout")
  .argument("<license>", "license id, e.g. mit, apache2, gpl3")
  .action((license: string) => {
    explainCommand(license);
  });

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof LisenseError) {
    process.stderr.write(`error: ${error.message}\n`);
    process.exit(1);
  }
  throw error;
}
