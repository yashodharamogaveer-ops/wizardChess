# Wizard Chess 3D

3D Gothic Cathedral chess with cinematic captures and a single-player AI.
**Developed by Yashodhar Mogaveera & Sharanya Poojary.**

## Run
```
npm install
npm run dev          # http://localhost:3000  (change port in package.json + vite.config.ts)
```

## Test the PWA (service worker only runs in a production build)
```
npm run build
npm run preview      # open the shown URL, then use the browser's "Install" option
```
After the first load the whole game (including 3D models) works offline.
Deploy the `dist` folder to any HTTPS host (Netlify, Vercel, GitHub Pages) for installation on phones.

## Features added
- **Leaderboard**: player name prompt, wins/losses/draws, points (win 3, draw 1), best time, streaks, result card after each game, export/reset. Stored in the browser (localStorage) on each device.
- **Developer credits**: loading screen, welcome screen, permanent footer watermark, About dialog, result card, checkmate banner, page title, meta tags and PWA manifest. Edit names in `src/config/credits.ts`.
- **PWA**: manifest, icons, offline service worker (generated at build by `vite.config.ts`), install button.

## Tests
`npm test`
