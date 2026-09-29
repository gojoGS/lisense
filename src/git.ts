/** Thin wrappers around the `git` CLI. All helpers degrade gracefully when git
 * is missing or the directory is not a repository. */

function git(args: string[], cwd: string): { ok: boolean; out: string } {
  try {
    const proc = Bun.spawnSync({
      cmd: ["git", ...args],
      cwd,
      stdout: "pipe",
      stderr: "ignore",
    });
    return { ok: proc.exitCode === 0, out: proc.stdout?.toString() ?? "" };
  } catch {
    return { ok: false, out: "" };
  }
}

/** Absolute path of the enclosing repository, or `undefined` outside git. */
export function repoRoot(cwd: string = process.cwd()): string | undefined {
  const { ok, out } = git(["rev-parse", "--show-toplevel"], cwd);
  const root = out.trim();
  return ok && root ? root.replaceAll("\\", "/") : undefined;
}

/** Every path tracked by git, relative to the repository root. */
export function trackedFiles(cwd: string = process.cwd()): string[] {
  const { ok, out } = git(["ls-files", "-z"], cwd);
  if (!ok || !out) return [];
  return out
    .split("\u0000")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Whether git reports the given absolute path as tracked. */
export function isTracked(absolutePath: string, cwd: string = process.cwd()): boolean {
  const { ok, out } = git(["ls-files", "--error-unmatch", "--", absolutePath], cwd);
  return ok && out.trim().length > 0;
}
