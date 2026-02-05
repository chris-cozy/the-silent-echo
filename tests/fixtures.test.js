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
  NAV_PARTIAL_DOOR
} from "../src/game/engine.js";

const here = dirname(fileURLToPath(import.meta.url));

function loadFixture(name) {
  const raw = readFileSync(join(here, "fixtures", `${name}.json`), "utf8");
  return JSON.parse(raw);
}

test("intro_before_band blocks taking the band early", () => {
  const state = loadFixture("intro_before_band");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);

  applyAction(state, runtime, "take band");
  assert.equal(state.rooms.dark_room.bandTaken, false);
});

test("intro_after_band advances to NAV_UNLOCKED on look step 3", () => {
  const state = loadFixture("intro_after_band");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);

  applyAction(state, runtime, "look around");
  assert.equal(state.rooms.dark_room.revealStep, 3);
  assert.equal(state.navUnlocked, true);
  assert.equal(state.stage, "NAV_UNLOCKED");
});

test("after_band_with_storage tracks band in inventory", () => {
  const state = loadFixture("after_band_with_storage");
  assert.ok(state.inventory.items.includes("band"));
});

test("darkness_before_lever unlocks lever on feel step 2", () => {
  const state = loadFixture("darkness_before_lever");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);

  applyAction(state, runtime, "feel around");
  assert.equal(state.rooms.darkness.pullLeverUnlocked, true);
});

test("terminal_room_terminals_discovered allows inspecting terminals", () => {
  const state = loadFixture("terminal_room_terminals_discovered");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);

  const outcome = applyAction(state, runtime, "inspect terminals");
  assert.ok(outcome.logs.some((log) => log.key === "inspect_terminals_1"));
});

test("ai_unlocked fixture keeps AI panel unlocked", () => {
  const state = loadFixture("ai_unlocked");
  assert.equal(state.ai.unlocked, true);
  assert.equal(state.ai.offlineAnnounced, true);
});

test("darkness_after_lever discovers partial door on look step 2", () => {
  const state = loadFixture("darkness_after_lever_before_tablet");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);

  applyAction(state, runtime, "look around");
  assert.equal(state.rooms.darkness.partialDoorDiscovered, true);
});

test("lever_pulled_before_return_to_start reveals pod room", () => {
  const state = loadFixture("lever_pulled_before_return_to_start");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);

  const outcome = applyAction(state, runtime, "look around");
  assert.ok(outcome.logs.some((log) => log.key === "pod_room_reveal"));
  assert.equal(state.rooms.dark_room.displayName, "POD ROOM");
});

test("pod_room_revealed fixture repeats look around", () => {
  const state = loadFixture("pod_room_revealed");
  const rng = createSeededRng(state.runSeed);
  const runtime = createInitialRuntime(rng);

  const outcome = applyAction(state, runtime, "look around");
  assert.ok(outcome.logs.some((log) => log.key === "look_repeat"));
});

test("partial_door_discovered fixture can enter demo end", () => {
  const state = loadFixture("partial_door_discovered");
  applyEnterLocation(state, NAV_PARTIAL_DOOR);
  assert.equal(state.demoComplete, true);
  assert.equal(state.stage, "DEMO_END");
});
