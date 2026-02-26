import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTROL_ROOM_POWER_MIN,
  ROOM_CENTRAL_HUB,
  ROOM_CONTROL_ROOM,
  ROOM_MAINTENANCE_BAY,
  ROOM_POWER_STATION,
  ROOM_RESEARCH_LAB
} from "../src/game/engine.js";
import { action, createRun, derive, enter, wake } from "./helpers/engineHarness.js";

function unlockPodNavigation(run) {
  wake(run);
  run.state.heat = 40;
  run.state.health = 35;
  run.state.rooms.pod_room.lookUnlocked = true;
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");
}

function discoverControlDoor(run) {
  unlockPodNavigation(run);
  enter(run, ROOM_CONTROL_ROOM);
  action(run, "feel around");
  action(run, "feel around");
  action(run, "pull lever");
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");
  action(run, "inspect terminals");
  action(run, "inspect terminals");
}

function reachPowerAllocation(run) {
  discoverControlDoor(run);
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
}

function raiseControlRoomToThree(run) {
  action(run, "allocation decrease:pod_room");
  action(run, "allocation decrease:life_support");
  action(run, "allocation increase:control_room");
  action(run, "allocation increase:control_room");
  assert.equal(run.state.power.emergencyAllocation.control_room >= CONTROL_ROOM_POWER_MIN, true);
}

test("canonical flow reaches toolkit and demo end", () => {
  const run = createRun({ seed: 301 });
  reachPowerAllocation(run);
  raiseControlRoomToThree(run);

  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_MAINTENANCE_BAY);
  action(run, "look around");
  action(run, "inspect movement");

  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_CONTROL_ROOM);

  action(run, "query");
  action(run, "query");
  action(run, "query");
  action(run, "query");

  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_MAINTENANCE_BAY);
  action(run, "look around");
  action(run, "feel around");
  action(run, "take emergency toolkit");

  assert.equal(run.state.inventory.items.includes("emergency_toolkit"), true);
  assert.equal(run.state.stage, "DEMO_END");
  assert.equal(run.state.demoComplete, true);
});

test("dropping control room below threshold regresses then restores AI access", () => {
  const run = createRun({ seed: 302 });
  reachPowerAllocation(run);
  raiseControlRoomToThree(run);

  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_CONTROL_ROOM);
  let ui = derive(run);
  assert.equal(ui.aiPanel.visible, true);

  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_POWER_STATION);
  action(run, "allocation decrease:control_room");

  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_CONTROL_ROOM);
  ui = derive(run);
  assert.equal(ui.aiPanel.visible, false);
  assert.ok(ui.actions.some((a) => a.command === "feel around"));

  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_POWER_STATION);
  action(run, "allocation decrease:med_bay");
  action(run, "allocation increase:control_room");

  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_CONTROL_ROOM);
  ui = derive(run);
  assert.equal(ui.aiPanel.visible, true);
});

test("branch B requires droid inspection before toolkit unlock", () => {
  const run = createRun({ seed: 303 });
  reachPowerAllocation(run);
  raiseControlRoomToThree(run);

  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_CONTROL_ROOM);

  action(run, "query");
  action(run, "query");
  action(run, "query");

  let outcome = action(run, "query");
  assert.equal(outcome.logs.length, 0);
  assert.equal(run.state.ai.currentMessage, "Check the maintenance bay for the droid...");

  outcome = action(run, "query");
  assert.equal(outcome.logs.length, 0);
  assert.equal(run.state.ai.currentMessage, "SYSTEM: You stare at the terminal screen, but no more messages appear.");

  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_MAINTENANCE_BAY);
  action(run, "look around");
  action(run, "inspect movement");

  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_CONTROL_ROOM);

  outcome = action(run, "query");
  assert.ok(outcome.logs.some((log) => log.key === "ai_unlock_toolkit"));
  assert.equal(run.state.rooms.maintenance_bay.toolkitUnlocked, true);
});
