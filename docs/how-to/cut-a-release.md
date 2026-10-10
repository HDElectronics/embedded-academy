<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Cut a release

This guide publishes a new version of Embedded Academy. Releases are a maintainer task.

You don't choose the version number or write the changelog. [release-please](https://github.com/googleapis/release-please) reads the Conventional Commits on `main` and prepares both in a release pull request.

## Review the release pull request

1. Open the release pull request that release-please keeps up to date.
2. Check the proposed version against the commits since the last release:
   - `feat` bumps the minor version.
   - `fix` and `content` bump the patch version.
   - `BREAKING CHANGE`, such as a changed lesson URL, bumps the major version.

   Versions stay at `0.x` until the first course is complete.
3. Read the generated `CHANGELOG.md` entry. If an entry is wrong, correct the commit message it comes from with the method the release-please documentation gives. Never edit `CHANGELOG.md` by hand.

## Confirm that `main` is releasable

1. Check that every required check on the release pull request is green.
2. Check that no lesson meant for this release still has `draft: true`.
3. Check that every moved lesson leaves a redirect. Lesson URLs are permanent.

## Merge the release pull request

Squash-merge the release pull request. release-please then tags the commit and creates the GitHub release.

## Check the deployments

1. Cloudflare Pages deploys `main` through its GitHub integration. Open the production deployment and check the site.
2. Read the Docs builds the docs from `main`. Check that the build passed.
