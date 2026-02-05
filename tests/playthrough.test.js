import assert from "node:assert/strict";
import test from "node:test";
import { NAV_PARTIAL_DOOR, ROOM_DARKNESS, ROOM_DARK_ROOM } from "../src/game/engine.js";
import { action, createRun, derive, enter, wake } from "./helpers/engineHarness.js";

function bootstrapNavUnlocked(run) {
  wake(run);
  run.state.started = true;
  run.state.stage = "NAV_UNLOCKED";
  run.state.navUnlocked = true;
  run.state.rooms.dark_room.lookUnlocked = true;
  run.state.rooms.dark_room.revealStep = 3;
  run.state.rooms.dark_room.displayName = "A DARK ROOM";
  run.state.currentRoomId = ROOM_DARK_ROOM;
  run.state.heat = 30;
  run.state.health = 20;
}

test("lever path discovers partial door via look steps", () => {
  const run = createRun({ seed: 11 });
  bootstrapNavUnlocked(run);

  enter(run, ROOM_DARKNESS);
  action(run, "feel around");
  action(run, "feel around");
  action(run, "pull lever");
  action(run, "look around");
  action(run, "look around");

  const nav = derive(run).navigation.entries;
  assert.ok(nav.some((entry) => entry.id === NAV_PARTIAL_DOOR));
});

test("tactile path discovers partial door without lever", () => {
  const run = createRun({ seed: 12 });
  bootstrapNavUnlocked(run);

  enter(run, ROOM_DARKNESS);
  action(run, "feel around");
  action(run, "feel around");
  action(run, "feel around");
  action(run, "feel around");

  assert.equal(run.state.rooms.darkness.partialDoorDiscovered, true);
});

test("tablet pickup updates player name", () => {
  const run = createRun({ seed: 13 });
  bootstrapNavUnlocked(run);

  enter(run, ROOM_DARKNESS);
  action(run, "feel around");
  action(run, "feel around");
  action(run, "feel around");
  action(run, "feel around");
  action(run, "feel around");
  action(run, "pick up tablet");

  assert.equal(run.state.rooms.darkness.tabletTaken, true);
  assert.equal(run.state.playerName, "???");
});

test("terminal inspection unlocks AI and pod room reveal", () => {
  const run = createRun({ seed: 21 });
  bootstrapNavUnlocked(run);

  action(run, "take band");
  assert.ok(run.state.inventory.items.includes("band"));

  enter(run, ROOM_DARKNESS);
  action(run, "feel around");
  action(run, "feel around");
  action(run, "pull lever");
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");

  action(run, "inspect terminals");
  action(run, "inspect terminals");
  assert.equal(run.state.ai.unlocked, true);

  enter(run, ROOM_DARK_ROOM);
  action(run, "look around");
  assert.equal(run.state.rooms.dark_room.displayName, "POD ROOM");
});
