/* Playnite Utility (index.html) — vanilla JS, no dependencies. Helpers first, then the page.
 * On the three Set tabs, clicking a game moves it between list A (without the target) and
 * list B (with the target); the tab picks the target: a Completion Status, a tag, or hidden.
 * The Filter tab edits nothing: it splits games into unmatched (A) and matched (B).
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

// Writes CRLF + UTF-8 BOM to mirror a Playnite export.
function toCSV(rows) {
  return '﻿' + rows.map(r => r.map(csvField).join(',')).join('\r\n') + '\r\n';
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

// --- theme ---
function initTheme() {
  const THEME_KEY = 'playnite-utility-theme';
  const THEMES = ['system', 'light', 'dark'];
  function getTheme() {
    try { const t = localStorage.getItem(THEME_KEY); return THEMES.includes(t) ? t : 'system'; }
    catch { return 'system'; }
  }
  function applyTheme(t) {
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    const label = t.charAt(0).toUpperCase() + t.slice(1);
    $('theme-label').textContent = label;
    $('theme-toggle').title = 'Theme: ' + t + ' (click to change)';
  }
  applyTheme(getTheme());
  $('theme-toggle').addEventListener('click', () => {
    const next = THEMES[(THEMES.indexOf(getTheme()) + 1) % THEMES.length];
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    applyTheme(next);
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

  initTheme();
  initHelp();
  initTabs(setMode);
  setMode(mode);

  // The What? script: one CSV lookup and game loop, plus a block per ticked box from MODES.
  // keys: the ticked tabs, e.g. ['status', 'tag']. A game is saved only if a block changed it.
  function psScript(path, keys, tags) {
    const ms = keys.map(k => MODES[k]);
    return [
      `# ===== Applies ${ms.map(m => m.column).join(', ')} from the CSV to Playnite =====`,
      '',
      `$rows = Import-Csv -Encoding UTF8 ${psQuote(path)}`,
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

  const SET_KEYS = ['status', 'tag', 'hide'];

  // Shows the script for the What? boxes, or a hint while they are not filled in enough.
  function updateScript() {
    const path = $('ps-path').value.trim().replace(/^"(.*)"$/, '$1'); // Copy as path adds quotes
    const keys = SET_KEYS.filter(k => $('ps-' + k).checked);
    const tags = $('ps-tags').value.split(',').map(s => s.trim()).filter(Boolean);
    const hint = !path ? 'Paste the path of the exported CSV above.'
      : !keys.length ? 'Tick at least one box above.'
      : keys.includes('tag') && !tags.length ? 'Type a tag next to Add tags.'
      : '';
    $('script').textContent = hint || psScript(path, keys, tags);
    $('copy-script').disabled = !!hint;
  }
  for (const id of ['ps-path', 'ps-status', 'ps-tag', 'ps-tags', 'ps-hide']) $(id).addEventListener('input', updateScript);

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
    render();
  }

  wireDropzone('drop', 'file', async file => {
    showError('error', '');
    if (!isCsvName(file.name)) return showError('error', 'Please choose a .csv file.');
    let text;
    try { text = await readFileText(file); } catch (e) { return showError('error', 'Could not read file: ' + e); }

    const all = parseCSV(text || '');
    header = all[0] || [];
    // The scripts identify a game by name plus store, so these two are required.
    if (!header.includes('Name') || !header.includes('Sources')) {
      return showError('error', 'The file needs "Name" and "Sources" columns.');
    }

    // Columns the tabs edit are added, empty, when missing. Rows are padded so every cell exists.
    for (const m of Object.values(MODES)) if (m.column && !header.includes(m.column)) header.push(m.column);
    rows = all.slice(1).filter(r => !(r.length === 1 && r[0] === '')); // stray blank lines
    for (const r of rows) while (r.length < header.length) r.push('');
    original = rows.map(r => [...r]);
    col = {
      name: header.indexOf('Name'),
      source: header.indexOf('Sources'),
      time: header.indexOf('Time Played'),
      status: header.indexOf(MODES.status.column),
      tags: header.indexOf(MODES.tag.column),
      hidden: header.indexOf(MODES.hide.column),
    };
    // Runs once per page load, as the dropzone hides after a successful drop.
    const sources = [...new Set(rows.map(r => r[col.source]))].filter(Boolean).sort();
    for (const s of sources) $('source-filter').add(new Option(s));
    $('drop').hidden = true;
    $('app').hidden = false;
    render();
    $('filter').focus();
  });

  // Hidden games show only on Set Hidden, and on Filter while Include hidden is ticked.
  function shown(r) {
    return r[col.hidden] !== 'True' || mode === 'hide' || (mode === 'filter' && $('include-hidden').checked);
  }

  // The four filters. On the Set tabs bothOk (name, source) narrows both lists and otherOk
  // (status, tag) only list A. On Filter a game is matched when it passes all four.
  function filters() {
    const q = $('filter').value.trim().toLowerCase();
    const sf = $('status-filter').value; // '' for <NONE>
    const src = $('source-filter').value; // '' for <NONE>
    const tf = mode === 'hide' || mode === 'filter' ? $('tag-filter').value.trim().toLowerCase() : '';
    const bothOk = r => (!q || r[col.name].toLowerCase().includes(q)) && (!src || r[col.source] === src);
    const otherOk = r => (!sf || r[col.status] === sf) && (!tf || r[col.tags].toLowerCase().includes(tf));
    return { bothOk, otherOk, matches: r => bothOk(r) && otherOk(r) };
  }

  function render() {
    if ($('app').hidden) return; // no file yet
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
      const hours = r[col.time] / 3600; // Time Played is in seconds; NaN when the column is missing
      const cells = [r[col.name], r[col.source], hours ? hours.toFixed(1) + ' h' : '', m.cell(v, orig, r)];
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
    // Back to the filter with its text selected, so typing the next name replaces it.
    $('filter').focus({ preventScroll: true });
    $('filter').select();
  });

  $('target').addEventListener('change', render);
  $('tag').addEventListener('input', render);
  $('status-filter').addEventListener('change', render);
  $('source-filter').addEventListener('change', render);
  $('filter').addEventListener('input', render);
  $('tag-filter').addEventListener('input', render);
  $('include-hidden').addEventListener('change', render);

  $('export').addEventListener('click', () => {
    const name = 'games-' + mode + '_' + timestamp() + '.csv';
    download(name, toCSV([header, ...rows]), 'text/csv;charset=utf-8');
    $('ps-path').placeholder = 'Full path of ' + name;
    dirty = false;
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

  window.addEventListener('beforeunload', e => { if (dirty) e.preventDefault(); });
})();
