# lisense

## Install

```sh
bun install -g @gojogs/lisense
```

## Usage

```sh
lisense add mit              # write LICENSE in the current directory
lisense add mit -n "Ada" -y 2026
lisense add mit --force      # overwrite an existing LICENSE
lisense list                 # list supported licenses
lisense list --json
lisense check                # check this directory and git repository
lisense check --json
lisense explain mit          # print the license text to stdout
```

## Help

```sh
lisense add --help
lisense list --help
lisense check --help
lisense explain --help
```

## Supported licenses

`0bsd`, `agpl3`, `apache2`, `artistic2`, `bsd2`, `bsd3`, `bsl1`, `cc0`,
`cddl1`, `epl2`, `gpl2`, `gpl3`, `isc`, `lgpl3`, `lgpl21`, `mit`, `mpl2`,
`unlicense`, `wtfpl`, `zlib`.

Aliases: `GPL-3.0`, `apache-2.0`, `lgpl-2.1`, `boost`, `zero-bsd`.

## Development

```sh
bun test
bun run typecheck
```
