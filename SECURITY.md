<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Security policy

## Report a vulnerability privately

Don't open a public issue for a security problem. Report it through GitHub's private vulnerability reporting instead:

1. Open the repository's **Security** tab.
2. Select **Report a vulnerability**.
3. Describe the problem, how to reproduce it and what an attacker could do with it.

Only the maintainers see the report. They reply there and agree the fix and its disclosure with you.

## Scope

In scope:

- the course site: `apps/site/` and the packages it ships
- the lab container and its scripts in `labs/`

Out of scope:

- errors in lesson content that are not security problems. Report those with the `inaccuracy` issue form.
- vulnerabilities in upstream projects the courses teach, such as the Linux kernel, U-Boot, TF-A or OP-TEE. Report those to the upstream project.

## Supported versions

The project is at `0.x`. Fixes go into `main` and ship with the next release.
