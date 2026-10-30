# Progress

## Last session (2026-10-30)

- Tagged `v1.0.0` on `4b85a74`. Committed the session's work as `73718d7` and tagged it `v1.0.1`. Neither the commits nor the tags are pushed.
- Moved `index.js`, `styles.css` and `icon.svg` into `assets/`. `playnite-utility.ico` stays at the root.
- **What?** gained an **Import from** choice. **current content** (the default) embeds the page's rows in the script as a CSV here-string piped to `ConvertFrom-Csv`. It keeps only `Name`, `Sources` and the ticked columns, so no export is needed. **a .csv** works as before, and the path box shows only for it. The script box is capped at 30rem and scrolls.
- The theme button flips between light and dark (`sun.svg`, `moon.svg`). It starts from the system setting and saves nothing; the user asked for no `localStorage`. After load it ignores OS changes, so it never flips on its own.
- The **What?** button is now an icon (`export.svg`), with alt text "What?".
- `.claude/CLAUDE.md`: the `## Layout` section now lists the page files. A new convention says the page must work from `file://`, so it loads files only with `<link>`, `<script>` and `<img>`.

## Current state

- The root holds `index.html` (the page, opened by double-clicking), `README.md`, `LICENSE` and `playnite-utility.ico`. Everything the page loads is in `assets/`.
- The icons are Lucide SVGs loaded with `<img>`. An `<img>` can't inherit the page's text color, so each icon repeats the `--text` colors from `styles.css` through `light-dark()`. Change those colors in all three icons too.
- To test without a browser window, use headless Edge (`msedge --headless --screenshot` or `--dump-dom`) on a scratch copy of `index.html` with a `<base href>` that points at the repo. Any test script must sit inside a function: `index.js` already declares a top-level `$`.

## Next steps

- Push when ready: `git push origin main v1.0.0 v1.0.1`.
- Paste a **current content** script into Playnite's real console with the full library. Check that `matched` ≈ `rows`, and that a large paste (~100 bytes per game) isn't slow.

## Open questions

- Recent commit messages don't use conventional-commit prefixes, but `/wrapup` asks for them. Which style should the repo follow?
- The Lucide credit lines name only "Lucide Contributors". Lucide's license also credits Cole Bemis for parts that come from Feather. Add that name?
