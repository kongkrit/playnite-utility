---
description: Bump the version shown on the page, commit all changes with it, and tag the commit
argument-hint: [version]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git describe:*), Bash(git tag:*), Bash(git add:*), Bash(git commit:*)
---
Bump the version to $ARGUMENTS, or, if that is empty, from vX.Y.Z to vX.Y.(Z+1). Run it after
/wrapup: it commits everything, so the release includes the new PROGRESS.md.

1. The current version is the `title` of the `<h1>` in `index.html`, shown when hovering over the
   page title. Stop and tell me if `git describe --tags --abbrev=0` names a different tag, or if
   `.claude/PROGRESS.md` has no uncommitted changes (run /wrapup first).
2. The new version gets a leading `v` if it lacks one. Stop and tell me if it isn't vX.Y.Z
   (numbers only) or is already a tag.
3. If `git status` shows untracked files, list them and ask before adding any. Check the diff for
   private info, per CLAUDE.md.
4. Put the new version in that `title`. Stage all changes and commit them. The message is a short
   summary of what this commit changes, with "Bump version to vX.Y.Z" as its last line. Then add a
   lightweight tag vX.Y.Z on that commit, like the existing tags.
5. Don't push. Tell me the command: `git push origin main vX.Y.Z`.
