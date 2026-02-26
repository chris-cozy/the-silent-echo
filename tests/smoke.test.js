import assert from "node:assert/strict";
import test from "node:test";
import { ROOM_CENTRAL_HUB, ROOM_CONTROL_ROOM, ROOM_POWER_STATION, ROOM_RESEARCH_LAB } from "../src/game/engine.js";
import { action, createRun, derive, enter, wake } from "./helpers/engineHarness.js";

test("headless smoke run reaches allocation UI and adjusts power without crashing", () => {
  const run = createRun({ seed: 9001 });
  wake(run);

  run.state.heat = 40;
  run.state.health = 45;
  run.state.rooms.pod_room.lookUnlocked = true;
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");

  enter(run, ROOM_CONTROL_ROOM);
  action(run, "feel around");
  action(run, "feel around");
  action(run, "pull lever");
  action(run, "look around");
  action(run, "look around");

  enter(run, ROOM_CENTRAL_HUB);
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");
  enter(run, ROOM_RESEARCH_LAB);
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");
  enter(run, ROOM_POWER_STATION);
  action(run, "look around");
  action(run, "look around");
  action(run, "inspect control panel");
  action(run, "allocation decrease:pod_room");

  const ui = derive(run);
  assert.equal(run.state.power.availableEmergency, 1);
  assert.equal(ui.navigation.visible, true);
  assert.equal(ui.mapPanel.visible, false);
  assert.ok(run.state.health >= 0 && run.state.health <= run.state.maxHealth);
  assert.ok(run.state.heat >= 0);
});
