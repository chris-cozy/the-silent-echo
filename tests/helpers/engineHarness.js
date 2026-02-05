import { createSeededRng } from "../../src/game/logVariants.js";
import {
  advanceTime,
  applyAction,
  applyEnterLocation,
  beginBoot,
  completeBoot,
  createInitialRuntime,
  createInitialState,
  deriveUiState,
  syncNow
} from "../../src/game/engine.js";

export function createRun({ seed = 123, echoId = 3 } = {}) {
  const state = createInitialState(echoId, seed);
  const rng = createSeededRng(seed);
  const runtime = createInitialRuntime(rng);
  return { state, runtime, rng };
}

export function wake(run) {
  beginBoot(run.state);
  return completeBoot(run.state);
}

export function action(run, command) {
  return applyAction(run.state, run.runtime, command);
}

export function enter(run, targetId) {
  return applyEnterLocation(run.state, targetId);
}

export function tick(run, deltaMs) {
  return advanceTime(run.state, run.runtime, deltaMs, run.rng);
}

export function now(run, nowMs) {
  return syncNow(run.runtime, nowMs);
}

export function derive(run) {
  return deriveUiState(run.state, run.runtime);
}
