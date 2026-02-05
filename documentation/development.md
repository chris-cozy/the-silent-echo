# Development Guide

## Prerequisites

- Node.js 20+ recommended.
- npm 10+ recommended.

## Local setup

```bash
npm install
npm run dev
```

## Build and preview

```bash
npm run build
npm run preview
```

## Testing

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Test strategy details live in `documentation/testing.md`.

## Project structure

```text
.
├─ src/
│  ├─ main.ts
│  ├─ style.css
│  └─ game/
│     ├─ game.ts
│     ├─ engine.ts
│     ├─ ui.ts
│     ├─ uiTypes.ts
│     ├─ logVariants.ts
│     ├─ types.ts
│     ├─ data.ts
│     └─ save.ts
├─ public/data/
├─ documentation/
├─ tests/
└─ index.html
```

## Engineering conventions

- Use TypeScript files in `src/` as canonical source.
- Keep gameplay state changes centralized in the deterministic engine (`src/game/engine.ts`).
- Keep direct DOM manipulation inside `UI` (`src/game/ui.ts`).
- Prefer data additions in `public/data/` for content expansion where possible.

## Workflow for gameplay changes

1. Add/adjust state types in `src/game/types.ts`.
2. Update deterministic state logic in `src/game/engine.ts`.
3. Update render methods and panel behavior in `src/game/ui.ts`.
4. Wire UI integration in `src/game/game.ts` (if needed).
5. Run `npm test` and `npm run build`.
6. Manually verify progression in browser for feel and presentation.

## Debugging shortcuts

In browser devtools:

```js
window.__aseDebug.boostVitals();
window.__aseDebug.unlockLook();
window.__aseDebug.jumpReveal3();
window.__aseDebug.setHeat(30);
window.__aseDebug.setHealth(50);
window.__aseDebug.setHeatCap(80);
window.__aseDebug.setTimeMinutes(720);
window.__aseDebug.setRoom("darkness");
window.__aseDebug.setRevealStep(3);
window.__aseDebug.setFeelStep(4);
window.__aseDebug.setLookStep(2);
window.__aseDebug.setNavUnlocked(true);
window.__aseDebug.setLeverPulled(true);
window.__aseDebug.setPullLeverUnlocked(true);
window.__aseDebug.setPartialDoorDiscovered(true);
window.__aseDebug.setTabletTaken(true);
window.__aseDebug.fastForward(10000);
window.__aseDebug.pauseLoop();
window.__aseDebug.resumeLoop();
```

Debug helpers are available only in dev builds (`npm run dev`).

## Planned technical debt cleanup

- Remove or regenerate checked-in transpiled JS sidecars under `src/game/*.js` when build strategy is finalized.
- Decide whether to activate `save.ts`/`data.ts` in production flow or remove until needed.
- Expand automated checks (linting, broader playthrough coverage) as systems become more data-driven.

## Documentation maintenance

When behavior changes, update:
- `README.md` for user-facing setup and feature status,
- `documentation/gameplay-systems.md` for mechanics,
- `documentation/architecture.md` for module responsibilities.
