# A Silent Echo (`the-silent-echo`)

A browser-based, text-driven sci-fi horror survival game with a retro terminal interface.

The current build is an interactive vertical-slice intro focused on atmosphere, survival pressure, and gradual UI reveal.

## Documentation

- [Project Overview](documentation/project-overview.md)
- [Architecture](documentation/architecture.md)
- [Gameplay Systems](documentation/gameplay-systems.md)
- [Content Data Model](documentation/content-data.md)
- [Development Guide](documentation/development.md)
- [Testing Strategy](documentation/testing.md)
- [Original Design Spec](documentation/game-spec.md)

## Quick start

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal (usually `http://localhost:5173`).

## Available scripts

- `npm run dev` starts the local development server.
- `npm run build` runs TypeScript compile and Vite production build.
- `npm run preview` serves the built app locally.

## Tech stack

- TypeScript + Vite
- Browser DOM UI (no framework)
- CSS-driven terminal visuals and effects
- JSON content packs in `public/data/`

## Current status

Implemented:
- Wake screen and boot sequence.
- Reactor survival loop (`STOKE EMBERS`) with cooldown and heat decay.
- Health regeneration/drain tied to heat state.
- Progressive unlock flow (`LOOK AROUND`, `TAKE THE BAND`, `ENTER`).
- Typing-style log feed with system and narrative channels.
- End-of-demo modal with run restart.
- Seeded log text variants for subtle narrative variation.

Scaffolded but not wired into the live loop yet:
- JSON data loading (`src/game/data.ts`).
- Save/load helpers via `localStorage` (`src/game/save.ts`).

## License

GNU GPL v3. See [LICENSE](LICENSE).
