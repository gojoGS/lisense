/**
 * Curated catalog of the licenses `lisense` can write.
 *
 * `id` is the short, memorable identifier typed on the command line.
 * `spdx` points at the key used to pull the full text from `spdx-license-list`.
 * Every `alias` is also accepted (case-insensitive, plus a few common
 * spellings such as GitHub's `apache-2.0`).
 */

export interface LicenseEntry {
  /** Short identifier used on the command line. */
  id: string;
  /** Key into `spdx-license-list/full`. */
  spdx: string;
  /** Human readable name shown by `list`. */
  name: string;
  /** Alternative spellings accepted for this license. */
  aliases: string[];
}

export const CATALOG: readonly LicenseEntry[] = [
  { id: "mit", spdx: "MIT", name: "MIT License", aliases: [] },
  {
    id: "apache2",
    spdx: "Apache-2.0",
    name: "Apache License 2.0",
    aliases: ["apache", "apache-2.0", "asl2"],
  },
  {
    id: "gpl2",
    spdx: "GPL-2.0-only",
    name: "GNU General Public License v2.0",
    aliases: ["gpl-2.0", "gplv2", "gpl2.0"],
  },
  {
    id: "gpl3",
    spdx: "GPL-3.0-only",
    name: "GNU General Public License v3.0",
    aliases: ["gpl-3.0", "gplv3", "gpl3.0"],
  },
  {
    id: "agpl3",
    spdx: "AGPL-3.0-only",
    name: "GNU Affero General Public License v3.0",
    aliases: ["agpl", "agpl-3.0"],
  },
  {
    id: "lgpl3",
    spdx: "LGPL-3.0-only",
    name: "GNU Lesser General Public License v3.0",
    aliases: ["lgpl", "lgpl-3.0"],
  },
  {
    id: "lgpl21",
    spdx: "LGPL-2.1-only",
    name: "GNU Lesser General Public License v2.1",
    aliases: ["lgpl-2.1", "lgpl2.1", "lgpl2"],
  },
  {
    id: "mpl2",
    spdx: "MPL-2.0",
    name: "Mozilla Public License 2.0",
    aliases: ["mpl", "mpl-2.0"],
  },
  {
    id: "bsd2",
    spdx: "BSD-2-Clause",
    name: "BSD 2-Clause \"Simplified\" License",
    aliases: ["bsd-2-clause", "bsd-2"],
  },
  {
    id: "bsd3",
    spdx: "BSD-3-Clause",
    name: "BSD 3-Clause \"New\" / \"Revised\" License",
    aliases: ["bsd-3-clause", "bsd-3"],
  },
  { id: "isc", spdx: "ISC", name: "ISC License", aliases: [] },
  { id: "zlib", spdx: "Zlib", name: "zlib License", aliases: [] },
  {
    id: "unlicense",
    spdx: "Unlicense",
    name: "The Unlicense",
    aliases: ["unlicensed", "public-domain"],
  },
  {
    id: "cc0",
    spdx: "CC0-1.0",
    name: "Creative Commons Zero v1.0 Universal",
    aliases: ["cc0-1.0"],
  },
  {
    id: "epl2",
    spdx: "EPL-2.0",
    name: "Eclipse Public License 2.0",
    aliases: ["epl", "epl-2.0"],
  },
  { id: "wtfpl", spdx: "WTFPL", name: "Do What The F*ck You Want To Public License", aliases: [] },
  { id: "0bsd", spdx: "0BSD", name: "BSD Zero Clause License", aliases: ["zero-bsd"] },
  {
    id: "bsl1",
    spdx: "BSL-1.0",
    name: "Boost Software License 1.0",
    aliases: ["bsl", "boost"],
  },
  {
    id: "artistic2",
    spdx: "Artistic-2.0",
    name: "Artistic License 2.0",
    aliases: ["artistic", "art2"],
  },
  {
    id: "cddl1",
    spdx: "CDDL-1.0",
    name: "Common Development and Distribution License 1.0",
    aliases: ["cddl", "cddl-1.0"],
  },
] as const;

/** Lookup table from any accepted spelling to a catalog entry. */
const INDEX: ReadonlyMap<string, LicenseEntry> = (() => {
  const map = new Map<string, LicenseEntry>();
  for (const entry of CATALOG) {
    for (const key of [entry.id, entry.spdx, ...entry.aliases]) {
      map.set(key.toLowerCase(), entry);
    }
  }
  return map;
})();

/** Resolve a user supplied identifier (short id, SPDX id or alias). */
export function resolveLicense(input: string): LicenseEntry | undefined {
  return INDEX.get(input.trim().toLowerCase());
}

/** Every accepted spelling, for `list` and error hints. */
export function allIdentifiers(): string[] {
  return [...INDEX.keys()].sort();
}

/** Cheap edit distance used to suggest an identifier for typos. */
export function suggestLicense(input: string): LicenseEntry | undefined {
  const target = input.trim().toLowerCase();
  let best: LicenseEntry | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const entry of CATALOG) {
    for (const key of [entry.id, entry.spdx, ...entry.aliases]) {
      const score = distance(target, key.toLowerCase());
      if (score < bestScore) {
        bestScore = score;
        best = entry;
      }
    }
  }
  // Only suggest when the typo is plausible.
  return best && bestScore <= Math.max(2, Math.floor(target.length / 3)) ? best : undefined;
}

function distance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const prev = new Array<number>(cols);
  const curr = new Array<number>(cols);
  for (let j = 0; j < cols; j++) prev[j] = j;
  for (let i = 1; i < rows; i++) {
    curr[0] = i;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j < cols; j++) prev[j] = curr[j];
  }
  return prev[cols - 1];
}
