# the-silent-echo
A Silent Echo is a text-based sci-fi horror survival game with a retro-futuristic terminal-like UI.

## Run (dev)
```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Controls
Start at `WAKE UP...`, then follow the intro loop:
1. `STOKE REACTOR` to survive.
2. Reach the threshold to unlock `LOOK AROUND`.
3. Progress through staged reveals, take the band, then `ENTER` the doorway.

Notes:
- Logs are newest-first.
- System logs are prefixed with `SYSTEM:`.
- VITALS stay hidden until the band is taken.
- Demo ends when `ENTER` is pressed and can be restarted.

## Debug Hooks (dev)
In browser devtools:
- `window.__aseDebug.boostVitals()`
- `window.__aseDebug.unlockLook()`
- `window.__aseDebug.jumpReveal3()`
