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

## Project structure

```text
.
├─ src/
│  ├─ main.ts
│  ├─ style.css
│  └─ game/
│     ├─ game.ts
│     ├─ ui.ts
│     ├─ logVariants.ts
│     ├─ types.ts
│     ├─ data.ts
│     └─ save.ts
├─ public/data/
├─ documentation/
└─ index.html
```

## Engineering conventions

- Use TypeScript files in `src/` as canonical source.
- Keep gameplay state changes centralized in `Game` (`src/game/game.ts`).
- Keep direct DOM manipulation inside `UI` (`src/game/ui.ts`).
- Prefer data additions in `public/data/` for content expansion where possible.

## Workflow for gameplay changes

1. Add/adjust state types in `src/game/types.ts`.
2. Update progression, timing, and survival logic in `src/game/game.ts`.
3. Update render methods and panel behavior in `src/game/ui.ts`.
4. Run `npm run build` to type-check and verify bundling.
5. Manually verify progression in browser.

## Debugging shortcuts

In browser devtools:

```js
window.__aseDebug.boostVitals();
window.__aseDebug.unlockLook();
window.__aseDebug.jumpReveal3();
```

## Planned technical debt cleanup

- Remove or regenerate checked-in transpiled JS sidecars under `src/game/*.js` when build strategy is finalized.
- Decide whether to activate `save.ts`/`data.ts` in production flow or remove until needed.
- Add automated checks (lint, unit tests, integration tests) as systems become more data-driven.

## Documentation maintenance

When behavior changes, update:
- `README.md` for user-facing setup and feature status,
- `documentation/gameplay-systems.md` for mechanics,
- `documentation/architecture.md` for module responsibilities.
