# VIDAA Frame — Imaam's Hisense home screen

A clean home screen for the Hisense 100" (VIDAA U9, software V0000.09.60D), adapted from
[CleanFrame](https://github.com/nthnclrk/CleanFrame) (Samsung-only) for VIDAA.

- Live wallpaper (slow drifting photos, or your own looping video) + clock widget
- **Apps row** (Left/Right): Takip724 → YouTube → Spotify → Apple TV → Browser → **More Apps**
- **Connections row** (Down): Wi-Fi, Bluetooth, AirPlay, Screen Mirroring, DeX, Launcher info
- Everything you'll want to change is in **`config.js`**.

Nothing on the TV is rooted, flashed or uninstalled. Removing the tile undoes it completely.

---

## Step 1 — Put the launcher online (free, ~10 min, once)

The TV runs web-app tiles from a web address, so the files need a home online. GitHub Pages is free:

1. Sign in at github.com → **New repository** → name it `vidaa-frame` → **Public** → Create.
2. On the new repo page: **uploading an existing file** → drag in *everything inside* this `VIDAA-Frame` folder
   (index.html, config.js, main.js, vidaa.js, style.css, assets/ …) → **Commit changes**.
3. Repo **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
4. After ~1 minute your launcher lives at `https://<your-github-username>.github.io/vidaa-frame/`.

## Step 2 — Test it on the TV (no install, zero risk)

1. On the TV open **Browser** and go to your address from Step 1.
2. Try the remote: Left/Right, Down, OK, Back.
3. Go **Down → Launcher info**. Press Down to scroll, and **take a photo of every screen**. Send them to Claude.
   This lists the hidden Hisense functions on your firmware; it's what lets the tiles open native apps
   (YouTube, Spotify, Apple TV, Browser), the More Apps folder and the Connections shortcuts directly.
   The launcher only ever *reads* — anything named reset/write/install/set is shown in red and never run.

## Step 3 — Install it as a permanent tile (once, from your laptop)

Use **Sidee** (Windows, tested on VIDAA firmware 09.60 — same as yours):
<https://github.com/Empi9245/Sidee/releases>

1. Laptop and TV on the same Wi-Fi.
2. Download the zip → extract → double-click `start-windows.bat` (first run fetches Python automatically).
3. In the dashboard: **Find TV → Request code** → type the PIN shown on the TV → Confirm.
4. Add a custom app: Name `Home`, URL = your address from Step 1. Install.
5. On the TV, open the app list, find **Home**, and move it to the first position.

After this the laptop is not needed. To update the launcher later, just edit files on GitHub — the tile always
loads the latest version.

**To remove:** delete the "Home" tile from the TV's app list (or remove it in Sidee).

## Step 4 — Cut the ads (TV-wide)

- **DNS ad blocking:** Settings → Network → Network Configuration → (your connection) → IP Settings →
  DNS: Manual → `94.140.14.14` and `94.140.15.15` (AdGuard DNS). Then System → Application Settings → Clear cache,
  and restart the TV. Some owners report this doesn't catch every VIDAA ad; a home Pi-hole/AdGuard Home works better.
- **VIDAA settings:** under Settings → System / Support / Privacy, turn **off** anything named advertising,
  interest-based ads, viewing information, content recommendations, or "smart TV experience" data. Reset the advertising ID.
- **Power-on:** set the TV's power-on input/home behaviour to *Last used* if offered, so it reopens where you were.

## What VIDAA does not allow (no workaround without rooting)

- Google Play / Android apps: VIDAA isn't Android. **More Apps** shows every app installed from the VIDAA store instead.
- Replacing the remote's Home button or the stock home screen. Your launcher sits as the first tile; Home still
  goes to VIDAA's screen, one press away.
- Uninstalling Hisense's built-in apps.

## Customising (`config.js`)

| Setting | What it does |
| --- | --- |
| `clock.use24h` | `true` for 21:40, `false` for 9:40 pm |
| `wallpaper.mode` | `'live'` drifting photos, or `'video'` to loop `assets/live/live.mp4` |
| `wallpaper.photos` | Which photos rotate, from `assets/wallpapers/` (add your own JPGs, 1920×1080) |
| `apps` | Order of the Apps row. Add a website: `{ name: 'X', type: 'web', url: 'https://…', mark: 'X', color: '#123456' }` |
| `connections` | The Connections row and the help text shown if the TV won't open a setting directly |

For a custom **video** live wallpaper: an MP4 (H.264, 1920×1080, 10–30 s, under ~15 MB, seamless loop),
named `live.mp4`, in `assets/live/`, and set `mode: 'video'`.

## Credits

Design language and photos from CleanFrame by Nathan Clark (MIT, see `CLEANFRAME-LICENSE.txt`); photo credits in
`assets/wallpapers/SOURCES.json` (Unsplash). Manrope font under SIL OFL (`assets/manrope-OFL.txt`).
YouTube/Spotify/Apple TV marks from Simple Icons (`assets/icons/SIMPLE-ICONS-LICENSE.txt`); brands belong to their owners.
Not affiliated with Hisense or VIDAA.
