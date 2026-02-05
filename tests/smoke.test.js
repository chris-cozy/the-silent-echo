import assert from "node:assert/strict";
import test from "node:test";
import { ROOM_DARKNESS, ROOM_DARK_ROOM } from "../src/game/engine.js";
import { action, createRun, derive, enter, tick, wake } from "./helpers/engineHarness.js";

test("headless smoke run stays within valid state bounds", () => {
  const run = createRun({ seed: 9001 });
  wake(run);

  for (let i = 0; i < 200; i += 1) {
    if (run.state.stage === "DEATH_PENDING" || run.state.stage === "DEMO_END") {
      break;
    }

    if (run.state.navUnlocked && run.state.currentRoomId === ROOM_DARK_ROOM) {
      enter(run, ROOM_DARKNESS);
    }

    const ui = derive(run);
    const available = ui.actions.filter((item) => !item.disabled);
    if (available.length > 0) {
      action(run, available[0].command);
    }

    tick(run, 250);
  }

  assert.ok(run.state.health >= 0 && run.state.health <= run.state.maxHealth);
  assert.ok(run.state.heat >= 0);
  assert.ok([ROOM_DARK_ROOM, ROOM_DARKNESS].includes(run.state.currentRoomId));

  const nav = derive(run).navigation;
  if (nav.visible) {
    assert.ok(nav.entries.length >= 2);
  }
});
