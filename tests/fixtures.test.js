import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createSeededRng } from "../src/game/logVariants.js";
import {
  applyAction,
  applyEnterLocation,
  createInitialRuntime,
  deriveUiState,
  ROOM_CENTRAL_HUB
} from "../src/game/engine.js";

const here = dirname(fileURLToPath(import.meta.url));

function loadFixture(name) {
  const raw = readFileSync(join(here, "fixtures", `${name}.json`), "utf8");
  return JSON.parse(raw);
}

test("at_hub_entry_before_collapse triggers first-entry collapse event", () => {
  const state = loadFixture("at_hub_entry_before_collapse");
  const outcome = applyEnterLocation(state, ROOM_CENTRAL_HUB);

  assert.equal(state.rooms.central_hub.collapseTriggered, true);
  assert.ok(outcome.logs.some((log) => log.key === "hub_debris_collapse"));
});

test("hub_after_collapse keeps living quarters route collapsed in navigation", () => {
  const state = loadFixture("hub_after_collapse");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);
  applyAction(state, runtime, "look around");
  applyAction(state, runtime, "look around");
  const ui = deriveUiState(state, runtime);

  assert.ok(ui.navigation.entries.some((entry) => entry.id === "living_quarters" && entry.actionLabel === "BLOCKED"));
});

test("power_station_before_panel_inspect unlocks panel inspection", () => {
  const state = loadFixture("power_station_before_panel_inspect");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);

  applyAction(state, runtime, "inspect control panel");
  assert.equal(state.rooms.power_station.controlPanelInspected, true);
});

test("power_station_allocation_ui_unlocked exposes power panel state", () => {
  const state = loadFixture("power_station_allocation_ui_unlocked");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);
  const ui = deriveUiState(state, runtime);
  assert.equal(ui.powerPanel.unlocked, true);
  assert.equal(ui.powerPanel.inPowerRoom, true);
});

test("control_room_active_ai_online fixture keeps AI visible and online", () => {
  const state = loadFixture("control_room_active_ai_online");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);
  const ui = deriveUiState(state, runtime);

  assert.equal(state.ai.online, true);
  assert.equal(ui.aiPanel.visible, true);
});

test("control_room_power_dropped_ai_off fixture regresses control room interactions", () => {
  const state = loadFixture("control_room_power_dropped_ai_off");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);
  const ui = deriveUiState(state, runtime);

  assert.equal(state.power.emergencyAllocation.control_room, 2);
  assert.equal(ui.aiPanel.visible, false);
  assert.ok(ui.actions.some((actionState) => actionState.command === "feel around"));
});

test("maintenance_droid_inspected_no_toolkit blocks cable repair", () => {
  const state = loadFixture("maintenance_droid_inspected_no_toolkit");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);

  const outcome = applyAction(state, runtime, "repair cables");
  assert.equal(state.rooms.maintenance_bay.wiresRepaired, false);
  assert.equal(outcome.logs.length, 0);
});

test("toolkit_added_end_modal fixture remains in demo-end state", () => {
  const state = loadFixture("toolkit_added_end_modal");
  assert.equal(state.stage, "DEMO_END");
  assert.equal(state.demoComplete, true);
  assert.ok(state.inventory.items.includes("emergency_toolkit"));
});
