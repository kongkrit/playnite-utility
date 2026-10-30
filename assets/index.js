/* Playnite Utility (index.html) — vanilla JS, no dependencies. Helpers first, then the page.
 * On the three Set tabs, clicking a game moves it between list A (without the target) and
 * list B (with the target); the tab picks the target: a Completion Status, a tag, or hidden.
 * The Filter tab edits nothing: it splits games into unmatched (A) and matched (B).
 * The Diff tab lines the working list up against a second export and copies values between them.
 */

// ---------- CSV ----------

// RFC 4180 parser. Handles quoted fields, doubled quotes, CRLF/LF, leading BOM.
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function csvField(v) {
  const s = String(v == null ? '' : v);
  return /["',\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function csvRow(r) { return r.map(csvField).join(','); }

// Writes CRLF + UTF-8 BOM to mirror a Playnite export.
function toCSV(rows) {
  return '﻿' + rows.map(csvRow).join('\r\n') + '\r\n';
}

function timestamp(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
}

// ---------- Browser helpers ----------

const $ = id => document.getElementById(id);

function download(name, bytes, mime) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showError(id, msg) {
  const el = $(id);
  el.textContent = msg;
  el.hidden = !msg;
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(file, 'utf-8');
  });
}

function isCsvName(name) { return /\.csv$/i.test(name); }

// --- theme: starts from the system's light or dark setting; the button flips it ---
function initTheme() {
  const ICONS = { light: 'sun.svg', dark: 'moon.svg' };
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    $('theme-icon').src = 'assets/' + ICONS[t];
    $('theme-icon').alt = t.charAt(0).toUpperCase() + t.slice(1);
    $('theme-toggle').title = 'Theme: ' + t + ' (click to change)';
  }
  applyTheme(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('theme-toggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

// --- help pop-up ---
function initHelp() {
  $('what').addEventListener('click', () => $('help').showModal());
}

// --- tabs: one is active at a time, like radio buttons; onSelect gets its data-tab ---
function initTabs(onSelect) {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      onSelect(btn.dataset.tab);
    });
  });
}

// --- dropzone wiring ---
function wireDropzone(zoneId, inputId, onFile) {
  const zone = $(zoneId);
  const input = $(inputId);
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', () => {
    if (input.files && input.files[0]) onFile(input.files[0]);
    input.value = '';
  });
  ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => {
    e.preventDefault(); zone.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => {
    e.preventDefault(); zone.classList.remove('dragover');
  }));
  zone.addEventListener('drop', e => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) onFile(f);
  });
}

// ---------- Page ----------

