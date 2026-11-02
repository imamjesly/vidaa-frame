/* VIDAA device adapter. Discovers the hidden Hisense JavaScript functions on this TV and uses
   only READ-style ones automatically. Anything that installs, writes, resets or changes settings
   is never called by the launcher. ES5 only. */
(function () {
  'use strict';
  var PREFIX = /^(Hisense|HiUtils|hisense|Vidaa|vidaa|VIDAA|omi_|Omi|hiBrowser|HiBrowser|opera|Opera)/;
  var DANGER = /(reset|reboot|restart|delete|remove|uninstall|install|write|set|format|clear|factory|power|upgrade|update|standby|shutdown|kill|erase|flash|pair|createRequest)/i;
  var LAUNCH_HINT = /(launch|open|start|run|exec)/i;
  var OWN = { VidaaDevice: 1 };
  var found = null;

  function discover() {
    if (found) return found;
    var names = [], k, seen = {};
    try {
      for (k in window) { if (PREFIX.test(k) && !OWN[k] && !seen[k]) { seen[k] = 1; names.push(k); } }
    } catch (e) { /* some TV globals throw on access */ }
    try {
      var own = Object.getOwnPropertyNames(window);
      for (var i = 0; i < own.length; i++) if (PREFIX.test(own[i]) && !OWN[own[i]] && !seen[own[i]]) { seen[own[i]] = 1; names.push(own[i]); }
    } catch (e2) { /* ignore */ }
    names.sort();
    found = names.map(function (n) {
      var v, type = 'unknown', src = '', arity = 0;
      try { v = window[n]; type = typeof v; } catch (e) { type = 'error'; }
      if (type === 'function') {
        arity = v.length;
        try { src = String(v).replace(/\s+/g, ' ').slice(0, 160); } catch (e3) { src = ''; }
      }
      return { name: n, type: type, arity: arity, src: src, danger: DANGER.test(n), launchy: LAUNCH_HINT.test(n) };
    });
    return found;
  }

  function fn(name) { try { return typeof window[name] === 'function' ? window[name] : null; } catch (e) { return null; } }

  /* Safe zero-argument getters for the info panel. */
  function info() {
    var out = { userAgent: navigator.userAgent, screen: screen.width + 'x' + screen.height, page: location.href };
    discover().forEach(function (f) {
      if (f.type !== 'function' || f.danger || f.arity !== 0) return;
      if (!/(^|_)get/i.test(f.name)) return;
      try { var r = window[f.name](); if (r !== undefined && typeof r !== 'object') out[f.name] = String(r).slice(0, 80); }
      catch (e) { /* ignore */ }
    });
    return out;
  }

  /* Installed-app list. VIDAA keeps it in websdk/Appinfo.json; read-only access only. */
  var APPINFO = ['/3rd_rw/websdk/Appinfo.json', '/var/websdk/Appinfo.json', '/3rd/websdk/Appinfo.json', 'websdk/Appinfo.json'];
  function parseApps(text) {
    var data, list = [];
    try { data = typeof text === 'string' ? JSON.parse(text) : text; } catch (e) { return null; }
    var arr = data && (data.AppInfo || data.appInfo || data.apps || data.list || data);
    if (!arr || typeof arr.length !== 'number') return null;
    for (var i = 0; i < arr.length; i++) {
      var a = arr[i] || {};
      var name = a.AppName || a.appName || a.name || a.title;
      if (!name) continue;
      list.push({ id: String(a.AppId || a.appId || a.id || name), name: String(name),
        url: a.AppUrl || a.appUrl || a.url || a.URL || '', icon: a.Image_icon || a.Thumb || a.icon || a.iconUrl || a.smallIcon || '' });
    }
    return list;
  }
  function apps(done) {
    var read = fn('Hisense_FileRead') || fn('Hisense_fileRead');
    if (read) {
      for (var i = 0; i < APPINFO.length; i++) {
        try {
          var r = read(APPINFO[i], 0);
          var list = r && parseApps(r);
          if (list && list.length) { done(null, list, 'file:' + APPINFO[i]); return; }
        } catch (e) { /* try next */ }
      }
    }
    var getters = ['Hisense_GetAppList', 'Hisense_getAppList', 'Hisense_GetInstalledApps', 'Hisense_GetAllApps'];
    for (var j = 0; j < getters.length; j++) {
      var g = fn(getters[j]);
      if (!g) continue;
      try { var l2 = parseApps(g()); if (l2 && l2.length) { done(null, l2, getters[j]); return; } } catch (e2) { /* next */ }
    }
    done({ message: 'This TV did not share its app list with the launcher yet.' }, [], 'none');
  }

  /* Launch an installed app record. Web-based VIDAA apps carry a URL we can open directly.
     Native-only apps need a launch function that Diagnostics must discover first. */
  var LAUNCHERS = ['Hisense_launchApp', 'Hisense_LaunchApp', 'Hisense_StartApp', 'Hisense_startApp', 'Hisense_OpenApp', 'Hisense_openApp'];
  function launch(app, done) {
    for (var i = 0; i < LAUNCHERS.length; i++) {
      var f = fn(LAUNCHERS[i]);
      if (!f) continue;
      try { f(app.id, app.name, app.url || ''); done(null, LAUNCHERS[i]); return; } catch (e) { /* next */ }
    }
    if (app.url && /^https?:/i.test(app.url)) { done(null, 'url'); location.href = app.url; return; }
    done({ message: app.name + ' can’t be opened from here yet.', detail: 'Open Launcher info and send me a photo — I’ll wire it up.' });
  }

  /* Open a web page in the TV Browser (cursor support) if a browser launcher exists. */
  var BROWSERS = ['Hisense_OpenBrowser', 'Hisense_openBrowser', 'Hisense_OpenURL', 'Hisense_openUrl', 'Hisense_LaunchBrowser'];
  function browse(url, done) {
    for (var i = 0; i < BROWSERS.length; i++) {
      var f = fn(BROWSERS[i]);
      if (!f) continue;
      try { f(url); done(null, BROWSERS[i]); return; } catch (e) { /* next */ }
    }
    done(null, 'location'); location.href = url;
  }

  window.VidaaDevice = { discover: discover, info: info, apps: apps, launch: launch, browse: browse,
    isTV: function () { return discover().length > 0 || /VIDAA|Hisense|HbbTV/i.test(navigator.userAgent); } };
}());
