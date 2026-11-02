/* VIDAA Frame — your settings. Edit this file, re-upload, and the TV picks it up on next launch.
   Plain ES5 only (the TV browser is old): no arrow functions, no `let`/`const`, no trailing commas. */
window.VF_CONFIG = {
  owner: 'Imaam',

  clock: {
    use24h: false,          // true = 21:40, false = 9:40 pm
    showDate: true,
    showGreeting: true      // "Good evening, Imaam"
  },

  wallpaper: {
    // 'live'  = slow drifting photos that cross-fade (Ken Burns)
    // 'video' = loops <videoFile> next to index.html (muted). Falls back to 'live' if it can't play.
    mode: 'live',
    videoFile: 'live.mp4',
    minutesPerPhoto: 2,
    photos: ['golden', 'sydney', 'misty', 'night', 'peaks', 'cove', 'valley', 'forest', 'alpine', 'bridge']
  },

  /* Row 1 — scroll sideways. Order here = order on screen.
     type 'web'    : opens the URL (in the TV Browser when available, so you get a cursor).
     type 'app'    : opens the installed VIDAA app whose name matches `match`; else `fallbackUrl`.
     type 'folder' : the More Apps folder (every other installed app). */
  apps: [
    { id: 'takip',   name: 'Takip724',  type: 'web', url: 'https://www.takip724.com/vehicle-tracking-system/', mark: 'T', color: '#e2552d', inBrowser: true },
    { id: 'youtube', name: 'YouTube',   type: 'app', match: 'youtube',   fallbackUrl: 'https://www.youtube.com/tv', icon: 'ic-youtube.svg', color: '#ff0033' },
    { id: 'spotify', name: 'Spotify',   type: 'app', match: 'spotify',   fallbackUrl: 'https://open.spotify.com',   icon: 'ic-spotify.svg', color: '#1db954' },
    { id: 'appletv', name: 'Apple TV',  type: 'app', match: 'apple tv',  fallbackUrl: 'https://tv.apple.com',       icon: 'ic-appletv.svg', color: '#1c1c1e' },
    { id: 'browser', name: 'Browser',   type: 'app', match: 'browser',   glyph: 'globe', color: '#2f6fe4' },
    { id: 'more',    name: 'More Apps', type: 'folder', glyph: 'grid', color: '#3a3a44' }
  ],

  /* Row 2 — press Down. `match` finds a matching VIDAA app/setting; `help` is shown if the TV won't open it directly. */
  connections: [
    { id: 'wifi',      name: 'Wi-Fi',            glyph: 'wifi',      match: 'network', setting: 'network',
      help: 'Remote: Settings (gear) → Network → Network Configuration.' },
    { id: 'bluetooth', name: 'Bluetooth',        glyph: 'bluetooth', match: 'bluetooth', setting: 'bluetooth',
      help: 'Remote: Settings → Network (or System) → Bluetooth → Equipment Management.' },
    { id: 'airplay',   name: 'AirPlay',          glyph: 'airplay',   match: 'airplay', setting: 'airplay',
      help: 'On your iPhone/Mac: Control Centre → Screen Mirroring → pick this TV. TV side: Settings → System → AirPlay and HomeKit.' },
    { id: 'mirror',    name: 'Screen Mirroring', glyph: 'mirror',    match: 'mirror|screen share|anyview cast|cast',
      help: 'Open “Screen Mirroring” from the Inputs list, then pick this TV from your phone.' },
    { id: 'dex',       name: 'DeX',              glyph: 'dex',       match: 'mirror|screen share|anyview cast|cast',
      help: 'Opens Screen Mirroring. On your Galaxy: Quick panel → DeX → pick this TV.' },
    { id: 'info',      name: 'Launcher info',    glyph: 'info',      type: 'diagnostics' }
  ]
};
