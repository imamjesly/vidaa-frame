/* VIDAA Frame — launcher UI. Design language adapted from CleanFrame (MIT, Nathan Clark).
   ES5 only; remote: arrows, OK, Back. */
(function () {
  'use strict';
  var C = window.VF_CONFIG, D = window.VidaaDevice;
  var $ = function (id) { return document.getElementById(id); };
  var KEYS = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 8: 'back', 27: 'back', 461: 'back', 10009: 'back' };
  var APP_PITCH = 324, CONN_PITCH = 270, VISIBLE_W = 1680;
  var S = { row: 0, idx: [0, 0], panel: null, grid: [], gi: 0, diagY: 0, diagH: 0, installed: null };
  var STORE = 'vidaaframe.focus.v1';

  /* ---------- icons (generic line glyphs, drawn here) ---------- */
  var G = {
    globe: '<circle cx="24" cy="24" r="17"/><path d="M7 24h34M24 7c-6 6-6 28 0 34M24 7c6 6 6 28 0 34"/>',
    grid: '<rect x="9" y="9" width="11" height="11" rx="3"/><rect x="28" y="9" width="11" height="11" rx="3"/><rect x="9" y="28" width="11" height="11" rx="3"/><rect x="28" y="28" width="11" height="11" rx="3"/>',
    wifi: '<path d="M6 19c10-9 26-9 36 0M12 26c7-6 17-6 24 0M18 33c3.5-3 8.5-3 12 0"/><circle class="fill" cx="24" cy="39" r="2.4" fill="#fff" stroke="none"/>',
    bluetooth: '<polyline points="15,15 33,32 24,40 24,8 33,16 15,33"/>',
    airplay: '<path d="M14 34H9a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3h-5"/><path d="M24 30l9 11H15z"/>',
    mirror: '<rect x="5" y="9" width="26" height="18" rx="3"/><rect x="31" y="18" width="12" height="22" rx="3"/><path d="M12 34h12M18 27v7"/>',
    dex: '<rect x="5" y="8" width="38" height="25" rx="3"/><path d="M17 41h14M24 33v8M11 27h26"/>',
    info: '<circle cx="24" cy="24" r="17"/><path d="M24 22v11M24 15v1"/>'
  };
  function glyph(name) {
    return '<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + (G[name] || G.grid) + '</svg>';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function appBadge(a) {
    var inner;
    if (a.icon) inner = '<img src="' + esc(a.icon) + '" alt="">';
    else if (a.glyph) inner = glyph(a.glyph);
    else inner = '<span>' + esc(a.mark || (a.name || '?').charAt(0)) + '</span>';
    return '<div class="badge" style="background:' + esc(a.color || '#444') + '">' + inner + '</div>';
  }

  /* ---------- storage (best effort) ---------- */
  function load() { try { var v = JSON.parse(localStorage.getItem(STORE) || 'null'); if (v && v.idx) { S.row = v.row | 0; S.idx = v.idx; } } catch (e) { /* private mode */ } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify({ row: S.row, idx: S.idx })); } catch (e) { /* ignore */ } }

  /* ---------- stage scale ---------- */
  function fit() {
    var w = window.innerWidth || 1920, h = window.innerHeight || 1080, k = Math.min(w / 1920, h / 1080);
    var st = $('stage');
    st.style.transform = 'translate(' + Math.round((w - 1920 * k) / 2) + 'px,' + Math.round((h - 1080 * k) / 2) + 'px) scale(' + k + ')';
  }

  /* ---------- clock widget ---------- */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var lastMin = -1;
  function tick() {
    var d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    if (m === lastMin) return;
    lastMin = m;
    var h = d.getHours(), mm = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    if (C.clock.use24h) { $('hm').textContent = (h < 10 ? '0' : '') + h + ':' + mm; $('ampm').textContent = ''; }
    else { $('hm').textContent = ((h % 12) || 12) + ':' + mm; $('ampm').textContent = h < 12 ? 'am' : 'pm'; }
    $('date').textContent = C.clock.showDate ? DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] : '';
    var part = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    $('greet').textContent = C.clock.showGreeting ? part + (C.owner ? ', ' + C.owner : '') : '';
  }

  /* ---------- live wallpaper ---------- */
  var W = { i: 0, front: 'wallA' };
  function photoUrl(id) { return 'wp-' + id + '.jpg'; }
  function showPhoto(i) {
    var list = C.wallpaper.photos, url = photoUrl(list[i % list.length]), img = new Image();
    img.onload = function () {
      var back = W.front === 'wallA' ? 'wallB' : 'wallA', b = $(back), f = $(W.front);
      b.style.backgroundImage = 'url(' + url + ')';
      b.className = 'layer on ' + (i % 2 ? 'drift-b' : 'drift-a');
      f.className = f.className.replace(' on', '').replace('layer on', 'layer');
      W.front = back;
    };
    img.src = url;
  }
  function startWallpaper() {
    var v = $('wallVideo');
    function live() {
      showPhoto(0);
      setInterval(function () { W.i += 1; showPhoto(W.i); }, Math.max(0.5, C.wallpaper.minutesPerPhoto) * 60000);
    }
    if (C.wallpaper.mode === 'video') {
      var failed = false;
      v.onerror = function () { if (!failed) { failed = true; v.className = ''; live(); } };
      v.src = C.wallpaper.videoFile;
      v.className = 'on';
      try { var p = v.play(); if (p && p['catch']) p['catch'](function () { v.onerror(); }); } catch (e) { v.onerror(); }
      return;
    }
    live();
  }

  /* ---------- rows ---------- */
  function buildRows() {
    $('trackApps').innerHTML = C.apps.map(function (a, i) {
      return '<div class="tile app" id="a' + i + '"><div class="ic">' + appBadge(a) + '</div><div class="nm">' + esc(a.name) + '</div></div>';
    }).join('');
    $('trackConn').innerHTML = C.connections.map(function (c, i) {
      return '<div class="tile conn" id="c' + i + '"><div class="ic">' + glyph(c.glyph) + '</div><div class="nm">' + esc(c.name) + '</div></div>';
    }).join('');
  }
  function rowLen(r) { return r === 0 ? C.apps.length : C.connections.length; }
  function scrollTrack(r) {
    var pitch = r === 0 ? APP_PITCH : CONN_PITCH, n = rowLen(r), i = S.idx[r];
    var full = n * pitch, x = 0;
    if (full > VISIBLE_W) { x = Math.min(Math.max(0, i * pitch - pitch), full - VISIBLE_W + 40); }
    $(r === 0 ? 'trackApps' : 'trackConn').style.transform = 'translateX(' + (-x) + 'px)';
  }
  function paint() {
    var els = document.querySelectorAll('.row .tile');
    for (var k = 0; k < els.length; k++) els[k].className = els[k].className.replace(' focus', '');
    var id = (S.row === 0 ? 'a' : 'c') + S.idx[S.row], el = $(id);
    if (el && !S.panel) el.className += ' focus';
    $('rowApps').className = 'row' + (S.row === 0 ? ' active' : '');
    $('rowConn').className = 'row' + (S.row === 1 ? ' active' : '');
    scrollTrack(0); scrollTrack(1);
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg, detail, ms) {
    $('toastMsg').textContent = msg; $('toastDetail').textContent = detail || '';
    $('toast').className = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, ms || 7000);
  }
  function hideToast() { $('toast').className = 'hidden'; }

  /* ---------- installed apps ---------- */
  function installed(done) {
    if (S.installed) { done(S.installed); return; }
    D.apps(function (err, list, how) { S.installed = list || []; S.installedHow = how; done(S.installed, err); });
  }
  function findApp(pattern, done) {
    installed(function (list) {
      var re = new RegExp(pattern, 'i'), hit = null;
      for (var i = 0; i < list.length; i++) if (re.test(list[i].name)) { hit = list[i]; break; }
      done(hit);
    });
  }
  function go(url, label, viaBrowser) {
    if (!D.isTV()) { toast('Preview mode', 'On the TV, ' + label + ' opens ' + url); return; }
    save();
    if (viaBrowser) D.browse(url, function () {}); else location.href = url;
  }
  function launchRecord(app) {
    if (!D.isTV()) { toast('Preview mode', 'On the TV this opens ' + app.name + '.'); return; }
    save();
    D.launch(app, function (err) { if (err) toast(err.message, err.detail); });
  }

  /* ---------- actions ---------- */
  function activateApp(a) {
    if (a.type === 'folder') { openMore(); return; }
    if (a.type === 'web') { go(a.url, a.name, a.inBrowser); return; }
    findApp(a.match || a.name, function (hit) {
      if (hit) launchRecord(hit);
      else if (a.fallbackUrl) go(a.fallbackUrl, a.name, false);
      else toast(a.name + ' isn’t reachable from the launcher yet', 'Use the remote’s Home or Apps button for now — Launcher info will tell me how to wire it up.');
    });
  }
  function activateConn(c) {
    if (c.type === 'diagnostics') { openDiag(); return; }
    findApp(c.match || c.name, function (hit) {
      if (hit) launchRecord(hit);
      else toast(c.name, c.help);
    });
  }

  /* ---------- panels ---------- */
  function openPanel(kind, title, hint) {
    S.panel = kind; $('panelTitle').textContent = title; $('panelHint').textContent = hint || '';
    $('panel').className = ''; document.body.className = 'panel-open'; paint();
  }
  function closePanel() { S.panel = null; $('panel').className = 'hidden'; document.body.className = ''; $('panelBody').innerHTML = ''; paint(); }

  function openMore() {
    openPanel('more', 'More Apps', 'Arrows to move · OK to open · Back to return');
    $('panelBody').innerHTML = '<div class="empty">Loading apps…</div>';
    installed(function (list) {
      var home = C.apps.map(function (a) { return a.match ? new RegExp(a.match, 'i') : null; }).filter(Boolean);
      S.grid = list.filter(function (x) { return !home.some(function (re) { return re.test(x.name); }) && !/vidaa frame/i.test(x.name); });
      S.grid.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
      S.gi = 0;
      if (!S.grid.length) {
        $('panelBody').innerHTML = '<div class="empty">' + (D.isTV()
          ? 'Your TV hasn’t shared its installed-app list with the launcher yet.<br>Open <b>Connections → Launcher info</b> and send a photo — that tells me how to read it on firmware ' + esc(D.info().Hisense_GetFirmWareVersion || 'V0000.09.60D') + '.'
          : 'Preview mode: on the TV this folder lists every installed app that isn’t already on Home.') + '</div>';
        return;
      }
      $('panelBody').innerHTML = '<div class="grid" id="grid">' + S.grid.map(function (x, i) {
        var icon = x.icon ? '<img src="' + esc(x.icon) + '" alt="">' : '<span>' + esc(x.name.charAt(0)) + '</span>';
        return '<div class="tile app" id="g' + i + '"><div class="ic"><div class="badge" style="background:#3a3a44">' + icon + '</div></div><div class="nm">' + esc(x.name) + '</div></div>';
      }).join('') + '</div>';
      paintGrid();
    });
  }
  function paintGrid() {
    for (var i = 0; i < S.grid.length; i++) { var e = $('g' + i); if (e) e.className = 'tile app' + (i === S.gi ? ' focus' : ''); }
    var rowN = Math.floor(S.gi / 5), y = Math.max(0, rowN - 1) * 244;
    var g = $('grid'); if (g) g.style.transform = 'translateY(' + (-y) + 'px)';
  }

  function openDiag() {
    openPanel('diag', 'Launcher info', 'Up/Down to scroll · Back to return · Take a photo of each screen and send it to Claude');
    var fns = D.discover(), inf = D.info(), html = [];
    html.push('<div class="h">This TV</div>');
    Object.keys(inf).forEach(function (k) { html.push(esc(k) + ': ' + esc(inf[k])); });
    html.push('<div class="h">Hidden functions found: ' + fns.length + '</div>');
    if (!fns.length) html.push('<span class="warn">None — this page is running outside the TV (preview), or the TV hides them from this app.</span>');
    fns.forEach(function (f) {
      var cls = f.danger ? 'warn' : (f.launchy ? 'go' : '');
      html.push('<span class="' + cls + '">' + esc(f.name) + (f.type === 'function' ? '(' + f.arity + ')' : ' : ' + f.type) + '</span>');
      if (f.src) html.push('<div class="src">' + esc(f.src) + '</div>');
    });
    installed(function (list) {
      html.push('<div class="h">Installed apps read: ' + list.length + ' (' + esc(S.installedHow || 'none') + ')</div>');
      list.forEach(function (a) { html.push(esc(a.name) + ' — ' + esc(a.id) + (a.url ? ' — ' + esc(String(a.url).slice(0, 90)) : '')); });
      $('panelBody').innerHTML = '<div class="diag" id="diag">' + html.join('<br>') + '</div>';
      S.diagY = 0; S.diagH = $('diag').offsetHeight;
    });
  }

  /* ---------- input ---------- */
  var held = {};
  function onKey(e) {
    var k = KEYS[e.keyCode];
    if (!k) return;
    e.preventDefault();
    if (k === 'ok' || k === 'back') { if (held[k]) return; held[k] = true; }
    if ($('toast').className !== 'hidden') { hideToast(); if (k === 'ok' || k === 'back') return; }

    if (S.panel === 'more') {
      if (k === 'back') { closePanel(); return; }
      if (!S.grid.length) return;
      var n = S.grid.length;
      if (k === 'left' && S.gi % 5) S.gi -= 1;
      else if (k === 'right' && S.gi % 5 < 4 && S.gi + 1 < n) S.gi += 1;
      else if (k === 'up' && S.gi >= 5) S.gi -= 5;
      else if (k === 'down' && S.gi + 5 < n) S.gi += 5;
      else if (k === 'ok') { launchRecord(S.grid[S.gi]); return; }
      paintGrid(); return;
    }
    if (S.panel === 'diag') {
      if (k === 'back' || k === 'ok') { closePanel(); return; }
      if (k === 'down') S.diagY = Math.min(Math.max(0, S.diagH - 700), S.diagY + 340);
      if (k === 'up') S.diagY = Math.max(0, S.diagY - 340);
      var d = $('diag'); if (d) d.style.transform = 'translateY(' + (-S.diagY) + 'px)';
      return;
    }
    var r = S.row;
    if (k === 'left' && S.idx[r] > 0) S.idx[r] -= 1;
    else if (k === 'right' && S.idx[r] < rowLen(r) - 1) S.idx[r] += 1;
    else if (k === 'down' && r === 0) { S.row = 1; S.idx[1] = Math.min(S.idx[1], rowLen(1) - 1); }
    else if (k === 'up' && r === 1) S.row = 0;
    else if (k === 'ok') { if (r === 0) activateApp(C.apps[S.idx[0]]); else activateConn(C.connections[S.idx[1]]); return; }
    else return;
    save(); paint();
  }
  function onKeyUp(e) { var k = KEYS[e.keyCode]; if (k) held[k] = false; }

  /* ---------- boot ---------- */
  load();
  S.idx[0] = Math.min(S.idx[0], rowLen(0) - 1); S.idx[1] = Math.min(S.idx[1], rowLen(1) - 1);
  buildRows(); fit(); tick(); paint(); startWallpaper();
  setInterval(tick, 1000);
  window.addEventListener('resize', fit);
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKeyUp);
  setTimeout(function () { installed(function () {}); }, 400); /* warm the app list */
  window.VF = { state: function () { return { row: S.row, idx: S.idx.slice(), panel: S.panel }; } };
}());
