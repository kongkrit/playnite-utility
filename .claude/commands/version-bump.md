---
description: Bump the version shown on the page, commit it, and tag the commit
argument-hint: [version]
allowed-tools: Bash(git status:*), Bash(git describe:*), Bash(git tag:*), Bash(git add:*), Bash(git commit:*)
---
Bump the version to $ARGUMENTS, or, if that is empty, from vX.Y.Z to vX.Y.(Z+1).

1. The current version is the `title` of the `<h1>` in `index.html`, shown when hovering over the
   page title. Stop and tell me if the working tree has uncommitted changes, or if
   `git describe --tags --abbrev=0` names a different tag.
2. The new version gets a leading `v` if it lacks one. Stop and tell me if it isn't vX.Y.Z
   (numbers only) or is already a tag.
3. Put the new version in that `title`, commit only `index.html` as "Bump version to vX.Y.Z", then
   add a lightweight tag vX.Y.Z on that commit, like the existing tags.
4. Don't push. Tell me the command: `git push origin main vX.Y.Z`.
