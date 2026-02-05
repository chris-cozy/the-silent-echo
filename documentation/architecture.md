# Architecture

## High-level runtime flow

1. `src/main.ts` imports styles and starts the game.
2. `startGame()` in `src/game/game.ts` creates a `UI` instance and a `Game` instance.
3. UI callbacks (`wake`, `action`, `enter`, `restart`) call game methods.
4. Game mutates internal state and re-renders UI each tick/event.

## Core modules

### `src/game/engine.ts`

Deterministic game core:
- serializable state construction,
- action and navigation reducers,
- tick progression and survival math,
- derived UI model for actions/navigation/vitals/storage/AI,
- run-seeded ambient log triggering (via injected RNG).

### `src/game/game.ts`

Runtime wrapper around the deterministic core:
- boot sequence and lifecycle wiring,
- timer scheduling and real-time tick integration,
- mapping engine log keys to narrative/system text,
- UI updates and modal control.
Runtime scheduling uses a fixed tick (`TICK_MS = 250`) and forwards elapsed time to the engine.

### `src/game/ui.ts`

Responsible for DOM rendering and UX effects:
- action buttons and cooldown display,
- panel visibility,
- boot animation,
- navigation panel,
- typewriter log queue.

Design choices:
- immediate action trigger uses `pointerdown` for responsiveness,
- newest log entries are inserted at the top,
- queue backpressure accelerates typing when many entries are pending.

### `src/game/types.ts`

Shared data contracts for:
- runtime state (`GameState`),
- intro stage enum (`IntroStage`),
- content data interfaces (`RoomDef`, `EventDef`, `RecipeDef`).

### `src/game/logVariants.ts`

Narrative log variant system:
- weighted random phrase selection,
- anti-repeat behavior per key,
- sticky variants for repeated actions that should remain tonally consistent,
- seeded PRNG for reproducible run flavoring.

### `src/game/data.ts` and `src/game/save.ts`

Infrastructure modules currently available for future integration:
- JSON bundle loading from `/data/*.json`,
- `localStorage` state persistence helpers.

## UI composition

Main UI structure in `index.html`:
- header (`Echo-03`, player placeholder),
- left stack (room/actions, vitals band, storage, AI, map, navigation),
- right log panel,
- overlays (wake, boot, demo end),
- visual layers (scanlines/noise/glow).

Current behavior notes:
- map panel exists but is rendered hidden in the current loop,
- nav panel appears only when reveal progression reaches doorway unlock,
- vitals panel appears after wrist band acquisition.
- storage panel persists and lists acquired items,
- AI panel appears after terminal inspection.

## Data layout

- `public/data/rooms.json`
- `public/data/events.json`
- `public/data/recipes.json`

These are included in builds and can be fetched at runtime.

## Build artifacts and source-of-truth

- TypeScript source is in `src/**/*.ts`.
- Compiled JS sidecars currently exist in `src/**/*.js`.
- Production bundle output goes to `dist/`.

Contributors should treat `.ts` files as canonical unless a deliberate JS-only change is required.
