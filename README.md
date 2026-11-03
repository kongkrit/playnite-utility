# Playnite Utility

Playnite Utility is a web page, `index.html`, for editing a [Playnite](https://playnite.link/) game library in bulk. Playnite is a free Windows app that signs in to each store and merges all the libraries into one list. The Library Exporter Advanced add-on saves that list as a CSV file. Playnite Utility then lets me set Completion Status, tags, and hidden flags on many games at once, and split the list with filters.

This README also shows how to set up Playnite with Steam, Epic, GOG, Ubisoft Connect, and PlayStation, and how to export the library.

| File | What it is |
|---|---|
| `index.html`, `assets/index.js` | The web page titled **Playnite Utility**, for quickly setting **Completion Status**, adding or removing a tag, or hiding many games, and for splitting them by filter. |
| `assets/styles.css` | Styling for `index.html`. |
| `assets/icon.svg` | Browser tab icon for `index.html`. |
| `assets/export.svg` | Icon on the **Export** button. |
| `assets/gear.svg` | Icon on the **Settings** button. |
| `playnite-utility.ico` | `assets/icon.svg` as a 256×256 Windows icon. |

## 1. Set up Playnite portable

"Portable" means Playnite keeps its database, settings, and add-ons inside its own folder instead of in your Windows user profile. Copy the folder to another PC and everything comes with it.

1. Go to the [download page](https://playnite.link/download.html) and get the **portable package**, a `.7z` archive. It is also on the [GitHub releases page](https://github.com/JosefNemec/Playnite/releases/latest) as `Playnite<version>.7z`.
2. Extract it to a folder you control, for example `D:\Playnite`. Avoid `C:\Program Files`, because Playnite needs to write inside its own folder.
3. Run `Playnite.DesktopApp.exe`. Playnite needs Windows 10 or 11.
4. The first-run wizard asks which libraries to integrate. Tick **Steam**, **Epic**, **GOG**, and **Ubisoft Connect**. You can also skip the wizard and do this later.

All library settings below live in the main menu under **Add-ons... > Extensions settings > Libraries**. Each store has its own page there.

For every store, tick **Import not installed games**. Without it, Playnite only lists games currently installed on this PC, and the export will be missing most of the library.

### Steam

1. Open the **Steam** library page.
2. Tick **Connect account** and **Import not installed games**.
3. Choose **Web login**, then click **Authenticate** and sign in with your Steam account in the window that opens.

Web login is the recommended method. Per the [Steam troubleshooting wiki](https://github.com/JosefNemec/PlayniteExtensions/wiki/Steam-troubleshooting#should-i-use-web-or-api-login), it also picks up free games, demos, and Family Sharing games that the API key method misses. If the login window keeps looping, clear the web cache in Playnite's advanced settings and try again.

### Epic, using alternative authentication

The normal **Authenticate** button opens Epic's login page inside Playnite's built-in browser, and that often fails on Epic's captcha. **Alternative authentication** avoids the built-in browser. You sign in with your normal browser instead, then copy a one-time code into Playnite.

1. In your default browser, sign in at [epicgames.com](https://www.epicgames.com/).
2. In Playnite, open the **Epic** library page and tick **Connect account** and **Import not installed games**.
3. Click **Alternative authentication**. A dialog lists the steps. Click **OK**.
4. Playnite opens this page in your default browser:

   ```text
   https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code
   ```

   Because you are already signed in, the page shows a short block of JSON text, roughly like this:

   ```json
   {"warning":"...","redirectUrl":"...","authorizationCode":"a1b2c3d4e5f6...","exchangeCode":null,"sid":null}
   ```

5. Copy the value of `authorizationCode`, the letters and digits between the quotes.
6. Paste it into the input box Playnite shows and click **OK**. The status next to **Authenticate** should change to "User is authenticated".

The code works once and expires within minutes. If authentication fails, reload the page in step 4 to get a fresh code and paste again.

### GOG

1. Open the **GOG** library page.
2. Tick **Connect account** and **Import not installed games**.
3. Click **Authenticate** and sign in with your GOG account in the window that opens.

### Ubisoft Connect

Playnite has no login for Ubisoft. Its Ubisoft plugin reads the library from the data files that the official Ubisoft Connect app keeps on disk.

1. Install the [Ubisoft Connect](https://ubisoftconnect.com/) app on the same PC and sign in there.
2. In Playnite, open the **Ubisoft Connect** library page and tick **Import not installed games**.

If Ubisoft games do not show up, open the Ubisoft Connect app once so it refreshes its local files, then update the library in Playnite.

### PlayStation

Playnite has no built-in PlayStation support. The free **PlayStation library integration** add-on by Xenor adds it and imports the PS4 and PS5 games your PSN account owns or has played. It signs in with an NPSSO token, a session code that Sony's site gives your browser after you log in.

1. Open **Add-ons... > Browse > Libraries**, search for **PlayStation library integration**, and click **Install**. Restart Playnite when it asks.
2. In your default browser, sign in at [playstation.com](https://www.playstation.com/). Select **Trust this Browser** when asked.
3. In the same browser, open this page:

   ```text
   https://ca.account.sony.com/api/v1/ssocookie
   ```

   It shows a short block of JSON text, roughly like this:

   ```json
   {"npsso":"a1b2c3d4e5f6..."}
   ```

4. In Playnite, open the **PlayStation** library page and tick **Connect account**.
5. Paste the `npsso` value, or the whole JSON text, into the box and click **Check authentication**. The status next to the button should change to "User is authenticated".

The page has no **Import not installed games** box. PlayStation games never install on the PC, so the add-on imports all of them as not installed.

The NPSSO value works like a password for your PSN account, so don't share it. If authentication fails, sign in at playstation.com again and copy a fresh value.

### Pull in the games

After all five stores are set up, use **Update Game Library** from the main menu. Playnite downloads each library and adds the games. The first run can take several minutes because it also fetches covers and metadata.

## 2. Install Library Exporter Advanced

[Library Exporter Advanced](https://github.com/darklinkpower/PlayniteExtensionsCollection/wiki/Library-Exporter-Advanced) is a free add-on by darklinkpower that saves the Playnite library as a CSV (comma-separated values) file.

1. Open **Add-ons... > Browse > Generic**.
2. Search for **Library Exporter Advanced** and click **Install**.
3. Restart Playnite when it asks.

## 3. Export the library

1. In the main menu, open **Extensions > Library Exporter Advanced > Open export window**.
2. Under **Fields to export**, make sure only these six are ticked:
   - **Age Rating**
   - **Hidden**
   - **Completion Status**
   - **Time Played**
   - **Sources**
   - **Tags**

   Some fields are ticked by default the first time: **Developers**, **Publishers**, **Is Installed**, and **Platforms**. Untick them.
3. Leave **Lists separator** at its default, a comma followed by a space.
4. Click **Export filtered games** and save the CSV file.

**Export filtered games** saves only the games currently visible in Playnite's main library view, after any filters in the filter panel. **Export all games** would save the whole database regardless of filters. Before exporting, check the filter panel shows what you expect. For example, games you marked as hidden are usually left out of the view and so of the export. See [4. Restore hidden games](#4-restore-hidden-games).

The add-on remembers the ticked fields after you close the export window, so later exports only need step 4.

The result has these seven columns. The add-on always includes **Name** and sorts rows by it.

| Column | Meaning | Example |
|---|---|---|
| `Name` | Game title as Playnite shows it. | `Example Game, Deluxe Edition` |
| `Age Rating` | PEGI rating, empty if the store gives none. Several ratings are joined with the list separator. | `PEGI 12, PEGI 7` |
| `Hidden` | `True` if the game is hidden in Playnite, else `False`. **Export filtered games** usually leaves hidden games out, so it's `False` throughout. | `False` |
| `Completion Status` | Playnite's progress label for the game, such as `Played` or `Beaten`. | `Not Played` |
| `Time Played` | Total play time in seconds. | `5400` is 90 minutes |
| `Sources` | Store the game came from. | `Steam`, `Epic`, `GOG`, `Ubisoft Connect`, `PlayStation` |
| `Tags` | Playnite tags, empty if none. Several tags are joined with the list separator. | `RPG, Co-op` |

A game owned on two stores appears twice, once per store.

The file is UTF-8 with a byte order mark (BOM), a hidden marker at the start that tells Excel the text is UTF-8. Fields containing a comma, quote, or apostrophe are wrapped in double quotes.

## 4. Restore hidden games

Playnite has no CSV import. To hide the games in the exported CSV from section 3 again, for example after a fresh setup, run a short script in Playnite's built-in PowerShell console. The console is a Windows PowerShell window connected to the running Playnite. The script reads and changes the library through the variable `$PlayniteApi`, which is empty until you load it in step 2. Without it, the script finds no games and reports 0 without any error.

1. In Playnite's main menu, open **Extensions > Interactive SDK PowerShell**.
2. Right away, press **Ctrl+V** then **Enter** in the console. When the console opens, Playnite puts commands on the clipboard that load `$PlayniteApi`. Do this before you copy the script, because copying replaces those commands. If they're gone, close the console and open it again.
3. Paste the script below, with the path changed to where the exported CSV is, and press Enter.

```powershell
$rows = Import-Csv -Encoding UTF8 'D:\path\to\exported.csv'
$want = @{}
foreach ($r in $rows) { $want["$($r.Name.Trim().ToLower())|$($r.Sources)"] = $true }
$count = 0
foreach ($g in $PlayniteApi.Database.Games) {
    $key = "$($g.Name.Trim().ToLower())|$($g.Source.Name)"
    if ($want.ContainsKey($key) -and -not $g.Hidden) {
        $g.Hidden = $true
        $PlayniteApi.Database.Games.Update($g)
        $count++
    }
}
"Hid $count games"
```

How it works:

- It builds a lookup of name plus store from the file, then walks every game in Playnite and hides the ones that match.
- Matching uses name and store together. A game owned on two stores is only hidden on the store listed in the file.
- Case and spaces at the start and end are ignored, the same rule the Export scripts in `index.html` use.
- Games that are already hidden are skipped, so running it twice is safe. The final count only includes games it changed.

On a fresh setup nothing is hidden yet, so the count should equal the number of games in the file. If it is lower, some names did not match. That usually means the store renamed a game. Fix the name in the exported CSV to match the `Name` column of a fresh export.

## 5. index.html: Playnite Utility

`index.html`, titled **Playnite Utility**, lets you mark many games with the same **Completion Status**, add or remove a tag, or hide them, in a few clicks, then save the result as a new CSV. Its **Filter** tab instead splits the games into two CSVs, and its **Diff** tab compares them with a second export. It runs entirely in the browser with no server and no internet connection. Double-click it to open it.

It has five tabs: **Set Completion Status**, **Tag**, **Hide/un-hide**, **Filter**, and **Diff**. The steps below are for **Set Completion Status**.

1. Drop a Playnite export from section 3 onto the box.
2. Pick the status you want to give games under **Target Completion Status**. The choices are Playnite's eight: `Abandoned`, `Beaten`, `Completed`, `Not Played`, `On Hold`, `Plan to Play`, `Played`, `Playing`.
3. Type part of a name in the filter box to narrow both lists. Matching ignores case. **Source:** also narrows both lists, to one store; its choices are the stores in the dropped file. The last box on the line, **Show all** by default, narrows both lists to **Show hidden** or **Show not hidden** games; an empty `Hidden` counts as not hidden. To narrow only the left list, pick a status under **Filter by status**. It matches the status each row currently shows, and `<ANY>` turns it off. `<NO STATUS>` keeps games with an empty status. For example, target `Beaten` with filter `Played` lists only the games you've played but not yet marked `Beaten`. The **Tag:** box, right after the filter box, also narrows only the left list. It keeps games whose tags contain the typed text, ignoring case. For example, `rpg` keeps games tagged `RPG` or `Action RPG`.
4. Click games to mark them, then click **Export .csv**. It downloads `games-status_YYYYMMDD_HHMM.csv`. **Tag** and **Hide/un-hide** name theirs `games-tag_…` and `games-hide_…`.

The page shows two lists side by side:

- **Other statuses**, on the left: games whose status is not the target. Clicking one sets it to the target and moves it right.
- **The target status**, on the right. Clicking a game you marked puts it back to the status it had in the file and moves it left. Games that already had the target status in the file don't move, because there is nothing to undo. To change one of those, pick its new status as the target and click it on the left.

Each row shows the game's `Name`, `Hidden`, `Completion Status`, `Sources`, `Time Played` in hours, and `Tags`, under a row of column names, as on **Diff**. A list too narrow for all six hides `Time Played` first, then `Hidden`, `Completion Status`, and `Tags`. `Name`, `Sources`, and the column the tab edits always show. Games whose status differs from the file are highlighted in amber, and their status reads like `Played → Beaten`. The count next to **Export .csv** says how many games changed.

After each click, the filter box gets focus with its text selected, so you can type the next name straight away.

The export has the same columns, row order, and format as the file you dropped, with only **Completion Status**, **Tags** and **Hidden** changed. Any of those three columns the file lacked is added, empty; see [Columns it needs](#columns-it-needs). You can drop it back onto the page to keep going. If you close the tab with marks you haven't exported, the browser asks before closing.

### Tag tab

The **Tag** tab works the same way, with a tag in place of a status. Type the tag in **Tag name**. The left list, **Other tags**, holds games without it. The right list, **Tagged "…"**, holds games with it. Clicking a game on the left adds the tag. Clicking one on the right removes the tag, even one the file had, and moves the game left with that tag struck through, like `Old, ~~RPG~~`. Clicking it again adds the tag back. The text next to **Export .csv** reads like `Tag "RPG" applied · 3 changed`. The filters work as on **Set Completion Status**. The export keeps the edits from all tabs.

### Hide/un-hide tab

The **Hide/un-hide** tab hides and un-hides games. The left list, **Not hidden**, holds games whose `Hidden` isn't `True`. The right list, **Hidden**, holds the rest. Clicking a game on the left hides it. Clicking a game on the right un-hides it, even one that was hidden in the file. A changed game is highlighted, and its `Hidden` reads like `False → True`.

The filters work as on **Set Completion Status**, without the **Show all** box.

**Export filtered games** usually leaves hidden games out, so the **Hidden** list starts empty. To see and un-hide games that are already hidden, use **Export all games**.

### Filter tab

The **Filter** tab changes nothing. It splits the games into two lists by the filters on its line: **Filter by status**, **Source:**, **Filter by name**, and **Tag:**, which works as on **Set Completion Status**. A game that passes all four is matched, on the right. The rest are unmatched, on the left. Empty filters match everything, so with no filters set, the unmatched list is empty. Clicking a game does nothing.

**Include hidden** is ticked by default, so games whose `Hidden` is `True` are in both lists and both exports like any other. Untick it to leave them out.

**Export unmatched** and **Export matched**, above each list next to its count, download `games-unmatched_YYYYMMDD_HHMM.csv` and `games-matched_YYYYMMDD_HHMM.csv`. Each holds exactly the games in its list, in file order, with every column of the dropped file and any edits made on the other tabs. Filter changes nothing in Playnite, so Export on this tab has no script.

### Diff tab

The **Diff** tab compares the working list, the export the other tabs edit, with a second export, the *diff against list*, such as an older one. Use it to bring back statuses, tags, or hidden flags from the older export, then apply them in Playnite with **Export**.

1. Drop the working list on the right box and the diff against list on the left box. Both boxes show until both lists are in, even if you already dropped the working list on another tab. A box with a list shows its counts, such as `1500 games, 20 hidden, 300 with tags`. Click it or drop another file on it to replace that list.
2. Each row shows one game from both lists, the diff against list on the left and the working list on the right, so the two versions line up. Games match by name, ignoring case and spaces at the start and end, plus store: the same rule the Export scripts use. Rows are sorted by name, then store. Each side shows `Name`, `Hidden`, `Completion Status`, `Sources`, `Time Played` in hours, and `Tags`. A game in only one list reads *Not in this list* on the other side.
3. `Completion Status`, `Tags`, and `Hidden` values that differ between the sides are bold blue. The same tags in another order count as the same. **Compare time played**, ticked at the start, compares `Time Played` too, in the hours shown, so times that show the same hours count as the same. Untick it to ignore play time.
4. Click a game's left side to copy its `Completion Status`, `Tags`, and `Hidden` to the right, or its right side to copy them to the left. While **Compare time played** is ticked, `Time Played` is copied too. The Export script doesn't apply it, so it changes only the CSV. If the other list lacks the game, the whole game is added to the end of that list. Each of that list's columns is filled from the column with the same name, or left empty. Values that differ from their file are highlighted in amber.

**Filter by status**, **Source:**, **Filter by name**, and **Show all** keep a row when either side passes. **Show only diff** keeps games that differ, are in only one list, or that you changed. **Export diff against (original) list**, above the left side, downloads the diff against list as `games-diff-against_YYYYMMDD_HHMM.csv`, and **Export working (new) list**, above the right side, downloads the working list as `games-diff_YYYYMMDD_HHMM.csv`, each with all its columns. Changes to the working list also show on the other tabs. If you close the tab with changes to either list that you haven't exported, the browser asks before closing.

### Apply the changes in Playnite

Playnite cannot import a CSV. To apply your changes in Playnite, click **Export**, the arrow-into-a-box button next to the tabs, on any tab but **Filter**. Its pop-up builds a script for Playnite's PowerShell console that works like the one in [4. Restore hidden games](#4-restore-hidden-games), from these boxes:

- **Import from:** **current content**, the default, puts the games as the page shows them into the script itself, so you don't need to export first. It includes only the `Name`, `Sources` and ticked columns. **a .csv** reads a file you exported instead.
- **List only modified entries:** shown only with **current content**, and ticked only if you changed something on this page. Otherwise a note beside it says the list hasn't been modified. The script then lists only the games whose ticked columns differ from the dropped file, including games **Diff** added, instead of every game. That keeps a large library from pasting thousands of lines into the console. If no game changed, a hint shows instead of the script.
- **Exported CSV file:** shown only with **a .csv**. The full path of the file you exported. In File Explorer, right-click the file and choose **Copy as path** (Windows 10: Shift+right-click), then paste it here. The quotes that Copy as path adds are removed.
- **Set Completion Status:** sets each game's status to the one in the file, only where it differs.
- **Set tags:** **add** adds each listed tag to the games whose `Tags` contain it, creating the tag in Playnite if it's new. **remove** removes each listed tag from the games whose `Tags` lack it. Separate several tags with commas, such as `RPG, Co-op`. Tags in neither list are left alone.
- **Hide/un-hide:** hides games whose `Hidden` is `True` and un-hides games whose `Hidden` is `False`, only where that differs. Empty cells are skipped.

Above the boxes, **What is this page?** summarizes the current tab. It is collapsed until you click it, except on **Filter**, where the pop-up has nothing else. Each time Export opens, the three boxes are ticked for the columns you changed on this page, or none if you changed nothing. **add** is filled with the tags you added on this page and **remove** with the tags you removed. If you changed no tags, **add** gets every tag in the dropped file, so an export from one PC can tag the same games on another. The script changes as you type or tick. Until a box is ticked, with at least one tag if **Set tags** is ticked, a hint shows instead of the script and **Copy** is disabled. The same happens until a file is dropped on the page (**current content**) or the path is filled in (**a .csv**).

The last line reports `rows` (the games listed in the script, or in the file), `matched` (Playnite games found in the file), and one count per ticked box: `status`, `tagged` and `hidden`, each the number of games changed.

### Settings

The gear button at the right of the top bar opens **Settings**:

- **Theme:** **System**, the default, follows the light or dark setting of Windows, even if it changes while the page is open. **Dark** and **Light** override it.
- **Text size:** **Smaller** and **Larger** shrink or grow the page's text by 10% of the browser's font size per click, between 50% and 200%. **Default** goes back to 100%.

The page saves neither, so each time it opens it starts at **System** and **Default**.

### Columns it needs

The page finds columns by their exact header text, and case matters, so extra or reordered columns are fine.

| Column | Used for | If missing |
|---|---|---|
| `Name` | Every row. | The page rejects the file: *The file needs "Name" and "Sources" columns.* |
| `Sources` | The store shown in each row, and the **Source:** filter. The Export scripts and **Diff** match games by name plus store. | The page rejects the file, as for `Name`. |
| `Completion Status` | **Set Completion Status**, **Diff**, and **Filter by status** on every tab. | Added, empty. |
| `Tags` | **Tag**, **Diff**, the **Tag:** box on every tab but **Diff**, and the rows on **Hide/un-hide** and **Filter**. | Added, empty. |
| `Hidden` | **Hide/un-hide**, **Diff**, **Include hidden** on **Filter**, and the **Show all** box on **Set Completion Status**, **Tag** and **Diff**. | Added, empty. Empty counts as not hidden. |
| `Time Played` | The hours shown in each row, and **Compare time played** on **Diff**. | Added, empty. The page shows no hours. |

An added column appears in the export, empty except for the games you clicked. The scripts skip empty cells, so games you didn't click keep their values in Playnite. Other columns, such as `Age Rating`, are not read. They are copied unchanged into the export.

So the smallest file the page and Playnite can use is `Name` and `Sources`.
