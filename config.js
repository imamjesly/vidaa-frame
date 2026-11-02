/* VIDAA Frame — your settings. Edit, re-upload to GitHub, the TV picks it up next open.
   Plain ES5 (old TV browser): no arrow functions, no let/const, no trailing commas. */
window.VF_CONFIG = {
  version: '2.0.0',
  author: 'Imaam Jesly',

  clock: {
    use24h: false,       // true = 21:40 ; false = 9:40
    showDate: true
  },

  wallpaper: {
    mode: 'live',        // 'live' = drifting photos ; 'video' = loop assets/live/live.mp4
    videoFile: 'live.mp4',
    minutesPerPhoto: 2,
    photos: ['golden', 'sydney', 'night', 'peaks', 'misty', 'cove', 'valley', 'forest', 'alpine', 'bridge']
  },

  /* Dock — scroll Left/Right. Takip first.
     web   : opens the address inside the launcher (login stays saved).
     match : finds the installed VIDAA app by name; opens its web app. fallback used if absent.
     folder: the More Apps grid of everything installed. */
  apps: [
    { id: 'takip',   label: 'Takip724', type: 'web',    url: 'https://www.takip724.com/vehicle-tracking-system/', icon: 'takip.png', tint: '#e2552d' },
    { id: 'youtube', label: 'YouTube',  type: 'match',  match: 'youtube',  fallback: 'https://www.youtube.com/tv', icon: 'ic-youtube.svg', tint: '#ff0033' },
    { id: 'spotify', label: 'Spotify',  type: 'match',  match: 'spotify',  fallback: 'https://open.spotify.com',   icon: 'ic-spotify.svg', tint: '#1db954' },
    { id: 'appletv', label: 'TV',       type: 'match',  match: 'apple tv', fallback: 'https://tv.apple.com',       icon: 'ic-appletv.svg', tint: '#0a0a0a' },
    { id: 'browser', label: 'Safari',   type: 'browser', glyph: 'safari', tint: '#1d7dfd' },
    { id: 'more',    label: 'More Apps', type: 'folder', glyph: 'grid',    tint: '#3b3b44' }
  ],

  /* Connections — press Down. VIDAA blocks opening these from a web app, so each shows an
     Apple-style panel with the exact remote steps. */
  connections: [
    { id: 'wifi',      label: 'Wi‑Fi',            glyph: 'wifi',
      steps: ['Press the gear/Settings button on the remote', 'Open Network', 'Network Configuration'] },
    { id: 'bluetooth', label: 'Bluetooth',        glyph: 'bluetooth',
      steps: ['Settings (gear) on the remote', 'System or Network', 'Bluetooth → Equipment Management'] },
    { id: 'airplay',   label: 'AirPlay',          glyph: 'airplay',
      steps: ['On your iPhone/Mac open Control Centre', 'Tap Screen Mirroring', 'Pick this TV'],
      note: 'TV side: Settings → System → AirPlay & HomeKit must be On.' },
    { id: 'mirror',    label: 'Screen Mirroring', glyph: 'mirror',
      steps: ['On your phone open Smart View / Cast', 'Pick this TV', 'Accept on the TV'] },
    { id: 'dex',       label: 'DeX',              glyph: 'dex',
      steps: ['On your Galaxy open the Quick panel', 'Tap DeX', 'Pick this TV'] },
    { id: 'info',      label: 'Launcher info',    glyph: 'info', type: 'info' }
  ]
};
