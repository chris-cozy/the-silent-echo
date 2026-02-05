import assert from "node:assert/strict";
import test from "node:test";
import {
  LOOK_UNLOCK_HEALTH,
  LOOK_UNLOCK_HEAT,
  ROOM_DARKNESS,
  ROOM_DARK_ROOM
} from "../src/game/engine.js";
import { action, createRun, derive, tick, wake } from "./helpers/engineHarness.js";

test("stoke respects cooldown and increments after time passes", () => {
  const run = createRun({ seed: 42 });
  wake(run);

  action(run, "stoke");
  assert.equal(run.state.stokeCount, 1);
  const heatAfterFirst = run.state.heat;

  action(run, "stoke");
  assert.equal(run.state.stokeCount, 1);
  assert.equal(run.state.heat, heatAfterFirst);

  tick(run, 2000);
  action(run, "stoke");
  assert.equal(run.state.stokeCount, 2);
});

test("look unlocks when heat and health thresholds are satisfied", () => {
  const run = createRun({ seed: 77 });
  wake(run);

  run.state.heat = LOOK_UNLOCK_HEAT + 1;
  run.state.health = LOOK_UNLOCK_HEALTH + 1;

  const outcome = tick(run, 0);
  assert.equal(run.state.rooms.dark_room.lookUnlocked, true);
  assert.equal(run.state.stage, "LOOK_UNLOCKED");
  assert.ok(outcome.logs.some((log) => log.key === "look_unlocked"));
});

test("feel around unlocks lever on step 2", () => {
  const run = createRun();
  wake(run);

  run.state.navUnlocked = true;
  run.state.currentRoomId = ROOM_DARKNESS;

  action(run, "feel around");
  assert.equal(run.state.rooms.darkness.feelStep, 1);
  assert.equal(run.state.rooms.darkness.pullLeverUnlocked, false);

  action(run, "feel around");
  assert.equal(run.state.rooms.darkness.feelStep, 2);
  assert.equal(run.state.rooms.darkness.pullLeverUnlocked, true);
});

test("heat at zero drains health and emits freeze warnings", () => {
  const run = createRun();
  wake(run);

  run.state.heat = 0;
  run.state.health = 5;

  const outcome = tick(run, 5000);
  assert.equal(run.state.health, 3);
  assert.ok(outcome.logs.some((log) => log.key === "freeze_warning"));
});

test("derived UI reflects room actions", () => {
  const run = createRun();
  wake(run);

  run.state.currentRoomId = ROOM_DARK_ROOM;
  run.state.rooms.dark_room.lookUnlocked = true;
  run.state.rooms.dark_room.revealStep = 2;
  run.state.heat = 10;

  const ui = derive(run);
  const commands = ui.actions.map((actionState) => actionState.command);
  assert.ok(commands.includes("look around"));
  assert.ok(commands.includes("take band"));
});