(function () {
  const TAG_SEP = ', '; // Library Exporter Advanced's default "Lists separator"
  const tagList = v => (v ? v.split(TAG_SEP) : []);
  // A PowerShell '...' string; single quotes inside are doubled to escape them.
  const psQuote = s => `'${s.replace(/'/g, "''")}'`;
  const SET_VALUE = { has: (v, t) => v === t, add: (v, t) => t }; // for one-value columns

  // One entry per tab; each Set tab edits one column. has: does a cell value carry the target?
  // add: the value after a click in list A. undo: the value after a click in list B; the same
  // value means there is nothing to undo.
  // psCount / psSetup / psApply: the What? script's counter for this tab's box, and its lines
  // before and inside the game loop (see psScript).
  const MODES = {
    status: {
      column: 'Completion Status',
      target: () => $('target').value,
      ...SET_VALUE,
      undo: (v, t, orig) => orig,
      heads: (t, sf, a, b) => [(sf || 'Other statuses') + ' (' + a + ') · click to mark ' + t,
                               t + ' (' + b + ') · click to undo'],
      summary: (t, n) => n + ' changed',
      cell: (v, orig) => (v === orig ? v : orig + ' → ' + v),
      psCount: 'status',
      psSetup: () => [
        `$ids = @{}`,
        `foreach ($s in $PlayniteApi.Database.CompletionStatuses) { $ids[$s.Name] = $s.Id }`,
      ],
      psApply: [
        `    if ($ids.ContainsKey($value) -and $g.CompletionStatusId -ne $ids[$value]) {`,
        `        $g.CompletionStatusId = $ids[$value]`,
        `        $status++; $changed = $true`,
        `    }`,
      ],
    },
    tag: {
      column: 'Tags',
      target: () => $('tag').value.trim(),
      has: (v, t) => tagList(v).includes(t),
      add: (v, t) => [...tagList(v), t].join(TAG_SEP),
      undo: (v, t, orig) => (tagList(orig).includes(t) ? v : tagList(v).filter(x => x !== t).join(TAG_SEP)),
      heads: (t, sf, a, b) => [(sf || 'Other tags') + ' (' + a + ') · click to mark',
                               'Tagged "' + t + '" (' + b + ') · click to undo'],
      summary: (t, n) => (t ? 'Tag "' + t + '" applied · ' : '') + n + ' changed',
      cell: v => v,
      psCount: 'tagged',
      // $tagIds maps tag name to Id; PowerShell hashtables ignore case, as -eq does.
      psSetup: tags => [
        `$tags = @(${tags.map(psQuote).join(', ')})`,
        `$tagIds = @{}`,
        `foreach ($t in $PlayniteApi.Database.Tags) { $tagIds[$t.Name] = $t.Id }`,
      ],
      // A tag is created only once a game needs it. TagIds is null on a game with no tags.
      // tagged counts games, not tags, like the page's "changed" count.
      psApply: [
        `    $added = $false`,
        `    foreach ($tag in $tags) {`,
        `        if (($value -split '${TAG_SEP}') -notcontains $tag) { continue }`,
        `        if (-not $tagIds[$tag]) { $tagIds[$tag] = $PlayniteApi.Database.Tags.Add($tag).Id }`,
        `        if ($g.TagIds -contains $tagIds[$tag]) { continue }`,
        `        if (-not $g.TagIds) { $g.TagIds = [System.Collections.Generic.List[Guid]]::new() }`,
        `        $g.TagIds.Add($tagIds[$tag])`,
        `        $added = $true`,
        `    }`,
        `    if ($added) { $tagged++; $changed = $true }`,
      ],
    },
    hide: {
      column: 'Hidden',
      target: () => 'True',
      ...SET_VALUE,
      // Unlike the other tabs, a game hidden in the file can be un-hidden.
      undo: (v, t, orig) => (orig === t ? 'False' : orig),
      heads: (t, sf, a, b) => ['Not hidden (' + a + ') · click to hide', 'Hidden (' + b + ') · click to un-hide'],
      summary: (t, n) => n + ' changed',
      cell: (v, orig, r) => r[col.tags],
      psCount: 'hidden',
      psSetup: () => [],
      // Skips empty cells, so a Hidden column this page added changes only the games you clicked.
      psApply: [
        `    if ($value -in 'True', 'False' -and $g.Hidden -ne ($value -eq 'True')) {`,
        `        $g.Hidden = $value -eq 'True'`,
        `        $hidden++; $changed = $true`,
        `    }`,
      ],
    },
    // Edits nothing, so it has no column and no target; with no target, clicks do nothing.
    filter: {
      target: () => '',
      heads: (t, sf, a, b) => ['Unmatched (' + a + ')', 'MATCHED (' + b + ')'],
      summary: () => '',
      cell: (v, orig, r) => [r[col.status], r[col.tags]].filter(Boolean).join(' · '),
    },
  };

  let mode = 'status';
  let header = [];
  let rows = [];      // data rows in file order; the edited column is changed in place
  let original = [];  // a copy of each row as read from the file
  let col = {};       // column index per field; -1 when the file lacks that column
  let dirty = false;  // marks made since the last export
  // Diff tab: the list to diff against, in the shape readList returns, and its unexported edits.
  let other = null;
  let otherDirty = false;
  let pairs = null;   // [a, b] row indices of each game in other and rows; -1 when missing there
  // The working list in the same shape as other, for code that handles either list.
  const work = () => ({ header, rows, original, col });

  initTheme();
  initHelp();
  initTabs(setMode);
  setMode(mode);

  // The What? script: one CSV lookup and game loop, plus a block per ticked box from MODES.
  // load: the PowerShell that reads the rows, from a file or from psPageRows.
  // keys: the ticked tabs, e.g. ['status', 'tag']. A game is saved only if a block changed it.
  function psScript(load, keys, tags) {
    const ms = keys.map(k => MODES[k]);
    return [
      `# ===== Applies ${ms.map(m => m.column).join(', ')} from the CSV to Playnite =====`,
      '',
      `$rows = ${load}`,
      `$want = @{}`,
      `foreach ($r in $rows) {`,
      `    $want["$($r.Name.Trim().ToLower())|$($r.Sources)"] = $r`,
      `}`,
      ...ms.flatMap(m => [`$${m.psCount} = 0`, ...m.psSetup(tags)]),
      `$matched = 0`,
      `foreach ($g in $PlayniteApi.Database.Games) {`,
      `    $r = $want["$($g.Name.Trim().ToLower())|$($g.Source.Name)"]`,
      `    if ($null -eq $r) { continue }`,
      `    $matched++`,
      `    $changed = $false`,
      ...ms.flatMap(m => [`    $value = $r.'${m.column}'`, ...m.psApply]),
      `    if ($changed) { $PlayniteApi.Database.Games.Update($g) }`,
      `}`,
      `"rows $($rows.Count), matched $matched, ${ms.map(m => m.psCount + ' $' + m.psCount).join(', ')}"`,
    ].join('\n') + '\n'; // the final newline runs the last line on paste, no Enter needed
  }

  // The page's rows as a CSV block inside the script, so it runs with no export. It keeps only
  // Name and Sources, which find each game, and the ticked columns, so the paste stays small.
  // A single-quoted here-string (@'...'@, a multi-line literal) ends only at a line starting
  // with '@, and csvField quotes any field holding a ', so no row can end it early.
  function psPageRows(keys) {
    const cs = ['Name', 'Sources', ...keys.map(k => MODES[k].column)].map(c => header.indexOf(c));
    const lines = [header, ...rows].map(r => csvRow(cs.map(c => r[c])));
    return [`@'`, ...lines, `'@ | ConvertFrom-Csv`].join('\n');
  }

  const SET_KEYS = ['status', 'tag', 'hide'];

  // Shows the script for the What? boxes, or a hint while they are not filled in enough.
  function updateScript() {
    const fromCsv = $('ps-from-csv').checked;
    const path = $('ps-path').value.trim().replace(/^"(.*)"$/, '$1'); // Copy as path adds quotes
    const keys = SET_KEYS.filter(k => $('ps-' + k).checked);
    const tags = $('ps-tags').value.split(',').map(s => s.trim()).filter(Boolean);
    const hint = fromCsv && !path ? 'Paste the path of the exported CSV above.'
      : !fromCsv && !rows.length ? 'Drop a Playnite export on the page first.'
      : !keys.length ? 'Tick at least one box above.'
      : keys.includes('tag') && !tags.length ? 'Type a tag next to Add tags.'
      : '';
    const load = fromCsv ? `Import-Csv -Encoding UTF8 ${psQuote(path)}` : psPageRows(keys);
    $('ps-path').closest('label').hidden = !fromCsv;
    $('script').textContent = hint || psScript(load, keys, tags);
    $('copy-script').disabled = !!hint;
  }
  document.querySelectorAll('.ps-options input').forEach(el => el.addEventListener('input', updateScript));

  // Runs after initHelp's listener has opened the dialog. Ticks the box of each column changed
  // on this page, or the current tab's when none changed, and lists the tags added on this page.
  $('what').addEventListener('click', () => {
    if (mode === 'filter') return; // Filter changes nothing in Playnite: its help has no script
    const changed = SET_KEYS.filter(k => {
      const c = header.indexOf(MODES[k].column);
      return rows.some((r, i) => r[c] !== original[i][c]);
    });
    for (const k of SET_KEYS) $('ps-' + k).checked = changed.length ? changed.includes(k) : k === mode;
    const added = new Set(rows.flatMap((r, i) =>
      tagList(r[col.tags]).filter(t => !tagList(original[i][col.tags]).includes(t))));
    $('ps-tags').value = added.size ? [...added].join(TAG_SEP) : $('tag').value.trim();
    updateScript();
  });

  $('copy-script').addEventListener('click', () => {
    const btn = $('copy-script');
    navigator.clipboard.writeText($('script').textContent).then(
      () => { btn.textContent = 'Copied'; },
      () => { btn.textContent = 'Copy failed'; });
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
  for (const o of $('target').options) $('status-filter').add(new Option(o.text));

  // Shows the controls and help lines of the selected tab.
  function setMode(next) {
    mode = next;
    document.querySelectorAll('[data-mode]').forEach(el => { el.hidden = !el.dataset.mode.split(' ').includes(mode); });
    showDrops();
    render();
  }

  // A drop box for each list the tab still needs, and the tab's controls and lists once it has them.
  function showDrops() {
    const needOther = mode === 'diff' && !other;
    $('drop').hidden = header.length > 0;
    $('drop-other').hidden = !needOther;
    $('app').hidden = !header.length || needOther;
  }

  // Reads a dropped Playnite export into { header, rows, original, col }. On a problem it shows
  // the error and returns nothing.
  async function readList(file) {
    showError('error', '');
    if (!isCsvName(file.name)) return showError('error', 'Please choose a .csv file.');
    let text;
    try { text = await readFileText(file); } catch (e) { return showError('error', 'Could not read file: ' + e); }

    const all = parseCSV(text || '');
    const names = all[0] || [];
    // The scripts identify a game by name plus store, so these two are required.
    if (!names.includes('Name') || !names.includes('Sources')) {
      return showError('error', 'The file needs "Name" and "Sources" columns.');
    }

    // Columns the tabs edit are added, empty, when missing. Rows are padded so every cell exists.
    for (const m of Object.values(MODES)) if (m.column && !names.includes(m.column)) names.push(m.column);
    const data = all.slice(1).filter(r => !(r.length === 1 && r[0] === '')); // stray blank lines
    for (const r of data) while (r.length < names.length) r.push('');
    return { header: names, rows: data, original: data.map(r => [...r]), col: colsOf(names) };
  }

  function colsOf(names) {
    return {
      name: names.indexOf('Name'),
      source: names.indexOf('Sources'),
      time: names.indexOf('Time Played'),
      status: names.indexOf(MODES.status.column),
      tags: names.indexOf(MODES.tag.column),
      hidden: names.indexOf(MODES.hide.column),
    };
  }

  // Source choices: the stores in both lists. The current choice is kept.
  function fillSources() {
    const sel = $('source-filter');
    const keep = sel.value;
    const stores = new Set([work(), other].filter(Boolean).flatMap(l => l.rows.map(r => r[l.col.source])));
    sel.replaceChildren(sel.options[0], ...[...stores].filter(Boolean).sort().map(s => new Option(s)));
    sel.value = keep;
  }

  // After a list loads: Diff pairs the games again, and Source lists the stores of both lists.
  function loaded() {
    pairs = null;
    fillSources();
    showDrops();
    render();
    $('filter').focus();
  }

  wireDropzone('drop', 'file', async file => {
    const list = await readList(file);
    if (!list) return;
    ({ header, rows, original, col } = list);
    loaded();
  });

  wireDropzone('drop-other', 'file-other', async file => {
    other = await readList(file);
    if (other) loaded();
  });

  // Set Hidden shows every game. Filter shows hidden ones only while Include hidden is ticked.
  // The other two Set tabs and Diff follow the Show box. c: the row's column map.
  function shown(r, c = col) {
    const hidden = r[c.hidden] === 'True';
    if (mode === 'hide') return true;
    if (mode === 'filter') return !hidden || $('include-hidden').checked;
    const show = $('hidden-filter').value;
    return show === 'all' || (show === 'hidden' ? hidden : !hidden);
  }

  // The four filters. On the Set tabs bothOk (name, source) narrows both lists and otherOk
  // (status, tag) only list A. On Filter a game is matched when it passes all four, and on Diff a
  // side passes when it does (Tag: is off there). c: the column map of the rows being tested.
  function filters(c = col) {
    const q = $('filter').value.trim().toLowerCase();
    const sf = $('status-filter').value; // '' for <NONE>
    const src = $('source-filter').value; // '' for <NONE>
    const tf = mode === 'hide' || mode === 'filter' ? $('tag-filter').value.trim().toLowerCase() : '';
    const bothOk = r => (!q || r[c.name].toLowerCase().includes(q)) && (!src || r[c.source] === src);
    const otherOk = r => (!sf || r[c.status] === sf) && (!tf || r[c.tags].toLowerCase().includes(tf));
    return { bothOk, otherOk, matches: r => bothOk(r) && otherOk(r) };
  }

  function hoursText(seconds) {
    const hours = seconds / 3600; // Time Played is in seconds; NaN when the column is missing
    return hours ? hours.toFixed(1) + ' h' : '';
  }

  function render() {
    if ($('app').hidden) return; // no file yet
    if (mode === 'diff') return renderDiff();
    const m = MODES[mode];
    const c = header.indexOf(m.column); // -1 on Filter
    const t = m.target();
    const sf = $('status-filter').value;
    const f = filters();
    const a = document.createDocumentFragment();
    const b = document.createDocumentFragment();
    let changed = 0;

    rows.forEach((r, i) => {
      const v = r[c];
      const orig = original[i][c];
      const isChanged = v !== orig;
      if (isChanged) changed++;
      if (!shown(r)) return;
      let inB;
      if (mode === 'filter') inB = f.matches(r); // every shown game lands in one list
      else {
        inB = m.has(v, t);
        if (!f.bothOk(r) || (!inB && !f.otherOk(r))) return;
      }

      const tr = document.createElement('tr');
      tr.dataset.i = i;
      tr.classList.toggle('changed', isChanged);
      const cells = [r[col.name], r[col.source], hoursText(r[col.time]), m.cell(v, orig, r)];
      for (const text of cells) tr.insertCell().textContent = text ?? '';
      (inB ? b : a).append(tr);
    });

    const [headA, headB] = m.heads(t, sf, a.children.length, b.children.length);
    $('head-a').textContent = headA;
    $('head-b').textContent = headB;
    $('list-a').replaceChildren(a);
    $('list-b').replaceChildren(b);
    $('changed').textContent = m.summary(t, changed);
  }

  // A row without the target gets it. A row with the target loses it again, if its tab allows.
  $('lists').addEventListener('click', e => {
    const tr = e.target.closest('tr');
    const m = MODES[mode];
    const t = m.target();
    if (!tr || !t) return;
    const i = +tr.dataset.i;
    const c = header.indexOf(m.column);
    const v = rows[i][c];
    const next = m.has(v, t) ? m.undo(v, t, original[i][c]) : m.add(v, t);
    if (next === v) return; // nothing to undo
    rows[i][c] = next;
    dirty = true;
    render();
    refocusFilter();
  });

  // Back to the filter with its text selected, so typing the next name replaces it.
  function refocusFilter() {
    $('filter').focus({ preventScroll: true });
    $('filter').select();
  }

  // ---------- Diff tab ----------
  // Side a (left) is the diff against list, side b (right) the working list. DIFF_KEYS are the
  // columns compared and copied; DIFF_SHOW the columns shown on each side, with their labels.
  const DIFF_KEYS = ['status', 'tags', 'hidden'];
  const DIFF_SHOW = [['name', 'Name'], ['hidden', 'Hidden'], ['status', 'Completion Status'],
                     ['time', 'Time Played'], ['source', 'Sources'], ['tags', 'Tags']];
  $('diff-labels').append(...[...DIFF_SHOW, ...DIFF_SHOW].map(([, label]) =>
    Object.assign(document.createElement('th'), { textContent: label })));

  // Tags in another order are the same tags.
  function same(k, x, y) {
    const norm = v => (k === 'tags' ? tagList(v).sort().join(TAG_SEP) : v);
    return norm(x) === norm(y);
  }

  // Pairs each game in other with the same game in rows, sorted by name, then store. A game
  // matches by name, ignoring case and outer spaces, plus store: the What? script's rule. The
  // n-th copy of a game in one list pairs with the n-th copy in the other.
  function pairUp() {
    function keys(l) {
      const seen = new Map();
      return l.rows.map(r => {
        const k = r[l.col.name].trim().toLowerCase() + '|' + r[l.col.source];
        seen.set(k, (seen.get(k) || 0) + 1);
        return k + '#' + seen.get(k);
      });
    }
    const inRows = new Map(keys(work()).map((k, j) => [k, j]));
    const found = keys(other).map((k, i) => {
      const j = inRows.get(k) ?? -1;
      inRows.delete(k);
      return [i, j];
    });
    for (const j of inRows.values()) found.push([-1, j]);
    const nameAndStore = ([i, j]) => {
      const [r, c] = i < 0 ? [rows[j], col] : [other.rows[i], other.col];
      return [r[c.name], r[c.source]];
    };
    return found.sort((p, q) => {
      const [[n1, s1], [n2, s2]] = [nameAndStore(p), nameAndStore(q)];
      return n1.localeCompare(n2) || s1.localeCompare(s2);
    });
  }

  // One row per shown pair, both sides side by side. differs: a compared value unlike the other
  // side's. changed: a value unlike the one in its file; a row added here has an empty file row.
  function renderDiff() {
    pairs ??= pairUp();
    const lists = [other, work()];
    const fs = lists.map(l => filters(l.col));
    const body = document.createDocumentFragment();
    pairs.forEach((pair, p) => {
      // Each side's column map, row, and row as read from its file; null when missing there.
      const sides = pair.map((i, s) => (i < 0 ? null
        : { c: lists[s].col, r: lists[s].rows[i], o: lists[s].original[i] }));
      const [a, b] = sides;
      const differs = k => a !== null && b !== null && !same(k, a.r[a.c[k]], b.r[b.c[k]]);
      const edited = x => x !== null && DIFF_SHOW.some(([k]) => x.r[x.c[k]] !== x.o[x.c[k]]);
      if (!sides.some((x, s) => x && shown(x.r, x.c) && fs[s].matches(x.r))) return;
      if ($('only-diff').checked && a && b && !DIFF_KEYS.some(differs) && !sides.some(edited)) return;

      const tr = body.appendChild(document.createElement('tr'));
      tr.dataset.p = p;
      sides.forEach((x, s) => {
        if (!x) {
          const td = tr.insertCell();
          td.colSpan = DIFF_SHOW.length;
          td.className = 'missing';
          td.textContent = 'Not in this list';
          return;
        }
        for (const [k] of DIFF_SHOW) {
          const td = tr.insertCell();
          const v = x.r[x.c[k]];
          td.textContent = k === 'time' ? hoursText(v) : v ?? '';
          td.dataset.side = s;
          td.classList.toggle('differs', DIFF_KEYS.includes(k) && differs(k));
          td.classList.toggle('changed', v !== x.o[x.c[k]]);
        }
      });
    });
    $('diff-body').replaceChildren(body);
  }

  // A click copies the clicked side to the other: the compared columns, or the whole game as a
  // new row when the other list lacks it, each of its columns filled from the same-named one.
  $('diff-body').addEventListener('click', e => {
    const td = e.target.closest('td');
    if (!td || !td.dataset.side) return; // the "Not in this list" side has nothing to copy
    const s = +td.dataset.side;
    const pair = pairs[+td.parentElement.dataset.p];
    const [from, to] = s ? [work(), other] : [other, work()];
    const r = from.rows[pair[s]];
    if (pair[1 - s] < 0) {
      to.rows.push(to.header.map(h => r[from.header.indexOf(h)] ?? ''));
      to.original.push(to.header.map(() => ''));
      pair[1 - s] = to.rows.length - 1;
    } else {
      const t = to.rows[pair[1 - s]];
      const keys = DIFF_KEYS.filter(k => !same(k, t[to.col[k]], r[from.col[k]]));
      if (!keys.length) return;
      for (const k of keys) t[to.col[k]] = r[from.col[k]];
    }
    if (s) otherDirty = true;
    else dirty = true;
    render();
    refocusFilter();
  });

  $('target').addEventListener('change', render);
  $('tag').addEventListener('input', render);
  $('status-filter').addEventListener('change', render);
  $('source-filter').addEventListener('change', render);
  $('filter').addEventListener('input', render);
  $('hidden-filter').addEventListener('change', render);
  $('tag-filter').addEventListener('input', render);
  $('include-hidden').addEventListener('change', render);
  $('only-diff').addEventListener('change', render);

  // The working list: Export .csv on the Set tabs, Export right on Diff.
  function exportWorking() {
    const name = 'games-' + mode + '_' + timestamp() + '.csv';
    download(name, toCSV([header, ...rows]), 'text/csv;charset=utf-8');
    $('ps-path').placeholder = 'Full path of ' + name;
    dirty = false;
  }
  $('export').addEventListener('click', exportWorking);
  $('export-right').addEventListener('click', exportWorking);
  $('export-left').addEventListener('click', () => {
    const name = 'games-diff-against_' + timestamp() + '.csv';
    download(name, toCSV([other.header, ...other.rows]), 'text/csv;charset=utf-8');
    otherDirty = false;
  });

  // Filter tab: the same split as its two lists. It leaves dirty alone, as it saves only some rows.
  function exportSplit(matched) {
    const f = filters();
    const picked = rows.filter(r => shown(r) && f.matches(r) === matched);
    const name = 'games-' + (matched ? 'matched' : 'unmatched') + '_' + timestamp() + '.csv';
    download(name, toCSV([header, ...picked]), 'text/csv;charset=utf-8');
  }
  $('export-unmatched').addEventListener('click', () => exportSplit(false));
  $('export-matched').addEventListener('click', () => exportSplit(true));

  window.addEventListener('beforeunload', e => { if (dirty || otherDirty) e.preventDefault(); });
})();
