/* VIDAA Frame — your settings. Edit, re-upload to GitHub, the TV picks it up next open.
   Plain ES5 (old TV browser): no arrow functions, no let/const, no trailing commas. */
window.VF_CONFIG = {
  version: '4.0.0',
  author: 'Imaam Jesly',

  clock: { use24h: false, showDate: true },

  weather: { on: true, lat: -37.8136, lon: 144.9631, place: 'Melbourne' },

  /* Liquid-glass Spotify widget. Paste any Spotify playlist/album/track link here. */
  music: { on: true, uri: 'spotify:playlist:37i9dQZF1DX5trt9i14X7j', label: 'Spotify' },

  wallpaper: {
    mode: 'live', videoFile: 'live.mp4', minutesPerPhoto: 2,
    photos: ['golden', 'sydney', 'night', 'peaks', 'misty', 'cove', 'valley', 'forest', 'alpine', 'bridge']
  },

  /* Dock — iOS-style glass icons. Takip first. Web apps open in the launcher view. */
  apps: [
    { id: 'takip',   label: 'Takip724', type: 'web',    url: 'https://www.takip724.com/vehicle-tracking-system/', logo: 'takip.png' },
    { id: 'youtube', label: 'YouTube',  type: 'match',  match: 'youtube',  fallback: 'https://www.youtube.com/tv', logo: 'ic-youtube.svg', tint: '#ff0033' },
    { id: 'spotify', label: 'Spotify',  type: 'match',  match: 'spotify',  fallback: 'https://open.spotify.com',   logo: 'ic-spotify.svg', tint: '#1db954' },
    { id: 'appletv', label: 'TV',       type: 'match',  match: 'apple tv', fallback: 'https://tv.apple.com',       logo: 'ic-appletv.svg', tint: '#111' },
    { id: 'browser', label: 'Safari',   type: 'web',    url: 'https://www.bing.com', glyph: 'safari', tint: '#1d7dfd' },
    { id: 'more',    label: 'More Apps', type: 'folder', glyph: 'grid', tint: '#2f3038' },
    { id: 'info',    label: 'Info',     type: 'info',   glyph: 'info', tint: '#2f3038' }
  ]
};
