<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Set up the GitHub Project

This guide creates the **Embedded Academy** GitHub Project with its fields, milestones and labels. You run it once, when you set up the repository or a fork that needs its own tracking.

The setup is scripted in `scripts/github/setup-project.sh`. The script is the source of truth for labels, milestones and field options. [Project fields](../reference/project-fields.md) describes what they mean.

The script is safe to re-run: it skips anything that already exists and never changes or deletes it.

## Check what you need

- Admin access to the repository, and permission to create projects for its owner.
- The GitHub CLI, `gh`, signed in to your account.
- `jq`.
- `bash`. On Windows, use Git Bash.
- The repository, already created on GitHub. The script names the owner and repository in its `OWNER` and `REPO` variables; change them first if you set up a fork.

## Give `gh` the project scope

Project commands need the `project` token scope, which a default `gh auth login` doesn't request. Add it:

```bash
gh auth refresh -s project
```

Check that the scope is present:

```bash
gh auth status
```

The output lists `project` among the token scopes.

## Run the setup script

Read the script before you run it, because it creates resources on GitHub. Then run it from the repository root:

```bash
bash scripts/github/setup-project.sh
```

The script prints one line for each label, milestone and field it creates or skips. At the end it prints the project URL and a list of steps it can't do through the API.

## Check the result

1. List the owner's projects and note the new project's number:

   ```bash
   gh project list --owner <owner>
   ```

2. List the project's fields:

   ```bash
   gh project field-list <number> --owner <owner>
   ```

   You see Status, Priority, Size and Verification. Status has the options Todo, In progress, In review and Done.

3. Open the repository's milestones page. You see M1 to M6.
4. Start a new issue. You see the issue forms.

## Finish the manual steps

The GitHub API can't create project views or turn on built-in workflows. Open the project URL the script printed and follow the list it printed:

1. Create the views it names.
2. In the project's **Workflows** settings, turn on the workflows it lists. They move an item to **In review** when a pull request opens and to **Done** when it merges.
3. Apply the repository settings it lists, such as squash-only merging and branch protection on `main`. Changing these needs the maintainer's approval.
