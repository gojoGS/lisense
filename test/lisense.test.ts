import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveLicense, suggestLicense } from "../src/catalog.ts";
import { findLicenses } from "../src/commands/check.ts";
import { addCommand } from "../src/commands/add.ts";
import { detectLicenseId } from "../src/detect.ts";
import { fillPlaceholders, rawText } from "../src/render.ts";

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "lisense-"));
  tempDirs.push(dir);
  return dir;
}

function run(args: string[], cwd: string) {
  const proc = Bun.spawnSync({
    cmd: ["bun", join(import.meta.dir, "..", "src", "index.ts"), ...args],
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    code: proc.exitCode,
    stdout: proc.stdout.toString(),
    stderr: proc.stderr.toString(),
  };
}

afterEach(() => {
  while (tempDirs.length) rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe("catalog", () => {
  test("resolves short ids, SPDX ids and aliases", () => {
    expect(resolveLicense("mit")?.id).toBe("mit");
    expect(resolveLicense("MIT")?.id).toBe("mit");
    expect(resolveLicense("apache-2.0")?.id).toBe("apache2");
    expect(resolveLicense("GPL-3.0")?.id).toBe("gpl3");
    expect(resolveLicense("nope")).toBeUndefined();
  });

  test("suggests a close match", () => {
    expect(suggestLicense("gpl-2.0")?.id).toBe("gpl2");
    expect(suggestLicense("mii")?.id).toBe("mit");
    expect(suggestLicense("zzzzzzzz")).toBeUndefined();
  });
});

describe("render", () => {
  test("fills year and holder placeholders", () => {
    const text = fillPlaceholders(rawText(resolveLicense("mit")!), {
      year: "2026",
      holder: "Ada Lovelace",
      program: "lisense",
    });
    expect(text).toContain("2026");
    expect(text).toContain("Ada Lovelace");
    expect(text).not.toContain("<year>");
  });

  test("every catalog entry has full text available", () => {
    for (const entry of ["mit", "apache2", "gpl2", "gpl3", "agpl3", "mpl2", "bsd3", "isc"]) {
      expect(rawText(resolveLicense(entry)!).length).toBeGreaterThan(100);
    }
  });
});

describe("detect", () => {
  test("recognises common licenses from text", () => {
    const id = (name: string) => detectLicenseId(rawText(resolveLicense(name)!));
    expect(id("mit")).toBe("mit");
    expect(id("apache2")).toBe("apache2");
    expect(id("gpl3")).toBe("gpl3");
    expect(id("apache2")).toBe("apache2");
    expect(id("bsd2")).toBe("bsd2");
    expect(id("bsd3")).toBe("bsd3");
    expect(id("isc")).toBe("isc");
    expect(id("unlicense")).toBe("unlicense");
  });
});

describe("add", () => {
  const base = { year: "2026", holder: "Ada", program: "demo", force: false };

  test("writes an uppercase LICENSE file", () => {
    const dir = tempDir();
    addCommand("mit", { ...base, cwd: dir });
    const text = readFileSync(join(dir, "LICENSE"), "utf8");
    expect(text).toContain("MIT License");
    expect(text).toContain("Ada");
  });

  test("refuses to overwrite without --force", () => {
    const dir = tempDir();
    addCommand("mit", { ...base, cwd: dir });
    expect(() => addCommand("mit", { ...base, cwd: dir })).toThrow();
  });
});

describe("check", () => {
  test("finds a license in the working directory", () => {
    const dir = tempDir();
    addCommand("apache2", { year: "2026", holder: "Ada", program: "demo", force: false, cwd: dir });
    const found = findLicenses(dir);
    expect(found.some((entry) => entry.id === "apache2")).toBe(true);
  });

  test("finds a tracked license from a subdirectory of a git repository", () => {
    const dir = tempDir();
    const sub = join(dir, "packages", "app");
    mkdirSync(sub, { recursive: true });
    addCommand("mit", { year: "2026", holder: "Ada", program: "demo", force: false, cwd: dir });

    Bun.spawnSync({ cmd: ["git", "init"], cwd: dir, stderr: "ignore" });
    Bun.spawnSync({ cmd: ["git", "add", "LICENSE"], cwd: dir, stderr: "ignore" });

    const found = findLicenses(sub);
    expect(found.map((entry) => entry.id)).toContain("mit");
  });
});

describe("cli", () => {
  test("list prints the supported licenses", () => {
    const { code, stdout } = run(["list"], process.cwd());
    expect(code).toBe(0);
    expect(stdout).toContain("mit");
    expect(stdout).toContain("apache2");
    expect(stdout).toContain("gpl3");
  });

  test("list --json is machine readable", () => {
    const { stdout } = run(["list", "--json"], process.cwd());
    const rows = JSON.parse(stdout);
    expect(rows.some((row: { id: string }) => row.id === "mit")).toBe(true);
  });

  test("explain prints only the license text", () => {
    const { code, stdout } = run(["explain", "mit"], process.cwd());
    expect(code).toBe(0);
    expect(stdout.startsWith("MIT License")).toBe(true);
    expect(stdout).not.toContain("Created");
  });

  test("explain fails for an unknown license", () => {
    const { code, stderr } = run(["explain", "mii"], process.cwd());
    expect(code).toBe(1);
    expect(stderr).toContain("unknown license");
  });

  test("bare invocation no longer adds a license", () => {
    const dir = tempDir();
    const { code, stdout } = run(["mit"], dir);
    expect(code).not.toBe(0);
    expect(stdout).not.toContain("Created");
    expect(existsSync(join(dir, "LICENSE"))).toBe(false);
  });

  test("`add <license>` writes LICENSE and is listed in help", () => {
    const dir = tempDir();
    const { code } = run(["add", "gpl3", "-n", "Ada", "-y", "2026"], dir);
    expect(code).toBe(0);
    expect(readFileSync(join(dir, "LICENSE"), "utf8")).toContain("GNU GENERAL PUBLIC LICENSE");

    const help = run(["--help"], process.cwd());
    expect(help.stdout).toContain("add [options] <license>");
  });

  test("every command has its own usage line", () => {
    expect(run(["--help"], process.cwd()).stdout).toContain("Usage: lisense [options] [command]");
    expect(run(["add", "--help"], process.cwd()).stdout).toContain("Usage: lisense add [options] <license>");
    expect(run(["list", "--help"], process.cwd()).stdout).toContain("Usage: lisense list [options]");
    expect(run(["check", "--help"], process.cwd()).stdout).toContain("Usage: lisense check [options]");
    expect(run(["explain", "--help"], process.cwd()).stdout).toContain("Usage: lisense explain [options] <license>");
  });

  test("`add` without a license fails", () => {
    const { code, stderr } = run(["add"], process.cwd());
    expect(code).toBe(1);
    expect(stderr).toContain("missing required argument 'license'");
  });

  test("check exits non-zero when no license exists", () => {
    const dir = tempDir();
    const { code, stdout } = run(["check"], dir);
    expect(code).toBe(1);
    expect(stdout).toContain("No license found");
  });

  test("check exits zero once a license exists", () => {
    const dir = tempDir();
    run(["add", "bsd3"], dir);
    const { code, stdout } = run(["check"], dir);
    expect(code).toBe(0);
    expect(stdout).toContain("bsd3");
  });
});
