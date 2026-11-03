# Progress

## Since v1.0.5

No commits since the tag, and `main` matches `origin/main`. Uncommitted:

- The **Set Tag** tab is now **Tag**, and its command bar label **Apply Tag:** is now **Tag name:**.
- On the Tag tab, clicking a game on the right list removes the tag, even one the file had. The heading reads `Tagged "…" (n) · click to un-tag`.
  - The game moves left with the lost tag struck through, like `Other, <s>Old</s>`, and its row is highlighted as changed.
  - Adding the tag back restores the file's cell exactly, in the file's order (`tagCell`), so the row no longer counts as changed.
  - `MODES.tag.cell` returns a DocumentFragment, so `render()` now uses `append(x ?? '')`. `append` still inserts a string as text.
- In the Export pop-up, **Add tags** is now **Set tags:** with two boxes, **add** and **remove**.
  - The script adds each **add** tag to the listed games whose Tags contain it, and removes each **remove** tag from the listed games whose Tags lack it. Tags in neither box are left alone.
  - When the pop-up opens, **add** and **remove** hold the tags added and removed on the page. If no tags changed, **add** gets **Tag name**.
  - Remove skips a tag Playnite doesn't have and a game with no tags. Without that skip, `$null -notcontains $null` is false, and `.Remove()` was called on null.
- The help text in `index.html` and `README.md` describe all of the above.

Tested:

- **Headless Edge on a made-up CSV:** the tab, clicks, strike-through, prefill, the downloaded CSV, and all three script variants.
- **The scripts against a mock `$PlayniteApi`:** adds, removes, games with null `TagIds`, a second paste reporting `tagged 0`, and no stray output.
- **Playnite's real console:** one paste removed a tag from one game and added a new tag to it, added tags to a game with no tags, created the new tag, and left an unlisted game alone.

## Current state

- **Release workflow:** work until the local copy is right, run `/wrapup`, then `/version-bump`. Push with the command it prints.
- `export.svg` and `gear.svg` are Lucide SVGs loaded with `<img>`. An `<img>` can't inherit the page's text color, so each repeats the `--text` colors from `styles.css` through `light-dark()`. If those colors change, change both icons too.
- To test without a browser window, use headless Edge on a scratch copy of `index.html` with a `<base href>` that points at the repo. Any test script must sit inside a function, because `index.js` already declares a top-level `$`.
  - Load made-up CSVs by setting a file input's `files` through `DataTransfer` and firing `change`.
  - Use `--virtual-time-budget` so async work finishes before `--dump-dom` or `--screenshot`.
  - Virtual time runs ahead of `FileReader`, so wait until the page changes rather than for a fixed delay.
  - On Windows, launch Edge from the PowerShell tool with `Start-Process -RedirectStandardOutput`. Redirecting from Git Bash gave an empty dump.
- To test a script without Playnite, build a mock `$PlayniteApi` with `Add-Type`: C# classes shaped like the SDK, with `Tags.Add(string)`, `Games.Update(game)`, and a `Game.TagIds` that can be null. Run the script with `Invoke-Expression` in Windows PowerShell 5.1, as Playnite's console does.
- These Playnite SDK facts were confirmed in the real console:
  - `$PlayniteApi.Database.Tags.Add(name)` returns the tag and creates it if it's new.
  - `Game.TagIds` is a `List<Guid>`, or null on a game with no tags.
  - Playnite exports a game's tags in its own order (alphabetical, it seems), not the order they were added. This is harmless, because the page compares tags regardless of order.

## Next steps

- Run `/version-bump` to commit this work and tag `v1.0.6`, then push with the command it prints.
- Optional: in the real console, remove a game's only tag, and check that the export shows its Tags empty. So far only the mock has tested this.

## Open questions

- The Lucide credit lines name only "Lucide Contributors". Lucide's license also credits Cole Bemis for parts that come from Feather. Add that name?
- Should **add** start with every tag in the listed rows, instead of only the tags changed on the page? It was offered but not decided.
