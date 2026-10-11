#!/bin/sh
# SPDX-FileCopyrightText: Embedded Academy contributors
# SPDX-License-Identifier: MIT
#
# Builds the lab image if needed and opens a shell in it. labs/work on your
# machine is ~/work inside the container, so sources and builds survive.
# Uses podman when it is installed, docker otherwise; set ENGINE to choose.

set -eu

here=$(cd "$(dirname "$0")" && pwd)
engine=${ENGINE:-$(command -v podman >/dev/null 2>&1 && echo podman || echo docker)}
image=embedded-academy-lab

mkdir -p "$here/work"
"$engine" build -t "$image" -f "$here/Containerfile" "$here"

# Rootless podman maps your user to root in the container unless told to keep it.
keep_id=""
[ "$engine" = podman ] && keep_id="--userns=keep-id"

# shellcheck disable=SC2086 # keep_id is empty or one word
exec "$engine" run --rm -it $keep_id --hostname lab \
  -v "$here/work:/home/learner/work" \
  -v "$here/linux-boot-arm:/home/learner/course:ro" \
  "$image" bash
