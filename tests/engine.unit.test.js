import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTROL_ROOM_POWER_MIN,
  MAINTENANCE_POWER_MIN,
  ROOM_CENTRAL_HUB,
  ROOM_CONTROL_ROOM,
  ROOM_MAINTENANCE_BAY,
  ROOM_POD_ROOM,
  ROOM_POWER_STATION,
  ROOM_RESEARCH_LAB
} from "../src/game/engine.js";
import { action, createRun, derive, enter, wake } from "./helpers/engineHarness.js";

function unlockPodNavigation(run) {
  wake(run);
  run.state.heat = 40;
  run.state.health = 30;
  run.state.rooms.pod_room.lookUnlocked = true;
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");
  assert.equal(run.state.navUnlocked, true);
}

function discoverControlDoor(run) {
  unlockPodNavigation(run);
  enter(run, ROOM_CONTROL_ROOM);
  action(run, "feel around");
  action(run, "feel around");
  action(run, "pull lever");
  action(run, "look around");
  action(run, "look around");
  assert.equal(run.state.rooms.control_room.partialDoorDiscovered, true);
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
  assert.equal(run.state.rooms.power_station.controlPanelInspected, true);
}

function unlockAiOffline(run) {
  discoverControlDoor(run);
  action(run, "look around");
  action(run, "inspect terminals");
  action(run, "inspect terminals");
  assert.equal(run.state.ai.unlocked, true);
}

function bringControlOnline(run) {
  reachPowerAllocation(run);
  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_CONTROL_ROOM);
  action(run, "look around");
  action(run, "inspect terminals");
  action(run, "inspect terminals");

  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_POWER_STATION);
  action(run, "allocation decrease:pod_room");
  action(run, "allocation decrease:life_support");
  action(run, "allocation increase:control_room");
  action(run, "allocation increase:control_room");

  assert.equal(run.state.power.emergencyAllocation.control_room >= CONTROL_ROOM_POWER_MIN, true);
  assert.equal(run.state.ai.online, true);
}

test("descriptor names are shown first, then true names after discovery", () => {
  const run = createRun({ seed: 101 });
  discoverControlDoor(run);

  enter(run, ROOM_CENTRAL_HUB);
  assert.equal(run.state.rooms.central_hub.displayName, "A DARK SPACE");
  action(run, "look around");
  assert.equal(run.state.rooms.central_hub.displayName, "A DARK SPACE");
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");

  enter(run, ROOM_RESEARCH_LAB);
  assert.equal(run.state.rooms.research_lab.displayName, "A DIMLY LIT SPACE");
  action(run, "look around");
  assert.equal(run.state.rooms.research_lab.displayName, "RESEARCH ROOM");
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");

  enter(run, ROOM_POWER_STATION);
  assert.equal(run.state.rooms.power_station.displayName, "A SERVICE PASSAGE");
  action(run, "look around");
  assert.equal(run.state.rooms.power_station.displayName, "A SERVICE PASSAGE");
  action(run, "look around");
  action(run, "inspect control panel");
  assert.equal(run.state.rooms.power_station.displayName, "POWER ROOM");
});

test("control room navigation respects jammed and discovered doors", () => {
  const run = createRun({ seed: 102 });
  unlockPodNavigation(run);
  enter(run, ROOM_CONTROL_ROOM);

  let nav = derive(run).navigation;
  assert.ok(!nav.entries.some((entry) => entry.id === "life_support"));
  assert.ok(!nav.entries.some((entry) => entry.id === ROOM_CENTRAL_HUB));

  action(run, "feel around");
  action(run, "feel around");
  action(run, "pull lever");
  action(run, "look around");
  action(run, "look around");

  nav = derive(run).navigation;
  assert.ok(nav.entries.some((entry) => entry.id === "life_support" && entry.actionLabel === "JAMMED"));
  assert.ok(nav.entries.some((entry) => entry.id === ROOM_CENTRAL_HUB && entry.actionLabel === "ENTER"));
});

test("default emergency allocations and lock state are initialized", () => {
  const run = createRun({ seed: 103 });
  wake(run);

  assert.deepEqual(run.state.power.emergencyAllocation, {
    pod_room: 1,
    control_room: 1,
    life_support: 1,
    med_bay: 1,
    maintenance_bay: 1,
    restricted_lab: 3
  });
  assert.equal(run.state.power.availableEmergency, 0);
});

