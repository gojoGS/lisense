/** Recognising existing license files and guessing their license from content. */

import { CATALOG } from "./catalog.ts";

/** Filenames GitHub treats as a license, plus the usual COPYING variants. */
const LICENSE_FILE = /^(?:licen[cs]e|copying)(?:[._-][\w.-]+)?(?:\.(?:md|txt|rst))?$/i;

export function isLicenseFileName(name: string): boolean {
  return LICENSE_FILE.test(name);
}

/** Ordered matchers; first hit wins, so the more specific licenses come first. */
const MATCHERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/GNU AFFERO GENERAL PUBLIC LICENSE/i, "agpl3"],
  [/GNU LESSER GENERAL PUBLIC LICENSE[\s\S]*?Version 3/i, "lgpl3"],
  [/GNU LESSER GENERAL PUBLIC LICENSE/i, "lgpl21"],
  [/GNU GENERAL PUBLIC LICENSE[\s\S]*?Version 3/i, "gpl3"],
  [/GNU GENERAL PUBLIC LICENSE/i, "gpl2"],
  [/Apache License[\s\S]{0,40}?Version 2\.0/i, "apache2"],
  [/Mozilla Public License[\s\S]{0,20}?Version 2\.0/i, "mpl2"],
  [/Eclipse Public License[\s\S]{0,20}?2\.0/i, "epl2"],
  [/COMMON DEVELOPMENT AND DISTRIBUTION LICENSE/i, "cddl1"],
  [/Boost Software License/i, "bsl1"],
  [/The Artistic License 2\.0/i, "artistic2"],
  [/DO WHAT THE F.{0,3}CK YOU WANT/i, "wtfpl"],
  [/CC0 1\.0 Universal/i, "cc0"],
  [/This is free and unencumbered software released into the public domain/i, "unlicense"],
  [/Permission is hereby granted, free of charge, to any person obtaining a copy/i, "mit"],
  [/Permission to use, copy, modify, and\/or distribute this software for any purpose/i, "0bsd"],
  [/Permission to use, copy, modify, and distribute this software for any purpose/i, "isc"],
  [/Redistribution and use in source and binary forms/i, "bsd2"],
  [/This software is provided 'as-is', without any express or implied warranty/i, "zlib"],
];

const DISPLAY = new Map(CATALOG.map((entry) => [entry.id, entry.name]));

/**
 * Guess the license id from the text of a license file.
 * Returns `undefined` when nothing familiar matches.
 *
 * Matching is limited to the top of the file: license texts mention each other
 * in their body (GPLv3 talks about the Affero license in section 13, for
 * example), so only the opening lines identify the license itself.
 */
export function detectLicenseId(text: string): string | undefined {
  const head = text.replace(/\r\n/g, "\n").slice(0, 8000);
  for (const [pattern, id] of MATCHERS) {
    if (pattern.test(head)) {
      // Three-clause BSD is the two-clause text plus the endorsement clause.
      if (id === "bsd2" && /Neither the name of/i.test(head)) return "bsd3";
      if (id === "0bsd" && /provided that the above copyright notice/i.test(head)) return "isc";
      return id;
    }
  }
  return undefined;
}

export function licenseDisplayName(id: string): string | undefined {
  return DISPLAY.get(id);
}
