/* VIDAA Frame — Spotify Premium integration (Authorization Code + PKCE, Web Playback SDK).
   Plays full tracks from the user's own account inside the launcher. ES5 + Promises.
   Needs config.spotify.clientId and the redirect URI registered in the Spotify app. */
(function () {
  'use strict';
  var C = (window.VF_CONFIG && window.VF_CONFIG.spotify) || {};
  var SCOPES = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing';
  var TOKENS = 'vidaaframe.spotify.tok';
  var PKCE = 'vidaaframe.spotify.pkce';
  var API = 'https://api.spotify.com/v1';
  var player = null, deviceId = null, ready = false, stateCb = null, tok = null;

  function redirectUri() { return location.origin + location.pathname; }
  function store(o) { try { localStorage.setItem(TOKENS, JSON.stringify(o)); } catch (e) {} tok = o; }
  function loadTok() { try { tok = JSON.parse(localStorage.getItem(TOKENS) || 'null'); } catch (e) { tok = null; } return tok; }

  function rand(n) {
    var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~', s = '', x = new Uint8Array(n);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(x) : (function () { for (var i = 0; i < n; i++) x[i] = Math.floor(Math.random() * 256); })();
    for (var i = 0; i < n; i++) s += a[x[i] % a.length];
    return s;
  }
  function b64url(buf) {
    var bytes = new Uint8Array(buf), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function challenge(verifier) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then(b64url);
  }

  /* Step 1: begin login (redirects away to Spotify, returns to our page with ?code=). */
  function connect() {
    if (!C.clientId) return;
    var verifier = rand(64), state = rand(16);
    try { localStorage.setItem(PKCE, JSON.stringify({ v: verifier, s: state })); } catch (e) {}
    challenge(verifier).then(function (ch) {
      var u = 'https://accounts.spotify.com/authorize?response_type=code&client_id=' + encodeURIComponent(C.clientId) +
        '&scope=' + encodeURIComponent(SCOPES) + '&redirect_uri=' + encodeURIComponent(redirectUri()) +
        '&code_challenge_method=S256&code_challenge=' + ch + '&state=' + state;
      location.assign(u);
    });
  }

  /* Step 2: on load, if returning with ?code=, exchange it for tokens. Returns Promise<boolean>. */
  function handleRedirect() {
    var m = location.search.match(/[?&]code=([^&]+)/), sm = location.search.match(/[?&]state=([^&]+)/);
    if (!m) return Promise.resolve(false);
    var saved; try { saved = JSON.parse(localStorage.getItem(PKCE) || 'null'); } catch (e) { saved = null; }
    if (!saved || !sm || decodeURIComponent(sm[1]) !== saved.s) return Promise.resolve(false);
    var body = 'grant_type=authorization_code&code=' + encodeURIComponent(m[1]) +
      '&redirect_uri=' + encodeURIComponent(redirectUri()) + '&client_id=' + encodeURIComponent(C.clientId) +
      '&code_verifier=' + encodeURIComponent(saved.v);
    return fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.access_token) return false;
        store({ access: d.access_token, refresh: d.refresh_token, exp: Date.now() + (d.expires_in - 60) * 1000 });
        try { localStorage.removeItem(PKCE); } catch (e) {}
        history.replaceState({}, '', redirectUri());
        return true;
      })['catch'](function () { return false; });
  }

  /* One-time token hand-off: a URL with #sp=<refresh_token> seeds the account on this device
     without any login screen. The token is read, stored locally, then wiped from the URL. */
  function ingestHash() {
    var h = location.hash || '';
    var m = h.match(/[#&]sp=([^&]+)/);
    if (!m) return false;
    store({ access: '', refresh: decodeURIComponent(m[1]), exp: 0 });
    try { history.replaceState({}, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    return true;
  }

  function isConnected() { return !!(loadTok() && tok.refresh); }

  function getToken() {
    loadTok();
    if (!tok || !tok.refresh) return Promise.reject('not connected');
    if (tok.access && Date.now() < tok.exp) return Promise.resolve(tok.access);
    var body = 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(tok.refresh) + '&client_id=' + encodeURIComponent(C.clientId);
    return fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.access_token) throw 'refresh failed';
        store({ access: d.access_token, refresh: d.refresh_token || tok.refresh, exp: Date.now() + (d.expires_in - 60) * 1000 });
        return tok.access;
      });
  }

  /* Step 3: Web Playback SDK device. */
  function ensurePlayer() {
    if (player) return Promise.resolve(true);
    if (!isConnected()) return Promise.resolve(false);
    return new Promise(function (resolve) {
      function make() {
        try {
          player = new Spotify.Player({ name: 'VIDAA Frame', volume: 0.85, getOAuthToken: function (cb) { getToken().then(cb)['catch'](function () {}); } });
          player.addListener('ready', function (e) { deviceId = e.device_id; ready = true; resolve(true); });
          player.addListener('not_ready', function () { ready = false; });
          player.addListener('player_state_changed', function (st) { if (stateCb && st) stateCb(mapState(st)); });
          player.addListener('authentication_error', function () { store(null); });
          player.connect();
        } catch (e) { resolve(false); }
      }
      if (window.Spotify && window.Spotify.Player) make();
      else window.onSpotifyWebPlaybackSDKReady = make;
      setTimeout(function () { if (!ready) resolve(!!player); }, 9000);
    });
  }
  function mapState(st) {
    var t = st.track_window && st.track_window.current_track || {};
    var art = (t.album && t.album.images && t.album.images[0] && t.album.images[0].url) || '';
    var who = (t.artists || []).map(function (a) { return a.name; }).join(', ');
    return { name: t.name || '', artist: who, art: art, paused: !!st.paused, position: st.position || 0, duration: st.duration || 0 };
  }

  function api(method, path, body) {
    return getToken().then(function (a) {
      return fetch(API + path, { method: method, headers: { 'Authorization': 'Bearer ' + a, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    });
  }

  /* Start/resume: transfer to our device and resume the user's playback; start default if idle. */
  function startPlayback() {
    if (!deviceId) return;
    api('PUT', '/me/player', { device_ids: [deviceId], play: true })['catch'](function () {})
      .then(function () {
        setTimeout(function () {
          getToken().then(function (a) {
            fetch(API + '/me/player', { headers: { 'Authorization': 'Bearer ' + a } }).then(function (r) { return r.status === 204 ? null : r.json(); })
              .then(function (pb) {
                if ((!pb || !pb.is_playing) && C.defaultUri) api('PUT', '/me/player/play?device_id=' + deviceId, { context_uri: C.defaultUri })['catch'](function () {});
              })['catch'](function () {});
          })['catch'](function () {});
        }, 800);
      });
  }
  function toggle() { if (player) player.togglePlay(); }
  function next() { if (player) player.nextTrack(); }
  function prev() { if (player) player.previousTrack(); }
  function seek(ms) { if (player) player.seek(Math.max(0, ms)); }
  function onState(cb) { stateCb = cb; }

  window.VFSpotify = {
    enabled: !!C.clientId, handleRedirect: handleRedirect, ingestHash: ingestHash, connect: connect, isConnected: isConnected,
    ensurePlayer: ensurePlayer, startPlayback: startPlayback, toggle: toggle, next: next, prev: prev, seek: seek, onState: onState
  };
}());
