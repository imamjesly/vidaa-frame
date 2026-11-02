/* VIDAA device adapter. READ-ONLY: it only ever reads TV info and navigates the web view.
   It never calls reset/write/install/reboot. Discovers hidden Hisense functions for the
   info panel. ES5 only. */
(function () {
  'use strict';
  var PREFIX = /^(Hisense|HiUtils|His_|Vidaa|VIDAA|omi_|opera_omi|vowOS|TvInfo|VOS_|oipf)/;
  var DANGER = /(reset|reboot|restart|delete|remove|uninstall|install|write|^set|Set[A-Z]|format|clear|factory|standby|shutdown|erase|flash|disable|enable)/;
  var found = null;

  function discover() {
    if (found) return found;
    var names = [], seen = { VidaaDevice: 1 }, k, i;
    try { for (k in window) if (PREFIX.test(k) && !seen[k]) { seen[k] = 1; names.push(k); } } catch (e) {}
    try { var own = Object.getOwnPropertyNames(window); for (i = 0; i < own.length; i++) if (PREFIX.test(own[i]) && !seen[own[i]]) { seen[own[i]] = 1; names.push(own[i]); } } catch (e2) {}
    names.sort();
    found = [];
    for (i = 0; i < names.length; i++) {
      var n = names[i], v, t = 'unknown', ar = 0;
      try { v = window[n]; t = typeof v; } catch (e3) { t = 'error'; }
      if (t === 'function') ar = v.length;
      found.push({ name: n, type: t, arity: ar, danger: DANGER.test(n), getter: /(^|_)[Gg]et/.test(n) });
    }
    return found;
  }

  function fn(name) { try { return typeof window[name] === 'function' ? window[name] : null; } catch (e) { return null; } }
  function call0(name) { var f = fn(name); if (!f) return undefined; try { return f(); } catch (e) { return undefined; } }

  function isTV() {
    return !!(fn('Hisense_GetModelName') || window.omi_platform || /VIDAA|Hisense|Odin/i.test(navigator.userAgent));
  }

  /* Network status for the Wi-Fi indicator. */
  function network() {
    var info = call0('Hisense_GetNetworkInfo');
    if (info && typeof info === 'object') {
      return { online: !!info.net_status, type: String(info.net_type || ''), ip: info.ip_address || '' };
    }
    var st = call0('Hisense_GetNetStatus'), ty = call0('Hisense_GetNetType');
    if (st !== undefined || ty !== undefined) return { online: !!st, type: String(ty || ''), ip: call0('Hisense_GetIPAddress') || '' };
    return { online: navigator.onLine, type: '', ip: '' };
  }
  function netLabel(n) {
    var t = (n.type || '').toLowerCase();
    if (!n.online) return 'Offline';
    if (t.indexOf('ether') >= 0 || t.indexOf('lan') >= 0 || t === '1') return 'Ethernet';
    return 'Wi‑Fi';
  }

  function deviceInfo() {
    var d = { model: call0('Hisense_GetModelName'), firmware: call0('Hisense_GetFirmWareVersion'),
      os: 'VIDAA ' + (call0('Hisense_GetOSVersion') || ''), chromium: call0('Hisense_GetChromiumVersion'),
      brand: call0('Hisense_GetBrand'), region: call0('Hisense_GetCountryCode'), resolution: call0('Hisense_GetPanelResolution') };
    var out = {};
    for (var k in d) if (d[k] !== undefined && d[k] !== '') out[k] = String(d[k]).slice(0, 60);
    return out;
  }

  /* Open a web app in the launcher's own view. Native (non-http) targets cannot be launched. */
  function open(url) {
    try { location.assign(url); } catch (e) { location.href = url; }
  }

  window.VidaaDevice = {
    isTV: isTV, discover: discover, network: network, netLabel: netLabel,
    deviceInfo: deviceInfo, open: open
  };
}());
