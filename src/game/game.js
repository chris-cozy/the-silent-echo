import { UI } from "./ui.js";
import { createSeededRng, LogVariantService } from "./logVariants.js";
import { advanceTime, applyAction, applyEnterLocation, beginBoot, completeBoot, createInitialRuntime, createInitialState, deriveUiState, ROOM_CONTROL_ROOM, ROOM_POD_ROOM, syncNow } from "./engine.js";
const BOOT_LINES = [
    "SYNCING ECHO MEMORY...",
    "CHECKING LIFE-SUPPORT BUS...",
    "RESTORING LOG CHANNEL...",
    "MANUAL CONTROL REQUIRED"
];
const INITIAL_ECHO_ID = 3;
const TICK_MS = 250;
export async function startGame() {
    let game = null;
    const ui = new UI(() => {
        if (game) {
            void game.wakeUp();
        }
    }, (action) => {
        if (game) {
            game.handleAction(action);
        }
    }, (targetId) => {
        if (game) {
            game.enterLocation(targetId);
        }
    }, () => {
        if (game) {
            game.acknowledgeDeath();
        }
    }, () => {
        if (game) {
            game.restartRun();
        }
    });
    game = new Game(ui);
    game.init();
    const tickToggle = document.getElementById("tick-toggle");
    if (import.meta.env.DEV && tickToggle) {
        tickToggle.classList.remove("is-hidden");
        tickToggle.textContent = "PAUSE TICK";
        tickToggle.addEventListener("click", () => {
            if (!game) {
                return;
            }
            const running = game.toggleTickLoop();
            tickToggle.textContent = running ? "PAUSE TICK" : "RESUME TICK";
        });
    }
    if (import.meta.env.DEV) {
        const debugApi = {
            setRoom: (roomId) => {
                game?.debugSetRoom(roomId);
            },
            setHeat: (value) => {
                game?.debugSetHeat(value);
            },
            setHealth: (value) => {
                game?.debugSetHealth(value);
            },
            setTimeMinutes: (value) => {
                game?.debugSetTimeMinutes(value);
            },
            fastForward: (ms) => {
                game?.debugAdvanceTime(ms);
            },
            pauseLoop: () => {
                game?.debugPauseLoop();
            },
            resumeLoop: () => {
                game?.debugResumeLoop();
            }
        };
        window.__aseDebug = debugApi;
    }
}
class Game {
    constructor(ui) {
        this.ui = ui;
        this.currentEchoId = INITIAL_ECHO_ID;
        this.pendingDeathEchoId = null;
        this.state = createInitialState(this.currentEchoId);
        this.rng = createSeededRng(this.state.runSeed);
        this.runtime = createInitialRuntime(this.rng, Date.now());
        this.logVariants = new LogVariantService(this.rng);
        this.loopTimer = null;
        this.lastTickMs = Date.now();
    }
    init() {
        this.ui.clearLogs();
        this.ui.setWakeVisible(true);
        this.ui.setDemoVisible(false);
        this.ui.setDeathVisible(false);
        this.render();
        this.stopLoop();
    }
    async wakeUp() {
        if (this.state.stage !== "LIFE_START") {
            return;
        }
        beginBoot(this.state);
        this.ui.setWakeVisible(false);
        await this.ui.playBootSequence(BOOT_LINES);
        const outcome = completeBoot(this.state);
        this.applyLogs(outcome.logs);
        this.startLoop();
        this.render();
    }
    restartRun() {
        this.stopLoop();
        this.state = createInitialState(this.currentEchoId);
        this.rng = createSeededRng(this.state.runSeed);
        this.runtime = createInitialRuntime(this.rng, Date.now());
        this.logVariants = new LogVariantService(this.rng);
        this.pendingDeathEchoId = null;
        this.ui.clearLogs();
        this.ui.setDemoVisible(false);
        this.ui.setDeathVisible(false);
        this.ui.setWakeVisible(true);
        this.render();
    }
    acknowledgeDeath() {
        if (this.pendingDeathEchoId === null || this.state.stage !== "DEATH_PENDING") {
            return;
        }
        this.currentEchoId = this.pendingDeathEchoId;
        this.pendingDeathEchoId = null;
        this.restartRun();
    }
    handleAction(action) {
        syncNow(this.runtime, Date.now());
        const outcome = applyAction(this.state, this.runtime, action);
        this.applyLogs(outcome.logs);
        if (this.state.stage === "DEMO_END") {
            this.stopLoop();
            this.ui.setDemoVisible(true);
        }
        this.render();
    }
    enterLocation(targetId) {
        const previousStage = this.state.stage;
        const outcome = applyEnterLocation(this.state, targetId);
        this.applyLogs(outcome.logs);
        if (previousStage !== "DEMO_END" && this.state.stage === "DEMO_END") {
            this.stopLoop();
            this.ui.setDemoVisible(true);
        }
        this.render();
    }
    debugSetRoom(roomId) {
        this.state.currentRoomId = roomId;
        if (roomId === ROOM_CONTROL_ROOM) {
            this.state.rooms.control_room.entered = true;
        }
        if (roomId === ROOM_POD_ROOM) {
            this.state.rooms.pod_room.entered = true;
        }
        this.render();
    }
    debugSetHeat(value) {
        this.state.heat = Math.max(0, value);
        this.render();
    }
    debugSetHealth(value) {
        this.state.health = Math.max(0, Math.min(this.state.maxHealth, value));
        this.render();
    }
    debugSetTimeMinutes(value) {
        const total = 24 * 60;
        const wrapped = ((Math.floor(value) % total) + total) % total;
        this.state.timeMinutes = wrapped;
        this.render();
    }
    debugAdvanceTime(ms) {
        const outcome = advanceTime(this.state, this.runtime, Math.max(0, ms), this.rng);
        this.applyLogs(outcome.logs);
        if (this.state.stage === "DEATH_PENDING") {
            this.handleDeathTransition();
            return;
        }
        this.render();
    }
    debugPauseLoop() {
        this.stopLoop();
    }
    debugResumeLoop() {
        if (this.state.stage === "DEMO_END" || this.state.stage === "DEATH_PENDING") {
            return;
        }
        this.startLoop();
    }
    toggleTickLoop() {
        if (this.loopTimer === null) {
            if (this.state.stage === "DEMO_END" || this.state.stage === "DEATH_PENDING" || !this.state.started) {
                return false;
            }
            this.startLoop();
            return true;
        }
        this.stopLoop();
        return false;
    }
    startLoop() {
        if (this.loopTimer !== null) {
            return;
        }
        this.lastTickMs = Date.now();
        this.loopTimer = window.setInterval(() => this.tick(), TICK_MS);
    }
    stopLoop() {
        if (this.loopTimer === null) {
            return;
        }
        window.clearInterval(this.loopTimer);
        this.loopTimer = null;
    }
    tick() {
        const now = Date.now();
        const delta = now - this.lastTickMs;
        this.lastTickMs = now;
        const previousStage = this.state.stage;
        const outcome = advanceTime(this.state, this.runtime, delta, this.rng);
        this.applyLogs(outcome.logs);
        if (previousStage !== "DEATH_PENDING" && this.state.stage === "DEATH_PENDING") {
            this.handleDeathTransition();
            return;
        }
        this.render();
    }
    handleDeathTransition() {
        const nextEchoId = this.state.echoId + 1;
        this.pendingDeathEchoId = nextEchoId;
        this.ui.setDeathMessage(`You died. ${this.formatEchoId(this.state.echoId)} terminated.\nAcknowledge to initialize ${this.formatEchoId(nextEchoId)}.`);
        this.ui.setDeathVisible(true);
        this.stopLoop();
        this.render();
    }
    render() {
        syncNow(this.runtime, Date.now());
        const uiState = deriveUiState(this.state, this.runtime);
        this.ui.setEchoId(this.state.echoId);
        this.ui.setPlayerName(this.state.playerName);
        this.ui.setRoomTitle(uiState.roomTitle);
        this.ui.setActions(uiState.actions);
        this.ui.setVitals(this.state.rooms.pod_room.bandTaken, uiState.vitals);
        this.ui.setStorage(uiState.storage);
        this.ui.setAiPanel(uiState.aiPanel);
        this.ui.setPowerPanel(uiState.powerPanel);
        this.ui.setMap(uiState.mapPanel.visible, uiState.mapPanel.text);
        this.ui.setNavigation(uiState.navigation);
        this.ui.setDeathVisible(this.state.stage === "DEATH_PENDING");
        this.ui.setDemoVisible(this.state.demoComplete);
    }
    formatEchoId(echoId) {
        return `Echo-${echoId.toString().padStart(2, "0")}`;
    }
    applyLogs(logs) {
        for (const log of logs) {
            if (log.kind === "system") {
                this.ui.logSystem(this.logVariants.pick(log.key));
            }
            else if (log.sticky) {
                this.ui.logNarrative(this.logVariants.pickSticky(log.key));
            }
            else {
                this.ui.logNarrative(this.logVariants.pick(log.key));
            }
        }
    }
}
