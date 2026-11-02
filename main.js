/* VIDAA Frame 2.0 — Apple-style launcher. Design language from CleanFrame (MIT). ES5. */
(function () {
  'use strict';
  var C = window.VF_CONFIG, INSTALLED = window.VF_INSTALLED || [], D = window.VidaaDevice;
  var $ = function (id) { return document.getElementById(id); };
  var KEYS = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 8: 'back', 27: 'back', 461: 'back', 10009: 'back', 10073: 'back' };
  var DOCK_PITCH = 332, TRAY_PITCH = 276, VIEW_W = 1736;
  var S = { row: 0, i: [0, 0], sheet: null, grid: [], gi: 0, fnOpen: false, scroll: 0, btn: false };

  /* ---------- glyphs ---------- */
  var G = {
    safari: '<circle cx="24" cy="24" r="19"/><polygon class="f" points="24,24 33,15 26,26 15,33" stroke="none"/><line x1="24" y1="3" x2="24" y2="8"/><line x1="24" y1="40" x2="24" y2="45"/><line x1="3" y1="24" x2="8" y2="24"/><line x1="40" y1="24" x2="45" y2="24"/>',
    grid: '<rect x="8" y="8" width="13" height="13" rx="4"/><rect x="27" y="8" width="13" height="13" rx="4"/><rect x="8" y="27" width="13" height="13" rx="4"/><rect x="27" y="27" width="13" height="13" rx="4"/>',
    wifi: '<path d="M5 18c11-10 27-10 38 0M12 26c7-6 17-6 24 0M19 33c3-2.5 7-2.5 10 0"/><circle class="f" cx="24" cy="39" r="2.6" stroke="none"/>',
    bluetooth: '<polyline points="16,15 32,32 24,40 24,8 32,16 16,33"/>',
    airplay: '<path d="M13 33H9a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3h-4"/><path d="M24 29l10 12H14z"/>',
    mirror: '<rect x="5" y="9" width="27" height="19" rx="3"/><rect x="32" y="18" width="11" height="22" rx="3"/><path d="M12 35h11M18 28v7"/>',
    dex: '<rect x="4" y="8" width="40" height="26" rx="3"/><path d="M16 41h16M24 34v7M10 28h28"/>',
    info: '<circle cx="24" cy="24" r="19"/><path d="M24 22v12M24 15v1.5"/>'
  };
  function glyph(name) {
    return '<svg class="glyph" viewBox="0 0 48 48" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + (G[name] || G.grid) + '</svg>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function dockIcon(a) {
    if (a.icon && /\.(png|jpg|jpeg)(\?|$)/i.test(a.icon)) return '<img src="' + esc(a.icon) + '" alt="">';
    var inner = a.icon ? '<img src="' + esc(a.icon) + '" alt="">' : glyph(a.glyph);
    return '<span class="badge" style="background:' + esc(a.tint || '#3a3a44') + '">' + inner + '</span>';
  }

  /* ---------- storage ---------- */
  var STORE = 'vidaaframe.v2';
  function load() { try { var v = JSON.parse(localStorage.getItem(STORE) || 'null'); if (v) { S.row = v.row | 0; S.i = v.i || [0, 0]; } } catch (e) {} }
  function save() { try { localStorage.setItem(STORE, JSON.stringify({ row: S.row, i: S.i })); } catch (e) {} }

  function fit() {
    var w = window.innerWidth || 1920, h = window.innerHeight || 1080, k = Math.min(w / 1920, h / 1080);
    $('stage').style.transform = 'translate(' + Math.round((w - 1920 * k) / 2) + 'px,' + Math.round((h - 1080 * k) / 2) + 'px) scale(' + k + ')';
  }

  /* ---------- clock ---------- */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var lastMin = -1;
  function tick() {
    var d = new Date(), key = d.getHours() * 60 + d.getMinutes();
    if (key === lastMin) return; lastMin = key;
    var h = d.getHours(), mm = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    if (C.clock.use24h) { $('hm').textContent = (h < 10 ? '0' : '') + h + ':' + mm; $('ampm').textContent = ''; }
    else { $('hm').textContent = ((h % 12) || 12) + ':' + mm; $('ampm').textContent = h < 12 ? 'AM' : 'PM'; }
    $('date').textContent = C.clock.showDate ? DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()] : '';
  }

  /* ---------- network chip ---------- */
  function updateNet() {
    var n = D.network(), label = D.netLabel(n), chip = $('netChip');
    $('netText').textContent = label;
    $('netIcon').innerHTML = label === 'Ethernet' ? glyph('dex') : glyph('wifi');
    if (n.online) chip.className = 'chip'; else chip.className = 'chip off';
  }

  /* ---------- wallpaper ---------- */
  var W = { i: 0, front: 'wallA' };
  function showPhoto(i) {
    var list = C.wallpaper.photos, url = 'wp-' + list[i % list.length] + '.jpg', img = new Image();
    img.onload = function () {
      var back = W.front === 'wallA' ? 'wallB' : 'wallA';
      $(back).style.backgroundImage = 'url(' + url + ')';
      $(back).className = 'layer on ' + (i % 2 ? 'drift-b' : 'drift-a');
      $(W.front).className = 'layer';
      W.front = back;
    };
    img.src = url;
  }
  function startWallpaper() {
    var v = $('wallVideo');
    function live() { showPhoto(0); setInterval(function () { W.i += 1; showPhoto(W.i); }, Math.max(0.5, C.wallpaper.minutesPerPhoto) * 60000); }
    if (C.wallpaper.mode === 'video') {
      var fell = false;
      v.onerror = function () { if (!fell) { fell = true; v.className = ''; live(); } };
      v.src = C.wallpaper.videoFile; v.className = 'on';
      try { var p = v.play(); if (p && p['catch']) p['catch'](function () { v.onerror(); }); } catch (e) { v.onerror(); }
      return;
    }
    live();
  }

  /* ---------- build rows ---------- */
  function build() {
    $('trackDock').innerHTML = C.apps.map(function (a, i) {
      return '<div class="tile dockTile" id="d' + i + '"><div class="ic">' + dockIcon(a) + '</div><div class="nm">' + esc(a.label) + '</div></div>';
    }).join('');
    $('trackTray').innerHTML = C.connections.map(function (c, i) {
      return '<div class="tile trayTile" id="t' + i + '"><div class="ic">' + glyph(c.glyph) + '</div><div class="nm">' + esc(c.label) + '</div></div>';
    }).join('');
  }
  function rowLen(r) { return r === 0 ? C.apps.length : C.connections.length; }
  function scrollRow(r) {
    var pitch = r === 0 ? DOCK_PITCH : TRAY_PITCH, n = rowLen(r), i = S.i[r], full = n * pitch, x = 0;
    if (full > VIEW_W) x = Math.min(Math.max(0, i * pitch - pitch), full - VIEW_W + 36);
    $(r === 0 ? 'trackDock' : 'trackTray').style.transform = 'translateX(' + (-x) + 'px)';
  }
  function paint() {
    var els = document.querySelectorAll('#rows .tile'), k;
    for (k = 0; k < els.length; k++) els[k].className = els[k].className.replace(' focus', '');
    if (!S.sheet) { var el = $((S.row === 0 ? 'd' : 't') + S.i[S.row]); if (el) el.className += ' focus'; }
    $('rowDock').className = 'row' + (S.row === 0 ? ' active' : '');
    $('rowTray').className = 'row' + (S.row === 1 ? ' active' : '');
    scrollRow(0); scrollRow(1);
  }

  /* ---------- open apps ---------- */
  function findInstalled(pattern) {
    var re = new RegExp(pattern, 'i');
    for (var i = 0; i < INSTALLED.length; i++) if (re.test(INSTALLED[i].name)) return INSTALLED[i];
    return null;
  }
  function openUrl(url) {
    if (!D.isTV()) { flash('Preview', 'On the TV this opens:\n' + url); return; }
    save(); D.open(url);
  }
  function activateDock(a) {
    if (a.type === 'folder') { openMore(); return; }
    if (a.type === 'web') { openUrl(a.url); return; }
    if (a.type === 'browser') { openUrl('https://www.bing.com'); return; }
    if (a.type === 'match') {
      var hit = findInstalled(a.match);
      if (hit && hit.web && hit.url) openUrl(hit.url);
      else if (a.fallback) openUrl(a.fallback);
      else nativeBlocked(a.label);
      return;
    }
  }
  function activateTray(c) {
    if (c.type === 'info') { openInfo(); return; }
    openConnection(c);
  }

  /* ---------- sheet plumbing ---------- */
  function openSheet(kind, title, hint, html) {
    if (S.closeTimer) { clearTimeout(S.closeTimer); S.closeTimer = 0; }
    S.sheet = kind; $('sheetTitle').textContent = title; $('sheetHint').textContent = hint || '';
    $('sheetBody').innerHTML = html || ''; $('sheet').className = ''; document.body.className = 'sheet-open'; paint();
  }
  function closeSheet() {
    var s = $('sheet'); s.className = 'closing';
    S.closeTimer = setTimeout(function () { if (!S.sheet) s.className = 'hidden'; S.closeTimer = 0; }, 280);
    S.sheet = null; S.fnOpen = false; document.body.className = ''; paint();
  }

  /* More Apps */
  function openMore() {
    S.grid = INSTALLED.slice(); S.gi = 0;
    var html = '<div class="grid" id="grid">' + S.grid.map(function (x, i) {
      var ic = x.icon ? '<img src="' + esc(x.icon) + '" alt="">' : '<span class="badge">' + esc(x.name.charAt(0)) + '</span>';
      return '<div class="gtile" id="g' + i + '"><div class="ic">' + ic + '</div>' +
        (x.web ? '' : '<span class="web0">TV</span>') + '<div class="nm">' + esc(x.name) + '</div></div>';
    }).join('') + '</div>';
    openSheet('more', 'More Apps', 'Arrows to move · OK to open · Back to close', html);
    paintGrid();
  }
  function paintGrid() {
    for (var i = 0; i < S.grid.length; i++) { var e = $('g' + i); if (e) e.className = 'gtile' + (i === S.gi ? ' focus' : ''); }
    var perRow = 5, rowN = Math.floor(S.gi / perRow), y = Math.max(0, rowN - 1) * 242;
    var g = $('grid'); if (g) g.style.transform = 'translateY(' + (-y) + 'px)';
  }
  function openGrid(x) {
    if (x.web && x.url) openUrl(x.url); else nativeBlocked(x.name);
  }

  /* Connection quick-panel (iOS Control Center style) */
  function openConnection(c) {
    var steps = (c.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    var html = '<div class="cc"><div class="ring">' + glyph(c.glyph) + '</div>' +
      '<h2>' + esc(c.label) + '</h2><div class="sub">VIDAA keeps this off‑limits to apps — here’s the quick way:</div>' +
      '<ol>' + steps + '</ol>' + (c.note ? '<div class="cnote">' + esc(c.note) + '</div>' : '') + '</div>';
    openSheet('cc', '', 'Back to close', html);
  }
  function nativeBlocked(name) {
    var html = '<div class="cc"><div class="ring">' + glyph('grid') + '</div>' +
      '<h2>' + esc(name) + '</h2><div class="sub">This one is a built‑in TV app.</div>' +
      '<ol><li>Press Home on the remote</li><li>Open ' + esc(name) + ' from the TV’s own row</li></ol>' +
      '<div class="cnote">VIDAA doesn’t let the launcher start built‑in apps. Web apps open here directly.</div></div>';
    openSheet('cc', '', 'Back to close', html);
  }
  function flash(title, msg) {
    var html = '<div class="cc"><h2>' + esc(title) + '</h2><div class="sub" style="white-space:pre-line">' + esc(msg) + '</div></div>';
    openSheet('cc', '', 'Back to close', html);
  }

  /* Launcher info */
  function openInfo() {
    var di = D.deviceInfo(), n = D.network();
    var dev = '';
    var order = [['model', 'Model'], ['firmware', 'Firmware'], ['os', 'System'], ['chromium', 'Browser engine'], ['brand', 'Brand'], ['region', 'Region']];
    for (var i = 0; i < order.length; i++) if (di[order[i][0]]) dev += '<div><b>' + order[i][1] + '</b>' + esc(di[order[i][0]]) + '</div>';
    dev += '<div><b>Network</b>' + esc(D.netLabel(n)) + (n.ip ? ' · ' + esc(n.ip) : '') + '</div>';
    var html = '<div class="info" id="info">' +
      '<div class="card"><div class="credit"><div class="big">VIDAA Frame</div>Version ' + esc(C.version) +
      '<br>Made by ' + esc(C.author) + '<br>© ' + new Date().getFullYear() + ' ' + esc(C.author) + '. All rights reserved.</div></div>' +
      '<div class="card"><h3>This TV</h3><div class="kv">' + dev + '</div></div>' +
      '<div class="card"><div class="btn" id="fnBtn">Hidden functions ›</div></div>' +
      '<div id="fnHolder"></div></div>';
    openSheet('info', 'Launcher info', 'OK on “Hidden functions” to explore · Up/Down to scroll · Back to close', html);
    S.btn = true; S.scroll = 0; paintBtn();
  }
  function paintBtn() { var b = $('fnBtn'); if (b) b.className = 'btn' + (S.btn && !S.fnOpen ? ' focus' : ''); }
  function toggleFns() {
    if (S.fnOpen) return;
    S.fnOpen = true; paintBtn();
    var fns = D.discover(), html = ['<div class="card"><h3>Hidden functions on this TV: ' + fns.length + '</h3><div class="fnlist" id="fnlist">'];
    var cat = '';
    fns.forEach(function (f) {
      var c = f.danger ? 'warn' : (f.getter ? 'get' : '');
      html.push('<div class="' + c + '">' + esc(f.name) + (f.type === 'function' ? '(' + f.arity + ')' : ' : ' + f.type) + '</div>');
    });
    html.push('</div></div>');
    $('fnHolder').innerHTML = html.join('');
    S.fnH = $('fnlist').offsetHeight;
  }

  /* ---------- input ---------- */
  var held = {};
  function key(e) {
    var k = KEYS[e.keyCode]; if (!k) return; e.preventDefault();
    if (k === 'ok' || k === 'back') { if (held[k]) return; held[k] = true; }

    if (S.sheet === 'more') {
      if (k === 'back') return closeSheet();
      var n = S.grid.length; if (!n) return;
      if (k === 'left' && S.gi % 5) S.gi--;
      else if (k === 'right' && S.gi % 5 < 4 && S.gi + 1 < n) S.gi++;
      else if (k === 'up' && S.gi >= 5) S.gi -= 5;
      else if (k === 'down' && S.gi + 5 < n) S.gi = Math.min(n - 1, S.gi + 5);
      else if (k === 'ok') return openGrid(S.grid[S.gi]);
      return paintGrid();
    }
    if (S.sheet === 'cc') { if (k === 'back' || k === 'ok') closeSheet(); return; }
    if (S.sheet === 'info') {
      if (k === 'back') return closeSheet();
      if (k === 'ok' && S.btn && !S.fnOpen) return toggleFns();
      if ((k === 'down' || k === 'up') && S.fnOpen) {
        var max = Math.max(0, (S.fnH || 0) - 560);
        S.scroll = k === 'down' ? Math.min(max, S.scroll + 320) : Math.max(0, S.scroll - 320);
        var el = $('info'); if (el) el.style.transform = 'translateY(' + (-S.scroll) + 'px)';
      }
      return;
    }

    var r = S.row;
    if (k === 'left' && S.i[r] > 0) S.i[r]--;
    else if (k === 'right' && S.i[r] < rowLen(r) - 1) S.i[r]++;
    else if (k === 'down' && r === 0) { S.row = 1; S.i[1] = Math.min(S.i[1], rowLen(1) - 1); }
    else if (k === 'up' && r === 1) S.row = 0;
    else if (k === 'ok') { if (r === 0) activateDock(C.apps[S.i[0]]); else activateTray(C.connections[S.i[1]]); return; }
    else return;
    save(); paint();
  }
  function keyUp(e) { var k = KEYS[e.keyCode]; if (k) held[k] = false; }

  /* ---------- boot ---------- */
  load();
  S.i[0] = Math.min(S.i[0], rowLen(0) - 1); S.i[1] = Math.min(S.i[1], rowLen(1) - 1);
  build(); fit(); tick(); paint(); startWallpaper(); updateNet();
  setInterval(tick, 1000);
  setInterval(updateNet, 15000);
  window.addEventListener('resize', fit);
  document.addEventListener('keydown', key);
  document.addEventListener('keyup', keyUp);
  window.VF = { state: function () { return { row: S.row, i: S.i.slice(), sheet: S.sheet }; } };
}());
