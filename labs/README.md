<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Labs

The lab container holds everything the courses build with: cross compilers for 64-bit and 32-bit Arm, QEMU, and the build dependencies of U-Boot, TF-A, OP-TEE, Linux and Buildroot. It is based on Debian 13 (trixie).

## Start the lab

You need Podman or Docker. From the repository root:

```sh
sh labs/lab.sh
```

The script builds the image the first time, then opens a shell as `learner` on host `lab`:

- `~/work` inside the container is `labs/work` on your machine, so sources and builds survive when the container stops.
- `~/course` is the course folder, read-only.

## Fetch the sources

Inside the container:

```sh
sh ~/course/fetch-sources.sh
```

It clones each project at the version in `linux-boot-arm/versions.env` into `~/work/src`.

## Status

The container and scripts are not built or run in CI yet. Until someone runs a lab in this container and records it in the lesson's frontmatter, every lab command stays marked `unverified`. If a step fails for you, open an issue with the `inaccuracy` form.
