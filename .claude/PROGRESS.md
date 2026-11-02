# Progress

## Since v1.0.4

Committed, not pushed (`main` is 4 ahead of `origin/main`):

- `5bd5c23` **Diff** keeps both drop boxes up until both lists are in, then shows only the diff list. A box with a list shows `N games, N hidden, N with tags`. Clicking it or dropping again replaces that list. A bad file on the left box no longer clears the list already loaded there.
- `6ffbb79` The Export pop-up (then called What?) has **List only modified entries**, ticked by default and shown only with **current content**. The script then lists only the games whose ticked columns differ from the dropped file, so a large library doesn't paste thousands of rows into Playnite's console. Games Diff added count as modified. With none, a hint replaces the script and Copy is disabled.
- `11ad6f7` The theme button is now a gear (`assets/gear.svg`, Lucide "settings") that opens **Settings**. `sun.svg` and `moon.svg` are deleted.
  - **Theme:** System / Dark / Light, styled like the top tabs. System removes `data-theme`, so the page follows the OS, even live.
  - **Text size:** Smaller / Default / Larger set `<html>`'s font size in 10% steps, from 50% to 200%. It uses a percent, so the browser's font setting stays the base.
  - Nothing is saved. Both pop-ups share the `dialog` styles. `initTabs(group, onSelect)` now works on one group of tabs at a time.
- `a29dcd0`:
  - The Diff export buttons use the selected-tab colors, with normal-weight text: `.btn.accent` shares the `.tab.active` rule.
  - The labels say which list is which. The drop boxes read "(original - left)" and "(new - right)". The export buttons read "Export diff against (original) list" and "Export working (new) list", because the table already shows left and right.
  - `/wrapup` rewrites this file with only the changes since the latest tag, and never stages or commits.
  - `/version-bump` commits all changes with the version change, then tags that commit. It stops if this file has no uncommitted changes, and asks before adding untracked files. `.claude/CLAUDE.md` describes both commands this way.

Uncommitted:

- The **What?** button is now **Export**: alt text "Export", tooltip "Export to Playnite", and pop-up heading "Export". Its id is `export-open`, because `export` is the **Export .csv** button. Code comments, the README and `.claude/CLAUDE.md` say Export too.
- The page overview in that pop-up is a collapsible **What is this page?** section (`<details id="about">`). It starts collapsed each time the pop-up opens, except on **Filter**, where it is all the pop-up holds.

## Current state

- Release workflow: work until the local copy is right, run `/wrapup`, then `/version-bump`. Push with the command it prints.
- `export.svg` and `gear.svg` are Lucide SVGs loaded with `<img>`. An `<img>` can't inherit the page's text color, so each repeats the `--text` colors from `styles.css` through `light-dark()`. If those colors change, change both icons too.
- To test without a browser window, use headless Edge on a scratch copy of `index.html` with a `<base href>` that points at the repo. Any test script must sit inside a function, because `index.js` already declares a top-level `$`.
  - Load made-up CSVs by setting a file input's `files` through `DataTransfer` and firing `change`.
  - Use `--virtual-time-budget` so async work finishes before `--dump-dom` or `--screenshot`.
  - Virtual time runs ahead of `FileReader`, so wait until the page changes rather than for a fixed delay.

## Next steps

- Run `/version-bump` to commit the uncommitted work and tag `v1.0.5`, then `git push origin main v1.0.5`.
- Paste a **current content** script into Playnite's real console. Check that `matched` ≈ `rows`, with and without **List only modified entries**.

## Open questions

- The Lucide credit lines name only "Lucide Contributors". Lucide's license also credits Cole Bemis for parts that come from Feather. Add that name?
