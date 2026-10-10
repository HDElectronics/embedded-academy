#!/usr/bin/env bash
# SPDX-FileCopyrightText: Embedded Academy contributors
# SPDX-License-Identifier: MIT
#
# One-time setup of the GitHub side of Embedded Academy: labels, milestones
# and the "Embedded Academy" GitHub Project with its custom fields.
#
# Safe to re-run: anything that already exists is skipped, never changed or
# deleted. Needs the gh CLI logged in with the `repo` and `project` scopes:
#   gh auth refresh -s project
#
# Usage: scripts/github/setup-project.sh

set -euo pipefail

OWNER="HDElectronics"
REPO="${OWNER}/embedded-academy"
PROJECT_TITLE="Embedded Academy"

say() { printf '%s\n' "$*"; }

command -v gh >/dev/null 2>&1 || { say "error: gh CLI not found"; exit 1; }
command -v jq >/dev/null 2>&1 || { say "error: jq not found"; exit 1; }
gh auth status >/dev/null 2>&1 || { say "error: gh is not logged in (gh auth login)"; exit 1; }
gh repo view "$REPO" --json name >/dev/null 2>&1 || {
  say "error: repository $REPO not found or not accessible; create it first"
  exit 1
}

# ---------------------------------------------------------------------------
# Labels. Colours are Tango palette values (no leading #).
# ---------------------------------------------------------------------------
say "== Labels"

# name|colour|description
LABELS=(
  "type:feat|8ae234|New feature or component"
  "type:content|729fcf|Lesson text, labs or captured logs"
  "type:fix|ef2929|Bug fix or wrong technical fact"
  "type:docs|fce94f|Repository documentation (not lessons)"
  "type:refactor|ad7fa8|Code change without behaviour change"
  "type:test|34e2e2|Tests only"
  "type:build|fcaf3e|Build system or dependencies tooling"
  "type:ci|e9b96e|CI workflows"
  "type:chore|babdb6|Maintenance"
  "area:site|3465a4|Astro site: routes, layouts, search"
  "area:anim|75507b|Animation components (packages/anim)"
  "area:ui|06989a|Design system (packages/ui)"
  "area:boards|c17d11|Board data and schemas (packages/boards)"
  "area:labs|73d216|Lab container, QEMU scripts, lab sources"
  "area:docs|edd400|Sphinx docs in docs/"
  "area:content|204a87|Lessons in content/"
  "area:deps|888a85|Dependency updates"
  "board:rpi4|a40000|Raspberry Pi 4"
  "board:bbb|ce5c00|BeagleBone Black (AM335x)"
  "board:stm32mp157|5c3566|STM32MP157 DK2"
  "module:m00|eeeeec|Module 00"
  "module:m01|eeeeec|Module 01"
  "module:m02|eeeeec|Module 02"
  "module:m03|c4a000|Module 03"
  "module:m04|c4a000|Module 04"
  "module:m05|c4a000|Module 05"
  "module:m06|4e9a06|Module 06"
  "module:m07|4e9a06|Module 07"
  "module:m08|f57900|Module 08"
  "module:m09|8f5902|Module 09"
  "module:m10|8f5902|Module 10"
  "good first issue|d3d7cf|Small, well-scoped task for a new contributor"
)

existing_labels=$(gh label list --repo "$REPO" --limit 1000 --json name --jq '.[].name')

for entry in "${LABELS[@]}"; do
  IFS='|' read -r name colour description <<<"$entry"
  if grep -Fxq -- "$name" <<<"$existing_labels"; then
    say "skip    label '$name' (exists)"
  else
    gh label create "$name" --repo "$REPO" --color "$colour" --description "$description" >/dev/null
    say "created label '$name'"
  fi
done

# ---------------------------------------------------------------------------
# Milestones
# ---------------------------------------------------------------------------
say "== Milestones"

# title|description
MILESTONES=(
  "M1 Foundation|Repository, tooling, CI, design system, board data schemas and site skeleton"
  "M2 Modules 00-02|Modules 00 to 02"
  "M3 Modules 03-05|Modules 03 to 05: TrustZone, first stage, TF-A"
  "M4 Modules 06-07|Modules 06 and 07: U-Boot and Device Tree"
  "M5 Module 08|Module 08: Building"
  "M6 Modules 09-10|Modules 09 and 10: Linux start-up and capstones"
)

existing_milestones=$(gh api --paginate "repos/${REPO}/milestones?state=all&per_page=100" --jq '.[].title')

for entry in "${MILESTONES[@]}"; do
  IFS='|' read -r title description <<<"$entry"
  if grep -Fxq -- "$title" <<<"$existing_milestones"; then
    say "skip    milestone '$title' (exists)"
  else
    gh api --method POST "repos/${REPO}/milestones" \
      -f title="$title" -f description="$description" -f state=open >/dev/null
    say "created milestone '$title'"
  fi
done

# ---------------------------------------------------------------------------
# GitHub Project
# ---------------------------------------------------------------------------
say "== Project"

project_number=$(gh project list --owner "$OWNER" --limit 100 --format json \
  --jq ".projects[] | select(.title == \"${PROJECT_TITLE}\") | .number" | head -n 1)

