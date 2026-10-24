# CLAUDE.md

Guidance for Claude Code in this repository.

## Public repo — privacy — IMPORTANT

This repo is **public** (`kongkrit/playnite-utility` on GitHub). It is a new repo, not the similarly named one it was started from. Anyone can read every tracked file, commit message, PR, and issue, and git history keeps a leak even after a later commit deletes it.

- **Never write private info into a tracked file, commit message, PR, or issue.** Private info includes real CSV file names and their paths (the user's Playnite exports), anything from the user's game library (titles, tags, hours played), local paths, usernames, machine names, email addresses, and tokens or keys. If unsure, treat it as private and ask.
- **Use placeholders** like the existing ones: `D:\path\to\exported.csv`, `games-status_YYYYMMDD_HHMM.csv`, `Example Game`.
- `.claude/PROGRESS.md` and this file are tracked too, so `/wrapup` handoffs follow the same rule.
- `*.csv` stay gitignored. Never un-ignore them or force-add one (`git add -f`).
- **WARN HARD:** if private info is in a tracked file, or about to go into one, stop before writing or committing. Start your reply with a bold **⚠️ PRIVACY WARNING** line that names the file and the text. If it is already committed, say that removing it means rewriting history and force-pushing, and that anything already pushed may have been copied. Never rewrite history without asking.

## Code principles — IMPORTANT

**All code MUST be SIMPLE, MINIMAL, EASY TO UNDERSTAND, and DRY.** These rules come before cleverness, speculative flexibility, and personal style.

- **Simple:** use the most straightforward approach that works. No clever tricks, premature abstraction, or premature optimization.
- **Minimal:** write only what the task needs. No speculative features, unused options, or "just in case" code. Fewer lines, files, and dependencies win. Delete dead code.
- **Easy to understand:** a newcomer should follow it on first read. Clear names, small functions, shallow nesting, obvious control flow.
- **DRY:** one source of truth for each piece of logic, data, and config. Search for existing code to reuse before writing new code; never copy-paste logic. Extract it once instead.
- **When in doubt, choose the simpler option.** Before finishing, re-read your diff and cut anything that isn't needed.

## CSS

Vanilla CSS, no frameworks. Pick each unit by asking whether the value should grow when the user raises the browser's default font size. If yes, use `rem`; use `em` only for a value tied to the element's own text, such as `letter-spacing`. If no, use `px`.

- **Colors:** define them once as custom properties on `:root`, each as `light-dark(light, dark)` so one line covers both themes. Add a custom property for any other value only when several rules share it and should change together.
- **Font size:** `rem`. Never `px`, and never a `px` font size on `html`, because it overrides the user's browser setting. Avoid `em` font sizes: nested ones compound, so `0.8em` three levels deep gives 0.8³ ≈ 0.51 of the base size.
- **Line height:** unitless (`1.5`), so children inherit the ratio, not a fixed length.
- **Spacing** (margin, padding, gap): `rem`.
- **Borders, outlines, shadows, corner radii:** `px`.
- **Widths:** let flex and grid share the space (`%`, `fr`). To cap a width, use `rem`. Use `ch` only for a column of plain prose, since `ch` is the width of the font's "0" and changes with the font.
- **Breakpoints:** `em`, so they move with the user's font size. Inside media queries, `em` always means the browser default size, not the `html` rule.
- **Selectors:** keep specificity low: one class, optionally with a state (`.tab.active`, `:hover`), one element below it (`.games td`), or both (`.games tr:hover`). Element selectors only for base styles (`body`, form controls). No IDs or `!important`.
- Apply these to properties you write or edit. Don't rewrite working CSS only to conform.
- **Simple wins:** if following a rule here would make the CSS longer or more complicated, choose the simple, short, performant, DRY version instead.

## How to explain things

These rules apply to explanations to the user and to code comments, not to commit messages.

For code comments:
- Explain why and the mechanism; don't restate what the code plainly does.
- Define a term once, at its first use in the file.
- Add a worked numeric example only for non-obvious math (scaling, units, bit layouts).
- Keep comments as short as the point allows; "Simple", "Minimal", "Easy to understand", and "DRY" still apply.

Audience: someone with a BS in EE who remembers the fundamentals (circuits, signals, calculus, basic probability and statistics) but not every formula or every field's jargon. Write for a sharp engineer outside the specialty.

Goal: as simple as possible, without saying anything false.

1. Start with the plain-language answer in 1-2 sentences, then the reasoning.
2. Explain the mechanism (what causes what) in words before any math.
3. Define each technical term the first time it appears, in a short phrase. Introduce as few new terms as possible.
4. Use an equation only when it makes the point clearer than words. If you use one, define every symbol and show one worked example with real numbers.
5. Prefer a concrete numeric example over abstract notation.
6. Use an analogy (EE analogies are welcome) only if it maps accurately, and say where it breaks down.
7. When you simplify, say what you left out and when it would matter.
8. No handwaving: back each claim with a reason, a number, or a source. If the answer depends on something, say what. If unsure, say so.
9. Before sending, check: could I follow this on the first read without looking anything up? If not, rewrite it.

## Layout

- `.claude/settings.json` — committed settings (`model: opus`, `effortLevel: xhigh`), permission allowlist, and a `SessionStart` hook that prints `.claude/PROGRESS.md` into context. Personal overrides go in the gitignored `.claude/settings.local.json`, never here.
- `.claude/commands/wrapup.md` — `/wrapup`: writes a session handoff to `.claude/PROGRESS.md`, then commits.
- `.claude/PROGRESS.md` — session handoff maintained by `/wrapup`.
- `.gitignore`, `.gitattributes` — ignore rules; LF line endings (CRLF kept for `*.csv`) and binary file types.
- `README.md`, `LICENSE` — human-facing overview and license.

## Conventions

- LF line endings everywhere except `*.csv`, which keep CRLF because they're Playnite (Windows) exports; never introduce CRLF elsewhere.
- New languages or toolchains extend `.gitignore` and `.gitattributes` — no parallel ignore files. Keep new entries consistent with existing ones.
- As the template becomes a real project, add build, test, and run commands here.

## Development environment

- **Debian 13 (trixie)** with `docker` installed. Base tooling via `apt`: `git`, `gh`, `python3`, `python3-venv`, `python3-pip`, `python3-dev`, `build-essential`, `curl`, `jq`, `wget`; plus `uv` from its standalone installer into `~/.local/bin`.
- **Install missing tools yourself:** `sudo apt install -y <package>` (`sudo apt update` first if not found). Use `apt` for system tools only. If the project will keep relying on a new tool, add it to the README's install command.
- **Never `pip install` system-wide** (PEP 668). Use a per-project venv:

  ```bash
  uv venv && uv pip install -r requirements.txt    # or: uv sync
  # or: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
  ```
- `node`/`npm` and .NET are not used; serve static content with `python3 -m http.server`. Multi-arch Docker builds need a one-time QEMU + buildx setup (see README).
