---
description: Rewrite .claude/PROGRESS.md with the changes since the latest tag
---
Rewrite .claude/PROGRESS.md from scratch with these sections:

- `## Since <tag>`: what changed since the latest tag (`git describe --tags --abbrev=0`): the
  commits in `git log <tag>..HEAD` plus uncommitted changes. With no tag, the whole history.
- `## Current state`, `## Next steps`, `## Open questions`.

Replace the whole file. Don't keep earlier sessions or describe older versions; the tags and git
history hold those.

Never stage or commit.