if [ -n "$project_number" ]; then
  say "skip    project '$PROJECT_TITLE' (exists, #$project_number)"
else
  project_number=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json --jq '.number')
  say "created project '$PROJECT_TITLE' (#$project_number)"
fi

fields_json=$(gh project field-list "$project_number" --owner "$OWNER" --limit 100 --format json)

# name|comma-separated options
FIELDS=(
  "Priority|P0,P1,P2"
  "Size|S,M,L"
  "Verification|unverified,emulated,hardware"
)

for entry in "${FIELDS[@]}"; do
  IFS='|' read -r name options <<<"$entry"
  if jq -e --arg n "$name" '.fields[] | select(.name == $n)' <<<"$fields_json" >/dev/null; then
    say "skip    field '$name' (exists)"
  else
    gh project field-create "$project_number" --owner "$OWNER" --name "$name" \
      --data-type SINGLE_SELECT --single-select-options "$options" >/dev/null
    say "created field '$name' ($options)"
  fi
done

# Status exists by default with Todo, In Progress, Done. Set it to
# Todo, In progress, In review, Done, keeping the ids of matching options so
# items that already have a status keep it. Only runs when the options differ.
status_id=$(jq -r '.fields[] | select(.name == "Status") | .id' <<<"$fields_json")
current_status=$(jq -r '[.fields[] | select(.name == "Status") | .options[].name] | join(",")' <<<"$fields_json")
wanted_status="Todo,In progress,In review,Done"

if [ -z "$status_id" ]; then
  say "warn    Status field not found; set its options by hand (see manual steps)"
elif [ "$current_status" = "$wanted_status" ]; then
  say "skip    Status options (already $wanted_status)"
else
  option_id() {
    # Case-insensitive match so "In Progress" keeps its id as "In progress".
    jq -r --arg n "$1" '.fields[] | select(.name == "Status") | .options[]
      | select((.name | ascii_downcase) == ($n | ascii_downcase)) | .id' <<<"$fields_json" | head -n 1
  }
  options_json=$(jq -n \
    --arg todo "$(option_id 'Todo')" \
    --arg prog "$(option_id 'In progress')" \
    --arg rev "$(option_id 'In review')" \
    --arg fin "$(option_id 'Done')" '
    def opt($id; $name; $color; $desc):
      {name: $name, color: $color, description: $desc}
      + (if $id == "" then {} else {id: $id} end);
    [ opt($todo; "Todo"; "GRAY"; "Not started"),
      opt($prog; "In progress"; "YELLOW"; "Someone is working on it"),
      opt($rev;  "In review"; "BLUE"; "Pull request open"),
      opt($fin; "Done"; "GREEN"; "Merged or closed") ]')
  jq -n --arg id "$status_id" --argjson opts "$options_json" '{
    query: "mutation($input: UpdateProjectV2FieldInput!) { updateProjectV2Field(input: $input) { projectV2Field { ... on ProjectV2SingleSelectField { name options { name } } } } }",
    variables: { input: { fieldId: $id, singleSelectOptions: $opts } }
  }' | gh api graphql --input - >/dev/null
  say "updated Status options: $current_status -> $wanted_status"
fi

# Link the project to the repository so it shows in the repo's Projects tab.
project_url=$(gh project view "$project_number" --owner "$OWNER" --format json --jq '.url')
linked=$(gh repo view "$REPO" --json projectsV2 \
  --jq ".projectsV2.Nodes[] | select(.url == \"${project_url}\") | .number")
if [ -n "$linked" ]; then
  say "skip    link project #$project_number to $REPO (already linked)"
else
  gh project link "$project_number" --owner "$OWNER" --repo "$REPO" >/dev/null
  say "linked  project #$project_number to $REPO"
fi

cat <<EOF

Done. Finish these steps by hand in the web UI: $project_url

Views (the API cannot create or configure project views):
  1. Board       Board layout, group by Status (Todo, In progress, In review, Done).
  2. Roadmap     Roadmap layout, grouped or sliced by Milestone (M1-M6).
  3. Course map  Table, filter label:"area:content", group by Milestone, show
                 Labels (module:* and board:*), Status and Verification.
  4. Accuracy    Table, filter label:"type:fix" label:"area:content", group by
                 Verification, sort by Priority.
  5. Triage      Table, filter no:priority (save a second filter no:size or
                 no:status if useful), sorted by creation date.

Built-in workflows (project menu > Workflows), turn on:
  - Item added to project       -> Status: Todo
  - Item reopened               -> Status: Todo
  - Pull request linked to issue (or opened) -> Status: In review
  - Item closed                 -> Status: Done
  - Pull request merged         -> Status: Done
  - Auto-add to project         -> repo:${REPO}, filter is:issue,pr is:open

Repository settings that this script does not touch:
  - Enable Discussions (the issue chooser links to them).
  - Merge button: allow squash merging only; allow auto-merge (Renovate).
  - Branch protection or a ruleset on main: require PRs and these checks:
    lint, typecheck, test, build, e2e, lighthouse, docs, reuse, dco, pr-title.
  - Install the Renovate GitHub App on the repository.
  - Connect Cloudflare Pages and Read the Docs through their GitHub integrations.
EOF
