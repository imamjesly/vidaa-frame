/* VIDAA Frame 5.0 — launcher with Spotify Premium playback + mouse support. ES5. */
(function () {
  'use strict';
  var C = window.VF_CONFIG, INSTALLED = window.VF_INSTALLED || [], D = window.VidaaDevice, SP = window.VFSpotify;
  var $ = function (id) { return document.getElementById(id); };
  var KEYS = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 8: 'back', 27: 'back', 461: 'back', 10009: 'back', 10073: 'back' };
  function num(v) { return typeof v === 'number' ? v : -1; }
  var PLAYPAUSE = [num(window.VK_PLAY_PAUSE), num(window.VK_PLAY), num(window.VK_PAUSE), num(window.KEY_PLAY), num(window.KEY_PAUSE), 179, 415, 19, 10252, 402].filter(function (x) { return x > 0; });
  var PITCH = 216, VIEW_W = 1728, MUSIC = !!(C.spotify && C.spotify.on && SP && SP.enabled);
  var S = { i: 0, sheet: null, grid: [], gi: 0, fnOpen: false, scroll: 0, btn: false, focus: 'dock', mShow: false, started: false, mState: null };

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
    if (a.logo) return '<div class="sq sheen"><img src="' + esc(a.logo) + '" alt=""></div>';
    return '<div class="sq sheen" style="background:' + esc(a.tint || '#2f3038') + '">' + glyph(a.glyph) + '</div>';
  }

  var STORE = 'vidaaframe.v5';
  function loadS() { try { var v = JSON.parse(localStorage.getItem(STORE) || 'null'); if (v) S.i = v.i | 0; } catch (e) {} }
  function saveS() { try { localStorage.setItem(STORE, JSON.stringify({ i: S.i })); } catch (e) {} }

  function fit() {
    var w = window.innerWidth || 1920, h = window.innerHeight || 1080, k = Math.min(w / 1920, h / 1080);
    $('stage').style.transform = 'translate(' + Math.round((w - 1920 * k) / 2) + 'px,' + Math.round((h - 1080 * k) / 2) + 'px) scale(' + k + ')';
  }

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var lastMin = -1;
  function tick() {
    var d = new Date(), key = d.getHours() * 60 + d.getMinutes(); if (key === lastMin) return; lastMin = key;
    var h = d.getHours(), mm = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    if (C.clock.use24h) { $('hm').textContent = (h < 10 ? '0' : '') + h + ':' + mm; $('ampm').textContent = ''; }
    else { $('hm').textContent = ((h % 12) || 12) + ':' + mm; $('ampm').textContent = h < 12 ? 'AM' : 'PM'; }
    $('date').textContent = C.clock.showDate ? DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()] : '';
  }
  function loadWeather() {
    if (!(C.weather && C.weather.on)) { $('wline').style.display = 'none'; return; }
    D.weather(C.weather.lat, C.weather.lon, function (w) { $('wline').textContent = w ? C.weather.place + '   ' + w.tempC + '°   ' + w.text : C.weather.place; });
  }
  function updateNet() {
    var n = D.network(), label = D.netLabel(n);
    $('netText').textContent = label; $('netIcon').innerHTML = label === 'Ethernet' ? glyph('eth') : glyph('wifi');
    $('netChip').className = n.online ? 'chip' : 'chip off';
  }

  var W = { i: 0, front: 'wallA' };
  function showPhoto(i) {
    var list = C.wallpaper.photos, url = 'wp-' + list[i % list.length] + '.jpg', img = new Image();
    img.onload = function () { var back = W.front === 'wallA' ? 'wallB' : 'wallA'; $(back).style.backgroundImage = 'url(' + url + ')'; $(back).className = 'layer on'; $(W.front).className = 'layer'; W.front = back; };
    img.src = url;
  }
  function startWallpaper() {
    var v = $('wallVideo');
    function live() { showPhoto(0); if (C.wallpaper.photos.length > 1) setInterval(function () { W.i += 1; showPhoto(W.i); }, Math.max(0.5, C.wallpaper.minutesPerPhoto) * 60000); }
    if (C.wallpaper.mode === 'video') {
      var fell = false; v.onerror = function () { if (!fell) { fell = true; v.className = ''; live(); } };
      v.src = '' + C.wallpaper.videoFile; v.className = 'on';
      try { var p = v.play(); if (p && p['catch']) p['catch'](function () { v.onerror(); }); } catch (e) { v.onerror(); } return;
    }
    live();
  }

  function build() {
    $('trackDock').innerHTML = C.apps.map(function (a, i) {
      return '<div class="icon" id="d' + i + '" data-i="' + i + '">' + iconInner(a) + '<div class="lbl">' + esc(a.label) + '</div></div>';
    }).join('');
    for (var i = 0; i < C.apps.length; i++) wireDock($('d' + i), i);
  }
  function wireDock(el, i) {
    if (!el) return;
    el.onmouseenter = function () { if (!S.sheet) { S.focus = 'dock'; S.i = i; hideMusicCard(); paint(); } };
    el.onclick = function () { S.i = i; activate(C.apps[i]); };
  }
  function scrollDock() {
    var n = C.apps.length, full = n * PITCH, x = 0;
    if (full > VIEW_W) x = Math.min(Math.max(0, S.i * PITCH - PITCH), full - VIEW_W + 40);
    $('trackDock').style.transform = 'translateX(' + (-x) + 'px)';
  }
  function paint() {
    var els = document.querySelectorAll('#rowDock .icon'), k;
    for (k = 0; k < els.length; k++) els[k].className = els[k].className.replace(' focus', '');
    if (!S.sheet && S.focus === 'dock') { var el = $('d' + S.i); if (el) el.className += ' focus'; }
    $('music').className = S.mShow ? (S.focus === 'music' ? 'show focus' : 'show') : '';
    scrollDock();
  }

  function findInstalled(p) { var re = new RegExp(p, 'i'); for (var i = 0; i < INSTALLED.length; i++) if (re.test(INSTALLED[i].name)) return INSTALLED[i]; return null; }
  function openUrl(u) { if (!D.isTV()) { flash('Preview', 'On the TV this opens:\n' + u); return; } saveS(); D.open(u); }
  function activate(a) {
    if (a.type === 'folder') return openMore();
    if (a.type === 'info') return openInfo();
    if (a.type === 'web') return openUrl(a.url);
    if (a.type === 'match') {
      var hit = findInstalled(a.match);
      if (hit && hit.web && hit.url) openUrl(hit.url); else if (a.fallback) openUrl(a.fallback); else nativeBlocked(a.label);
    }
  }

  /* ---------- Spotify music widget ---------- */
  function fmt(ms) { var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + ((s % 60) < 10 ? '0' : '') + (s % 60); }
  function renderMusic() {
    var s = S.mState;
    if (!MUSIC || !SP.isConnected()) {
      $('mtitle').textContent = 'Spotify'; $('martist').textContent = 'Press OK to connect your Premium account';
      $('mart').innerHTML = '<div class="martph">♪</div>'; $('mcur').textContent = '0:00'; $('mdur').textContent = '0:00'; $('mfill').style.width = '0%';
      setPlayIcon(true); return;
    }
    if (!s) { $('martist').textContent = 'Starting…'; return; }
    $('mtitle').textContent = s.name || 'Spotify';
    $('martist').textContent = s.artist || '';
    $('mart').innerHTML = s.art ? '<img src="' + esc(s.art) + '" alt="">' : '<div class="martph">♪</div>';
    $('mcur').textContent = fmt(s.position); $('mdur').textContent = fmt(s.duration);
    $('mfill').style.width = (s.duration ? Math.min(100, s.position / s.duration * 100) : 0) + '%';
    setPlayIcon(s.paused);
  }
  function setPlayIcon(paused) {
    $('mplayIcon').innerHTML = paused ? '<polygon points="16,10 38,24 16,38"/>' : '<rect x="15" y="11" width="6" height="26"/><rect x="27" y="11" width="6" height="26"/>';
  }
  function showMusicCard(on) { S.mShow = on; if (on) S.focus = 'music'; paint(); }
  function hideMusicCard() { if (S.mShow) { S.mShow = false; if (S.focus === 'music') S.focus = 'dock'; paint(); } }
  function musicInvoke() {
    if (!MUSIC) { flash('Music', 'Spotify is not set up.'); return; }
    showMusicCard(true);
    if (!SP.isConnected()) { renderMusic(); return; }
    if (!S.started) {
      S.started = true; renderMusic();
      SP.ensurePlayer().then(function (ok) { if (ok) SP.startPlayback(); });
    } else { SP.toggle(); }
  }
  function musicConnectOrToggle() {
    if (!SP.isConnected()) { try { sessionStorage.setItem('vf.play', '1'); } catch (e) {} SP.connect(); return; }
    if (!S.started) musicInvoke(); else SP.toggle();
  }

  /* ---------- sheets ---------- */
  function openSheet(kind, title, hint, html) {
    if (S.closeTimer) { clearTimeout(S.closeTimer); S.closeTimer = 0; }
    S.sheet = kind; $('sheetTitle').textContent = title; $('sheetHint').textContent = hint || '';
    $('sheetBody').innerHTML = html || ''; $('sheet').className = ''; document.body.className = 'sheet-open'; paint();
  }
  function closeSheet() {
    var s = $('sheet'); s.className = 'closing';
    S.closeTimer = setTimeout(function () { if (!S.sheet) s.className = 'hidden'; S.closeTimer = 0; }, 240);
    S.sheet = null; S.fnOpen = false; document.body.className = ''; paint();
  }
  function dockMatchers() {
    var m = []; C.apps.forEach(function (a) { if (a.match) m.push(new RegExp(a.match, 'i')); });
    return m;
  }
  function openMore() {
    var mm = dockMatchers();
    S.grid = INSTALLED.filter(function (x) { for (var i = 0; i < mm.length; i++) if (mm[i].test(x.name)) return false; return true; });
    S.gi = 0;
    var html = '<div class="grid" id="grid">' + S.grid.map(function (x, i) {
      var ic = x.icon ? '<img src="' + esc(x.icon) + '" alt="">' : '<span class="badge">' + esc(x.name.charAt(0)) + '</span>';
      return '<div class="gtile" id="g' + i + '" data-i="' + i + '"><div class="ic">' + ic + '</div>' + (x.web ? '' : '<span class="web0">TV</span>') + '<div class="nm">' + esc(x.name) + '</div></div>';
    }).join('') + '</div>';
    openSheet('more', 'More Apps', 'Arrows / mouse · OK to open · Back to close', html);
    for (var i = 0; i < S.grid.length; i++) wireGrid($('g' + i), i);
    paintGrid();
  }
  function wireGrid(el, i) {
    if (!el) return;
    el.onmouseenter = function () { S.gi = i; paintGrid(); };
    el.onclick = function () { S.gi = i; openGrid(S.grid[i]); };
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
    var b = $('fnBtn'); if (b) b.onclick = function () { toggleFns(); };
  }
  function paintBtn() { var b = $('fnBtn'); if (b) b.className = 'btn' + (S.btn && !S.fnOpen ? ' focus' : ''); }
  function toggleFns() {
    if (S.fnOpen) return; S.fnOpen = true; paintBtn();
    var fns = D.discover(), html = ['<div class="card"><h3>Hidden functions on this TV: ' + fns.length + '</h3><div class="fnlist">'];
    fns.forEach(function (f) { var c = f.danger ? 'warn' : (f.getter ? 'get' : ''); html.push('<div class="' + c + '">' + esc(f.name) + (f.type === 'function' ? '(' + f.arity + ')' : ' : ' + f.type) + '</div>'); });
    html.push('</div></div>'); $('fnHolder').innerHTML = html.join('');
  }

  /* ---------- input ---------- */
  var held = {};
  function key(e) {
    var code = e.keyCode;
    if (PLAYPAUSE.indexOf(code) >= 0) { e.preventDefault(); if (!S.mShow) musicInvoke(); else musicConnectOrToggle(); return; }
    var k = KEYS[code]; if (!k) return; e.preventDefault();
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
        var ih = $('info') ? $('info').offsetHeight : 0, max = Math.max(0, ih - 760);
        S.scroll = k === 'down' ? Math.min(max, S.scroll + 300) : Math.max(0, S.scroll - 300);
        var el = $('info'); if (el) el.style.transform = 'translateY(' + (-S.scroll) + 'px)';
      }
      return;
    }

    /* music focus */
    if (S.focus === 'music') {
      if (k === 'ok') return musicConnectOrToggle();
      if (k === 'left') { if (SP.isConnected() && S.started) SP.prev(); return; }
      if (k === 'right') { if (SP.isConnected() && S.started) SP.next(); return; }
      if (k === 'up' || k === 'down' || k === 'back') { hideMusicCard(); return; }
      return;
    }
    /* dock */
    if (k === 'left' && S.i > 0) S.i--;
    else if (k === 'right' && S.i < C.apps.length - 1) S.i++;
    else if (k === 'down' && S.mShow) { S.focus = 'music'; paint(); return; }
    else if (k === 'ok') return activate(C.apps[S.i]);
    else return;
    saveS(); paint();
  }
  function keyUp(e) { var k = KEYS[e.keyCode]; if (k) held[k] = false; }

  function wireMusicMouse() {
    $('mplay').onclick = function () { musicConnectOrToggle(); };
    $('mprev').onclick = function () { if (SP.isConnected() && S.started) SP.prev(); };
    $('mnext').onclick = function () { if (SP.isConnected() && S.started) SP.next(); };
    $('music').onmouseenter = function () { if (!S.sheet && S.mShow) { S.focus = 'music'; paint(); } };
  }

  /* boot */
  loadS(); S.i = Math.min(S.i, C.apps.length - 1);
  build(); wireMusicMouse(); fit(); tick(); paint(); startWallpaper(); updateNet(); loadWeather();
  setInterval(tick, 1000); setInterval(updateNet, 20000);
  setInterval(function () { if (S.mState && !S.mState.paused) { S.mState.position = Math.min(S.mState.duration, S.mState.position + 1000); if (S.mShow) renderMusic(); } }, 1000);

  if (MUSIC) {
    SP.onState(function (st) { S.mState = st; if (S.mShow) renderMusic(); });
    var seeded = SP.ingestHash && SP.ingestHash();
    if (seeded) {
      flash('Spotify connected', 'Your account is linked on this TV.\nOpen Home and press ▶II to play.\nYou can delete the “Spotify Setup” tile now.');
      setTimeout(function () { if (SP.isConnected()) { showMusicCard(true); musicInvoke(); } }, 400);
    }
    SP.handleRedirect().then(function (ok) {
      var pending = false; try { pending = sessionStorage.getItem('vf.play') === '1'; } catch (e) {}
      if (ok && pending) { try { sessionStorage.removeItem('vf.play'); } catch (e) {} musicInvoke(); }
    });
  }
  /* close sheet by clicking the dimmed background */
  $('sheet').onclick = function (e) { if (e.target === $('sheet')) closeSheet(); };

  window.addEventListener('resize', fit);
  document.addEventListener('keydown', key); document.addEventListener('keyup', keyUp);
  window.VF = { state: function () { return { i: S.i, sheet: S.sheet, mShow: S.mShow, focus: S.focus }; }, music: musicInvoke };
}());
