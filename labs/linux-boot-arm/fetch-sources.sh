#!/bin/sh
# SPDX-FileCopyrightText: Embedded Academy contributors
# SPDX-License-Identifier: MIT
#
# Clones every project the course builds, at its pinned tag, into ~/work/src.
# Run it inside the lab container: sh ~/course/fetch-sources.sh
# Already cloned projects are left alone.

set -eu

. "$(dirname "$0")/versions.env"

dest=${DEST:-$HOME/work/src}
mkdir -p "$dest"

fetch() {
  name=$1 repo=$2 tag=$3
  if [ -d "$dest/$name/.git" ]; then
    echo "skip   $name (already in $dest/$name)"
    return
  fi
  echo "clone  $name at $tag"
  git clone --quiet --depth 1 --branch "$tag" "$repo" "$dest/$name"
}

fetch linux "$LINUX_REPO" "$LINUX_TAG"
fetch u-boot "$UBOOT_REPO" "$UBOOT_TAG"
fetch trusted-firmware-a "$TFA_REPO" "$TFA_TAG"
fetch optee_os "$OPTEE_REPO" "$OPTEE_TAG"
fetch buildroot "$BUILDROOT_REPO" "$BUILDROOT_TAG"
