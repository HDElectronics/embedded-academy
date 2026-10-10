<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Licensing

The repository follows the [REUSE specification](https://reuse.software/spec/). Every file states its copyright and license.

## Licenses by kind of file

| Kind of file                                    | License              |
| ----------------------------------------------- | -------------------- |
| Code: site, components, board data, lab scripts | `MIT`                |
| Lessons, docs, diagrams, captured logs          | `CC-BY-SA-4.0`       |
| Code or text quoted from an upstream project    | The upstream license |

License texts live in `LICENSES/`.

## SPDX header

Every new file starts with two SPDX tags in its comment syntax.

For code, in a language with `//` comments:

```text
// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT
```

For Markdown and MDX:

```text
<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->
```

For Python, YAML, shell and requirements files:

```text
# SPDX-FileCopyrightText: Embedded Academy contributors
# SPDX-License-Identifier: MIT
```

Files that can't hold comments, such as JSON and images, are covered in `REUSE.toml`.

## Upstream excerpts

Code quoted from an upstream project keeps its original license and copyright line. For example, an excerpt from the Linux kernel or U-Boot stays `GPL-2.0-only` when its source file says so. Never relicense it.

Never copy code or text from a source whose license you don't know.

## Check the headers

```bash
pnpm reuse
```

It runs `uvx --from "reuse[charset-normalizer]" reuse lint` and fails if any file lacks license information.
