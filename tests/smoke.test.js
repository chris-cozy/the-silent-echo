import assert from "node:assert/strict";
import test from "node:test";
import { ROOM_DARKNESS, ROOM_DARK_ROOM } from "../src/game/engine.js";
import { action, createRun, derive, enter, tick, wake } from "./helpers/engineHarness.js";

test("headless smoke run stays within valid state bounds", () => {
  const run = createRun({ seed: 9001 });
  wake(run);

  run.state.heat = 40;
  run.state.health = 40;
  tick(run, 0);

  action(run, "look around");
  action(run, "look around");
  action(run, "take band");
  action(run, "look around");

  enter(run, ROOM_DARKNESS);
  tick(run, 250);

  assert.ok(run.state.health >= 0 && run.state.health <= run.state.maxHealth);
  assert.ok(run.state.heat >= 0);
  assert.ok([ROOM_DARK_ROOM, ROOM_DARKNESS].includes(run.state.currentRoomId));
  assert.ok(run.state.inventory.items.includes("band"));

  const nav = derive(run).navigation;
  if (nav.visible) {
    assert.ok(nav.entries.length >= 2);
  }
});
