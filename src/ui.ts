/** Small console helpers shared by all commands. */

/** Error type that the CLI turns into a clean `error: ...` message. */
export class LisenseError extends Error {
  override name = "LisenseError";
}

/** Abort the current command with a message. */
export function fail(message: string): never {
  throw new LisenseError(message);
}

export function relativeTo(path: string, cwd: string): string {
  const normalized = path.replaceAll("\\", "/");
  const base = cwd.replaceAll("\\", "/").replace(/\/$/, "");
  return normalized.startsWith(`${base}/`) ? normalized.slice(base.length + 1) : normalized;
}