test("allocation controls deallocate and reallocate power with lock enforcement", () => {
  const run = createRun({ seed: 104 });
  reachPowerAllocation(run);

  let outcome = action(run, "allocation increase:restricted_lab");
  assert.ok(outcome.logs.some((log) => log.key === "allocation_locked"));
  assert.equal(run.state.power.emergencyAllocation.restricted_lab, 3);

  outcome = action(run, "allocation decrease:pod_room");
  assert.ok(outcome.logs.some((log) => log.key === "allocation_adjusted"));
  assert.equal(run.state.power.availableEmergency, 1);

  action(run, "allocation increase:control_room");
  assert.equal(run.state.power.emergencyAllocation.control_room, 2);
  assert.equal(run.state.power.availableEmergency, 0);
});

test("AI panel shows offline percentage at one-third power", () => {
  const run = createRun({ seed: 105 });
  unlockAiOffline(run);

  const panel = derive(run).aiPanel;
  assert.equal(panel.visible, true);
  assert.equal(panel.status, "OFFLINE");
  assert.match(panel.reason, /\(33%\)/);
});

test("dropping control room below threshold regresses visibility and interaction", () => {
  const run = createRun({ seed: 106 });
  bringControlOnline(run);

  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_CONTROL_ROOM);
  let ui = derive(run);
  assert.equal(ui.aiPanel.visible, true);
  assert.equal(ui.aiPanel.queryAvailable, true);
  assert.ok(!ui.actions.some((a) => a.command === "query"));

  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_POWER_STATION);
  action(run, "allocation decrease:control_room");

  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_CENTRAL_HUB);
  enter(run, ROOM_CONTROL_ROOM);
  ui = derive(run);
  assert.equal(run.state.power.emergencyAllocation.control_room, CONTROL_ROOM_POWER_MIN - 1);
  assert.equal(ui.aiPanel.visible, false);
  assert.ok(ui.actions.some((a) => a.command === "feel around"));
});

test("AI query branch A unlocks toolkit immediately when droid was inspected", () => {
  const run = createRun({ seed: 107 });
  bringControlOnline(run);

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
  const outcome = action(run, "query");

  assert.ok(outcome.logs.some((log) => log.key === "ai_unlock_toolkit"));
  assert.equal(run.state.rooms.maintenance_bay.toolkitUnlocked, true);
});

test("AI query branch B blocks until droid inspection, then resumes", () => {
  const run = createRun({ seed: 108 });
  bringControlOnline(run);

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
});

test("research navigation and actions remain discovery-gated", () => {
  const run = createRun({ seed: 110 });
  discoverControlDoor(run);
  enter(run, ROOM_CENTRAL_HUB);
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");
  action(run, "look around");

  let ui = derive(run);
  assert.ok(ui.navigation.entries.some((entry) => entry.id === ROOM_RESEARCH_LAB && entry.label === "DARK DOORWAY"));

  enter(run, ROOM_RESEARCH_LAB);
  ui = derive(run);
  assert.ok(!ui.actions.some((entry) => entry.command === "inspect restricted door"));

  action(run, "look around");
  ui = derive(run);
  assert.equal(run.state.rooms.research_lab.displayName, "RESEARCH ROOM");
  assert.ok(!ui.navigation.entries.some((entry) => entry.id === ROOM_POWER_STATION));

  action(run, "look around");
  ui = derive(run);
  assert.ok(ui.actions.some((entry) => entry.command === "inspect restricted door"));

  enter(run, ROOM_CENTRAL_HUB);
  ui = derive(run);
  assert.ok(ui.navigation.entries.some((entry) => entry.id === ROOM_RESEARCH_LAB && entry.label === "RESEARCH ROOM"));
});

test("maintenance repair chain needs toolkit and maintenance allocation >= 2", () => {
  const run = createRun({ seed: 109 });
  bringControlOnline(run);

  enter(run, ROOM_RESEARCH_LAB);
  enter(run, ROOM_MAINTENANCE_BAY);
  action(run, "look around");
  action(run, "inspect movement");

  let outcome = action(run, "repair cables");
  assert.equal(run.state.rooms.maintenance_bay.wiresRepaired, false);
  assert.equal(outcome.logs.length, 0);

  run.state.inventory.items.push("emergency_toolkit");
  outcome = action(run, "repair cables");
  assert.equal(run.state.rooms.maintenance_bay.wiresRepaired, true);
  assert.ok(!outcome.logs.some((log) => log.key === "maintenance_droid_boot"));

  run.state.rooms.maintenance_bay.wiresRepaired = false;
  run.state.power.emergencyAllocation.maintenance_bay = MAINTENANCE_POWER_MIN;
  outcome = action(run, "repair cables");
  assert.ok(outcome.logs.some((log) => log.key === "maintenance_droid_boot"));
});
