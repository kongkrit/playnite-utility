# Progress

## Since v1.0.6

Six commits, all pushed to `main`. The `v1.0.6` tag itself is still local only.

- **Export pop-up** (`28add93`):
  - **Boxes:** each box, **List only modified entries** included, is ticked only for what changed on the page. On an unchanged list, none is ticked, and an amber note beside **List only modified entries** reads "The list hasn't been modified."
  - **add:** with no tag changes on the page, it lists every tag in the dropped file, so an export from one PC can tag the same games on another. **Tag name** is no longer the fallback. The add box fills the rest of its row (`.ps-fill`).
  - **Renames:** the **Set Hidden** tab and the pop-up's box are now **Hide/un-hide**, and `/version-bump` is now `/bump-version`.
- **Control bar** (`3d95c0b`):
  - It's two rows: filters on line 1, and on the three edit tabs, the target, count and **Export .csv** on line 2. The `|` separator is gone.
  - **Tag:** sits right after **Filter by name** on Set Completion Status and Tag too, and narrows only the left list.
  - On Filter, **Export unmatched** and **Export matched** sit in the list headers with `.btn.accent`, each followed by its count, like `(3)`.
- **Filters** (`97c63c1`):
  - **Filter by status** and **Source:** start at `<ANY>`.
  - **Filter by status** has `<NO STATUS>` (const `NO_STATUS`) for an empty Completion Status.
  - The width cap rose from 75rem to 100rem.
- **Tables** (`a6778de`):
  - `COLUMNS` is the one column list. Every tab shows Name, Hidden, Completion Status, Sources, Time Played and Tags under column names, Diff included.
  - The tab's own column shows its edit. `SET_VALUE.cell` gives `Playing → Completed` or `False → True`, and Tag keeps its strike-through.
  - Tags cells wrap. A click on the header row is ignored (`closest('tr[data-i]')`).
  - `.scroll`'s height limit is `100vh - 284px`.
- **Column hiding** (`ee08cc1`):
  - A container query on each `.lists section` hides columns below set list widths: Time Played at 46rem, Hidden at 40, Completion Status at 34, Tags at 26.
  - `render()` gives each cell the class `c-<key>`, except for the tab's own column. Name and Sources have no rule, so they always show. Diff is unaffected.
- **Page width** (`7aa69a1`):
  - **Narrow** and **Widen**, left of Settings, step `main`'s `max-width` by 10rem, from 40rem up to the window's width (`initWidth`). Each visit starts at the 100rem in `styles.css`, and nothing is saved.
  - The icons are `assets/narrow.svg` and `assets/widen.svg`. `.designs/width-icons.html` previews them, with an unused 4:3 pair embedded as `<symbol>`s.

Tested, in headless Edge on made-up CSVs, for every change above:

- the Export prefill and box ticking
- each tab's columns, labels and edits
- `<NO STATUS>` on Status, Filter and Diff
- which columns show at six window widths
- Narrow and Widen clicks at two window sizes and at 150% text size
- no page scroll with 100 rows

None of it has been run in Playnite's real console yet, including the PC-to-PC tag prefill.

## Current state

- **Release workflow:** work until the local copy is right, run `/wrapup`, then `/bump-version`. Push with the command it prints.
- **Icons:** `export.svg` and `gear.svg` are Lucide icons, and `narrow.svg` and `widen.svg` are drawn in the same style (24-unit grid, 1.5 stroke). All four load with `<img>`. An `<img>` can't inherit the page's text color, so each repeats the `--text` colors from `styles.css` through `light-dark()`. If those colors change, change all four.
- **Height limit:** the `284px` in `.scroll` was measured for the edit tabs: the top bar, two control lines, the list heading, and `main`'s 24px top and 48px bottom padding. Re-measure it whenever any of those change. Filter's and Diff's lists end about 34px and 92px above the bottom, because their bars are shorter.
- **Column hiding vs. page width:** all six columns need each list at least 46rem wide, which takes a `main` width of about 95rem. One Narrow click from the start (90rem) hides Time Played.
- **Testing without a browser window:** use headless Edge on a scratch copy of `index.html` with a `<base href>` that points at the repo. Any test script must sit inside a function, because `index.js` already declares a top-level `$`.
  - **Loading data:** load made-up CSVs by setting a file input's `files` through `DataTransfer` and firing `change`.
  - **Timing:** use `--virtual-time-budget` so async work finishes before `--dump-dom` or `--screenshot`. Virtual time runs ahead of `FileReader`, so wait until the page changes rather than for a fixed delay.
  - **Launching:** on Windows, launch Edge from the PowerShell tool with `Start-Process -RedirectStandardOutput`. Redirecting from Git Bash gave an empty dump.
  - **Theme:** headless Edge renders dark by default. `--blink-settings=preferredColorScheme=1` forces light.
  - **PowerShell variable names ignore case,** so a loop variable `$s` overwrites `$S`.
  - **Page scroll:** to check it, load about 100 rows. A few rows never fill the list.
- **Inline SVG in HTML:** the `hidden` attribute doesn't hide an inline `<svg>`. Hide a symbol container with a `display: none` class, which `<use>` still finds.
- **Testing a script without Playnite:** build a mock `$PlayniteApi` with `Add-Type`. Use C# classes shaped like the SDK, with `Tags.Add(string)`, `Games.Update(game)`, and a `Game.TagIds` that can be null. Run the script with `Invoke-Expression` in Windows PowerShell 5.1, as Playnite's console does.
- **Playnite SDK facts, confirmed in the real console:**
  - `$PlayniteApi.Database.Tags.Add(name)` returns the tag and creates it if it's new.
  - `Game.TagIds` is a `List<Guid>`, or null on a game with no tags.
  - Playnite exports a game's tags in its own order (alphabetical, it seems), not the order they were added. That's harmless, because the page compares tags regardless of order.

## Next steps

- **Release:** run `/bump-version` to commit this file and tag `v1.0.7`. Then push both tags with `git push origin main v1.0.6 v1.0.7`, because `v1.0.6` isn't on GitHub yet.
- **Test the PC-to-PC tag copy in Playnite's real console:**
  1. Drop an unedited export from another PC and open Export.
  2. Tick **Set tags**, with **List only modified entries** unticked.
  3. Paste the script, and check that the missing tags are created and added to the matching games.
- **Optional:** in the real console, remove a game's only tag, and check that the export shows its Tags empty. So far only the mock has tested this.
- **Optional:** let each list fill the height that's left, so Filter's and Diff's lists also reach the bottom and the `284px` constant goes away.

## Open questions

- **Column-hiding widths:** the 46, 40, 34 and 26rem cut-offs were judgment calls on made-up data. Should they be tuned after use on a real library?
- **Lucide credit:** the credit lines name only "Lucide Contributors". Lucide's license also credits Cole Bemis for parts that come from Feather. Add that name?
