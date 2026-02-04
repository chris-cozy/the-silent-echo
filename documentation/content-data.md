# Content Data Model

## Purpose

The project includes JSON content packs for future data-driven systems:
- rooms,
- weighted events,
- crafting recipes.

Loader entrypoint: `src/game/data.ts`.

## Files

- `public/data/rooms.json`
- `public/data/events.json`
- `public/data/recipes.json`

## Schemas

### Room (`RoomDef`)

```json
{
  "id": "maintenance",
  "name": "Maintenance Bay",
  "adjacent": ["cryo", "control", "power_access"],
  "powerCost": 1,
  "repairCost": 2,
  "starting": false,
  "grantsPowerCapacity": 0
}
```

Fields:
- `id`: stable room key.
- `name`: display label.
- `adjacent`: neighboring room ids.
- `powerCost`: ongoing power requirement.
- `repairCost`: repair effort/cost before activation.
- `starting` (optional): marks initial room.
- `grantsPowerCapacity` (optional): increases global power capacity when restored.

### Event (`EventDef`)

```json
{
  "id": "power_flicker",
  "name": "Power flicker",
  "weight": 3,
  "delta": { "power": -1 },
  "log": "Power flickers in the corridor. A circuit trips."
}
```

Fields:
- `id`: stable event key.
- `name`: readable event title.
- `weight`: selection weight in a weighted table.
- `delta`: resource changes by resource id.
- `log`: message shown to player.

### Recipe (`RecipeDef`)

```json
{
  "id": "battery",
  "name": "Battery",
  "cost": { "parts": 2, "scrap": 1 },
  "effect": { "powerMax": 1, "power": 1 }
}
```

Fields:
- `id`: stable recipe key.
- `name`: display name.
- `cost`: required inventory ingredients.
- `effect`: resource/stat changes on craft.

## Authoring guidelines

- Keep ids lowercase snake_case.
- Treat ids as API contracts; avoid renaming after release.
- Validate adjacency symmetry when updating rooms.
- Keep event logs concise and atmosphere-consistent.
- Additive changes are safer than destructive edits for backward compatibility.

## Current integration status

Data contracts are defined and assets are present, but the live gameplay loop currently uses hardcoded intro logic in `src/game/game.ts`.
