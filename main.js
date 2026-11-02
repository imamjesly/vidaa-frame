/* VIDAA Frame 3.0 — iOS 26 Liquid Glass launcher. Design language from CleanFrame (MIT). ES5. */
(function () {
  'use strict';
  var C = window.VF_CONFIG, INSTALLED = window.VF_INSTALLED || [], D = window.VidaaDevice;
  var $ = function (id) { return document.getElementById(id); };
  var KEYS = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 8: 'back', 27: 'back', 461: 'back', 10009: 'back', 10073: 'back' };
  var PITCH = 216, VIEW_W = 1728;
  var MUSIC = !!(C.music && C.music.on);
  var S = { row: 0, i: 0, sheet: null, grid: [], gi: 0, fnOpen: false, scroll: 0, btn: false, pos: 0, dur: 0 };

  var G = {
    safari: '<circle cx="24" cy="24" r="19"/><polygon class="f" points="24,24 33,15 26,26 15,33" stroke="none"/><line x1="24" y1="3" x2="24" y2="8"/><line x1="24" y1="40" x2="24" y2="45"/><line x1="3" y1="24" x2="8" y2="24"/><line x1="40" y1="24" x2="45" y2="24"/>',
    grid: '<rect x="8" y="8" width="13" height="13" rx="4"/><rect x="27" y="8" width="13" height="13" rx="4"/><rect x="8" y="27" width="13" height="13" rx="4"/><rect x="27" y="27" width="13" height="13" rx="4"/>',
    info: '<circle cx="24" cy="24" r="19"/><path d="M24 22v12M24 15v1.5"/>',
    wifi: '<path d="M5 18c11-10 27-10 38 0M12 26c7-6 17-6 24 0M19 33c3-2.5 7-2.5 10 0"/><circle class="f" cx="24" cy="39" r="2.6" stroke="none"/>',
    eth: '<rect x="6" y="14" width="36" height="20" rx="3"/><path d="M14 34v6M34 34v6M24 34v6"/>'
  };
  function glyph(n) { return '<svg class="glyph" viewBox="0 0 48 48" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + (G[n] || G.grid) + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function iconInner(a) {
    if (a.logo) return '<div class="sq"><img src="' + esc(a.logo) + '" alt=""></div>';
    return '<div class="sq tinted" style="background:' + esc(a.tint || '#2f3038') + '">' + glyph(a.glyph) + '</div>';
  }

  var STORE = 'vidaaframe.v3';
  function load() { try { var v = JSON.parse(localStorage.getItem(STORE) || 'null'); if (v) { S.row = v.row | 0; S.i = v.i | 0; } } catch (e) {} }
  function save() { try { localStorage.setItem(STORE, JSON.stringify({ row: S.row, i: S.i })); } catch (e) {} }

  function fit() {
    var w = window.innerWidth || 1920, h = window.innerHeight || 1080, k = Math.min(w / 1920, h / 1080);
    $('stage').style.transform = 'translate(' + Math.round((w - 1920 * k) / 2) + 'px,' + Math.round((h - 1080 * k) / 2) + 'px) scale(' + k + ')';
  }

  /* clock */
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
  function loadWeather() {
    if (!(C.weather && C.weather.on)) { $('wline').style.display = 'none'; return; }
    D.weather(C.weather.lat, C.weather.lon, function (w) {
      if (!w) { $('wline').textContent = C.weather.place; return; }
      $('wline').textContent = C.weather.place + '   ' + w.tempC + '°   ' + w.text;
    });
  }

  /* network */
  function updateNet() {
    var n = D.network(), label = D.netLabel(n);
    $('netText').textContent = label;
    $('netIcon').innerHTML = label === 'Ethernet' ? glyph('eth') : glyph('wifi');
    $('netChip').className = n.online ? 'chip' : 'chip off';
  }

  /* wallpaper */
  var W = { i: 0, front: 'wallA' };
  function showPhoto(i) {
    var list = C.wallpaper.photos, url = 'wp-' + list[i % list.length] + '.jpg', img = new Image();
    img.onload = function () {
      var back = W.front === 'wallA' ? 'wallB' : 'wallA';
      $(back).style.backgroundImage = 'url(' + url + ')';
      $(back).className = 'layer on ' + (i % 2 ? 'drift-b' : 'drift-a');
      $(W.front).className = 'layer'; W.front = back;
    };
    img.src = url;
  }
  function startWallpaper() {
    var v = $('wallVideo');
    function live() { showPhoto(0); setInterval(function () { W.i += 1; showPhoto(W.i); }, Math.max(0.5, C.wallpaper.minutesPerPhoto) * 60000); }
    if (C.wallpaper.mode === 'video') {
      var fell = false; v.onerror = function () { if (!fell) { fell = true; v.className = ''; live(); } };
      v.src = '' + C.wallpaper.videoFile; v.className = 'on';
      try { var p = v.play(); if (p && p['catch']) p['catch'](function () { v.onerror(); }); } catch (e) { v.onerror(); }
      return;
    }
    live();
  }

  /* dock */
  function build() {
    $('trackDock').innerHTML = C.apps.map(function (a, i) {
      return '<div class="icon" id="d' + i + '">' + iconInner(a) + '<div class="lbl">' + esc(a.label) + '</div></div>';
    }).join('');
    if (MUSIC) $('music').className = ''; else $('music').className = 'hidden';
  }
  function rows() { return MUSIC ? 2 : 1; }
  function scrollDock() {
    var n = C.apps.length, full = n * PITCH, x = 0;
    if (full > VIEW_W) x = Math.min(Math.max(0, S.i * PITCH - PITCH), full - VIEW_W + 40);
    $('trackDock').style.transform = 'translateX(' + (-x) + 'px)';
  }
  function paint() {
    var els = document.querySelectorAll('#rowDock .icon'), k;
    for (k = 0; k < els.length; k++) els[k].className = els[k].className.replace(' focus', '');
    if (!S.sheet && S.row === 0) { var el = $('d' + S.i); if (el) el.className += ' focus'; }
    var mc = $('mcard'); if (mc) mc.className = 'mcard' + (!S.sheet && S.row === 1 ? ' focus' : '');
    scrollDock();
  }

  /* open */
  function findInstalled(p) { var re = new RegExp(p, 'i'); for (var i = 0; i < INSTALLED.length; i++) if (re.test(INSTALLED[i].name)) return INSTALLED[i]; return null; }
  function openUrl(u) { if (!D.isTV()) { flash('Preview', 'On the TV this opens:\n' + u); return; } save(); D.open(u); }
  function activate(a) {
    if (a.type === 'folder') return openMore();
    if (a.type === 'info') return openInfo();
    if (a.type === 'web') return openUrl(a.url);
    if (a.type === 'match') {
      var hit = findInstalled(a.match);
      if (hit && hit.web && hit.url) openUrl(hit.url);
      else if (a.fallback) openUrl(a.fallback);
      else nativeBlocked(a.label);
    }
  }

  /* ---- Spotify music widget ---- */
  var spotCtl = null;
  window.onSpotifyIframeApiReady = function (IFrameAPI) {
    if (!MUSIC) return;
    try {
      IFrameAPI.createController($('spot'), { uri: C.music.uri, width: '100%', height: 152, theme: 'dark' }, function (ctl) {
        spotCtl = ctl;
        ctl.addListener('playback_update', function (e) {
          S.pos = (e.data.position || 0) / 1000; S.dur = (e.data.duration || 0) / 1000;
          $('mhint').textContent = e.data.isPaused ? 'OK to play' : 'OK to pause  ·  ◀ ▶ seek';
        });
      });
    } catch (err) { $('mhint').textContent = 'Music unavailable'; }
  };
  function musicToggle() { try { if (spotCtl) spotCtl.togglePlay(); } catch (e) {} }
  function musicSeek(delta) { try { if (spotCtl) spotCtl.seek(Math.max(0, S.pos + delta)); } catch (e) {} }

  /* ---- sheets ---- */
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
  function openMore() {
    S.grid = INSTALLED.slice(); S.gi = 0;
    var html = '<div class="grid" id="grid">' + S.grid.map(function (x, i) {
      var ic = x.icon ? '<img src="' + esc(x.icon) + '" alt="">' : '<span class="badge">' + esc(x.name.charAt(0)) + '</span>';
      return '<div class="gtile" id="g' + i + '"><div class="ic">' + ic + '</div>' + (x.web ? '' : '<span class="web0">TV</span>') + '<div class="nm">' + esc(x.name) + '</div></div>';
    }).join('') + '</div>';
    openSheet('more', 'More Apps', 'Arrows to move · OK to open · Back to close', html); paintGrid();
  }
  function paintGrid() {
    for (var i = 0; i < S.grid.length; i++) { var e = $('g' + i); if (e) e.className = 'gtile' + (i === S.gi ? ' focus' : ''); }
    var rowN = Math.floor(S.gi / 5), y = Math.max(0, rowN - 1) * 242; var g = $('grid'); if (g) g.style.transform = 'translateY(' + (-y) + 'px)';
  }
  function openGrid(x) { if (x.web && x.url) openUrl(x.url); else nativeBlocked(x.name); }
  function nativeBlocked(name) {
    openSheet('cc', '', 'Back to close', '<div class="cc"><div class="ring">' + glyph('grid') + '</div><h2>' + esc(name) + '</h2>' +
      '<div class="sub">This is a built‑in TV app.</div><ol><li>Press Home on the remote</li><li>Open ' + esc(name) + ' from the TV’s own row</li></ol></div>');
  }
  function flash(t, m) { openSheet('cc', '', 'Back to close', '<div class="cc"><h2>' + esc(t) + '</h2><div class="sub" style="white-space:pre-line">' + esc(m) + '</div></div>'); }

  function openInfo() {
    var di = D.deviceInfo(), n = D.network(), dev = '';
    var order = [['model', 'Model'], ['firmware', 'Firmware'], ['os', 'System'], ['chromium', 'Browser engine'], ['brand', 'Brand'], ['region', 'Region']];
    for (var i = 0; i < order.length; i++) if (di[order[i][0]]) dev += '<div><b>' + order[i][1] + '</b>' + esc(di[order[i][0]]) + '</div>';
    dev += '<div><b>Network</b>' + esc(D.netLabel(n)) + (n.ip ? ' · ' + esc(n.ip) : '') + '</div>';
    var html = '<div class="info" id="info"><div class="card"><div class="credit"><div class="big">VIDAA Frame</div>Version ' + esc(C.version) +
      '<br>Made by ' + esc(C.author) + '<br>© ' + new Date().getFullYear() + ' ' + esc(C.author) + '. All rights reserved.</div></div>' +
      '<div class="card"><h3>This TV</h3><div class="kv">' + dev + '</div></div>' +
      '<div class="card"><div class="btn" id="fnBtn">Hidden functions ›</div></div><div id="fnHolder"></div></div>';
    openSheet('info', 'Launcher info', 'OK on “Hidden functions” · Up/Down to scroll · Back to close', html);
    S.btn = true; S.scroll = 0; paintBtn();
  }
  function paintBtn() { var b = $('fnBtn'); if (b) b.className = 'btn' + (S.btn && !S.fnOpen ? ' focus' : ''); }
  function toggleFns() {
    if (S.fnOpen) return; S.fnOpen = true; paintBtn();
    var fns = D.discover(), html = ['<div class="card"><h3>Hidden functions on this TV: ' + fns.length + '</h3><div class="fnlist" id="fnlist">'];
    fns.forEach(function (f) { var c = f.danger ? 'warn' : (f.getter ? 'get' : ''); html.push('<div class="' + c + '">' + esc(f.name) + (f.type === 'function' ? '(' + f.arity + ')' : ' : ' + f.type) + '</div>'); });
    html.push('</div></div>'); $('fnHolder').innerHTML = html.join(''); S.fnH = $('fnlist').offsetHeight;
  }

  /* input */
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

    if (S.row === 1) { /* music widget */
      if (k === 'up') { S.row = 0; save(); return paint(); }
      if (k === 'ok') return musicToggle();
      if (k === 'left') return musicSeek(-15);
      if (k === 'right') return musicSeek(15);
      return;
    }
    /* dock */
    if (k === 'left' && S.i > 0) S.i--;
    else if (k === 'right' && S.i < C.apps.length - 1) S.i++;
    else if (k === 'down' && MUSIC) { S.row = 1; }
    else if (k === 'ok') return activate(C.apps[S.i]);
    else return;
    save(); paint();
  }
  function keyUp(e) { var k = KEYS[e.keyCode]; if (k) held[k] = false; }

  /* boot */
  load(); S.i = Math.min(S.i, C.apps.length - 1); if (S.row === 1 && !MUSIC) S.row = 0;
  build(); fit(); tick(); paint(); startWallpaper(); updateNet(); loadWeather();
  setInterval(tick, 1000); setInterval(updateNet, 15000);
  window.addEventListener('resize', fit);
  document.addEventListener('keydown', key); document.addEventListener('keyup', keyUp);
  window.VF = { state: function () { return { row: S.row, i: S.i, sheet: S.sheet }; } };
}());
