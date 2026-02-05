import { UI } from "./ui.js";
import { createRunSeed, createSeededRng, LogVariantService } from "./logVariants.js";
const BOOT_LINES = [
    "SYNCING ECHO MEMORY...",
    "CHECKING LIFE-SUPPORT BUS...",
    "RESTORING LOG CHANNEL...",
    "MANUAL CONTROL REQUIRED"
];
const INITIAL_ECHO_ID = 3;
const START_TIME_MINUTES = 3 * 60;
const TIME_ADVANCE_MINUTES_PER_SECOND = 5;
const ROOM_DARK_ROOM = "dark_room";
const ROOM_DARKNESS = "darkness";
const NAV_PARTIAL_DOOR = "partial_door";
const DARK_ROOM_LABEL = "A DARK ROOM";
const DARKNESS_LABEL = "DARKNESS";
const DARKNESS_DOORWAY_LABEL = "DARKNESS THROUGH THE DOORWAY";
const PARTIAL_DOOR_LABEL = "PARTIALLY CLOSED DOORWAY INTO DARKNESS";
const STOKE_COOLDOWN_MS = 2000;
const HEAT_DECAY_PER_SECOND = 1;
const STOKE_HEAT_GAIN = 8;
const STOKE_START_HEAT = 30;
const STOKE_UPGRADE_EVERY = 3;
const STOKE_CAP_LIMIT = 120;
const STOKE_CAP_INCREMENT = 5;
const HEALTH_REGEN_SECONDS = 3;
const HEALTH_DRAIN_SECONDS = 2;
const LOOK_UNLOCK_HEALTH = 12;
const LOOK_UNLOCK_HEAT = 18;
const AMBIENT_MIN_MS = 32000;
const AMBIENT_MAX_MS = 65000;
const AMBIENT_TRIGGER_CHANCE = 0.45;
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
    window.__aseDebug = {
        boostVitals: () => {
            game?.debugBoostVitals();
        },
        unlockLook: () => {
            game?.debugUnlockLook();
        },
        jumpReveal3: () => {
            game?.debugJumpReveal3();
        }
    };
}
class Game {
    constructor(ui) {
        this.ui = ui;
        this.currentEchoId = INITIAL_ECHO_ID;
        this.pendingDeathEchoId = null;
        this.state = this.createInitialState(this.currentEchoId);
        this.rng = createSeededRng(this.state.runSeed);
        this.logVariants = new LogVariantService(this.rng);
        this.loopTimer = null;
        this.lastTickMs = Date.now();
        this.stokeCooldownUntilMs = 0;
        this.freezeAccumulatorMs = 0;
        this.heatDecayAccumulatorMs = 0;
        this.healthRegenAccumulatorMs = 0;
        this.timeAccumulatorMs = 0;
        this.freezeWarningAccumulatorMs = 0;
        this.ambientAccumulatorMs = 0;
        this.nextAmbientAtMs = this.randomBetween(AMBIENT_MIN_MS, AMBIENT_MAX_MS);
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
        this.transitionTo("BOOTING");
        this.ui.setWakeVisible(false);
        await this.ui.playBootSequence(BOOT_LINES);
        this.transitionTo("DARKNESS");
        this.state.started = true;
        this.logNarrativeVariant("wake_silent");
        this.logNarrativeVariant("wake_machine");
        this.startLoop();
        this.render();
    }
    restartRun() {
        this.stopLoop();
        this.resetRuntimeCounters();
        this.state = this.createInitialState(this.currentEchoId);
        this.rng = createSeededRng(this.state.runSeed);
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
        if (this.state.stage === "LIFE_START" ||
            this.state.stage === "BOOTING" ||
            this.state.stage === "DEATH_PENDING" ||
            this.state.stage === "DEMO_END") {
            return;
        }
        switch (action) {
            case "stoke":
                this.stokeReactor();
                break;
            case "look around":
                this.lookAround();
                break;
            case "feel around":
                this.feelAround();
                break;
            case "pull lever":
                this.pullLever();
                break;
            case "take band":
                this.takeBand();
                break;
            case "pick up tablet":
                this.pickUpTablet();
                break;
            default:
                break;
        }
        this.render();
    }
    enterLocation(targetId) {
        if (!this.state.navUnlocked || this.state.stage === "DEMO_END" || this.state.stage === "DEATH_PENDING") {
            return;
        }
        if (targetId === NAV_PARTIAL_DOOR) {
            this.transitionTo("DEMO_END");
            this.state.demoComplete = true;
            this.stopLoop();
            this.ui.setDemoVisible(true);
            return;
        }
        if (targetId !== ROOM_DARK_ROOM && targetId !== ROOM_DARKNESS) {
            return;
        }
        if (this.state.currentRoomId === targetId) {
            return;
        }
        this.state.currentRoomId = targetId;
        if (targetId === ROOM_DARKNESS) {
            if (!this.state.rooms.darkness.entered) {
                this.state.rooms.darkness.entered = true;
                this.logNarrativeVariant("enter_darkness");
            }
            else {
                this.logNarrativeVariant(this.getReturnLogKeyForDarkness());
            }
        }
        if (targetId === ROOM_DARK_ROOM) {
            if (!this.state.rooms.dark_room.entered) {
                this.state.rooms.dark_room.entered = true;
            }
            else {
                this.logNarrativeVariant(this.getReturnLogKeyForDarkRoom());
            }
        }
        this.render();
    }
    debugBoostVitals() {
        this.state.started = true;
        this.state.heat = 35;
        this.state.health = 45;
        this.state.rooms.dark_room.lookUnlocked = true;
        if (this.state.stage === "LIFE_START") {
            this.transitionTo("LOOK_UNLOCKED");
            this.startLoop();
            this.ui.setWakeVisible(false);
        }
        this.render();
    }
    debugUnlockLook() {
        this.state.started = true;
        this.state.heat = 30;
        this.state.health = 30;
        this.state.rooms.dark_room.lookUnlocked = true;
        if (this.state.stage === "LIFE_START") {
            this.transitionTo("LOOK_UNLOCKED");
            this.startLoop();
            this.ui.setWakeVisible(false);
        }
        this.render();
    }
    debugJumpReveal3() {
        this.state.started = true;
        const darkRoom = this.state.rooms.dark_room;
        darkRoom.lookUnlocked = true;
        darkRoom.revealStep = 3;
        darkRoom.bandTaken = true;
        darkRoom.displayName = DARK_ROOM_LABEL;
        this.state.navUnlocked = true;
        this.state.currentRoomId = ROOM_DARK_ROOM;
        this.state.heatCap = 120;
        this.transitionTo("NAV_UNLOCKED");
        this.startLoop();
        this.ui.setWakeVisible(false);
        this.render();
    }
    createInitialState(echoId) {
        return {
            runSeed: createRunSeed(),
            echoId,
            stage: "LIFE_START",
            started: false,
            currentRoomId: ROOM_DARK_ROOM,
            playerName: "_____",
            rooms: {
                dark_room: {
                    id: "dark_room",
                    displayName: "DARKNESS",
                    entered: true,
                    lookUnlocked: false,
                    revealStep: 0,
                    bandTaken: false
                },
                darkness: {
                    id: "darkness",
                    displayName: "DARKNESS",
                    entered: false,
                    feelStep: 0,
                    lookStep: 0,
                    leverPulled: false,
                    pullLeverUnlocked: false,
                    partialDoorDiscovered: false,
                    tabletDiscovered: false,
                    tabletTaken: false
                }
            },
            heat: 0,
            heatCap: 20,
            health: 5,
            maxHealth: 100,
            timeMinutes: START_TIME_MINUTES,
            stokeCount: 0,
            navUnlocked: false,
            demoComplete: false,
            thawLineShown: false,
            growsLineShown: false,
            warmLineShown: false,
            reserveLimitLogged: false
        };
    }
    transitionTo(next) {
        this.state.stage = next;
    }
    stokeReactor() {
        if (this.state.currentRoomId !== ROOM_DARK_ROOM) {
            return;
        }
        const remaining = this.getStokeCooldownRemainingMs();
        if (remaining > 0) {
            return;
        }
        const darkRoom = this.state.rooms.dark_room;
        if (this.state.stokeCount === 0) {
            this.state.heat = STOKE_START_HEAT;
            this.logNarrativeVariant("stoke_first");
        }
        else {
            this.state.heat = Math.min(this.state.heatCap, this.state.heat + STOKE_HEAT_GAIN);
            this.logNarrativeStickyVariant("stoke_repeat");
        }
        this.state.stokeCount += 1;
        if (this.state.stokeCount % STOKE_UPGRADE_EVERY === 0 && this.state.heatCap < STOKE_CAP_LIMIT) {
            this.state.heatCap = Math.min(STOKE_CAP_LIMIT, this.state.heatCap + STOKE_CAP_INCREMENT);
            this.logSystemVariant("reserve_grows");
            if (this.state.heatCap === STOKE_CAP_LIMIT && !this.state.reserveLimitLogged) {
                this.state.reserveLimitLogged = true;
                this.logSystemVariant("reserve_limit");
            }
        }
        if (!this.state.thawLineShown && this.state.heat >= 10) {
            this.state.thawLineShown = true;
            this.logNarrativeVariant("thaw_line");
        }
        if (!this.state.growsLineShown && this.state.heat >= 18) {
            this.state.growsLineShown = true;
            this.logNarrativeVariant("heat_grows_line");
        }
        if (!this.state.warmLineShown && this.state.heat >= 26) {
            this.state.warmLineShown = true;
            this.logNarrativeVariant("body_warms_line");
        }
        if (!darkRoom.lookUnlocked && this.state.heat >= LOOK_UNLOCK_HEAT && this.state.health > LOOK_UNLOCK_HEALTH) {
            darkRoom.lookUnlocked = true;
            this.transitionTo("LOOK_UNLOCKED");
            this.logNarrativeVariant("look_unlocked");
        }
        this.stokeCooldownUntilMs = Date.now() + STOKE_COOLDOWN_MS;
    }
    lookAround() {
        if (this.state.currentRoomId === ROOM_DARK_ROOM) {
            this.lookAroundDarkRoom();
        }
        else {
            this.lookAroundDarkness();
        }
    }
    takeBand() {
        const darkRoom = this.state.rooms.dark_room;
        if (darkRoom.revealStep < 2 || darkRoom.bandTaken) {
            return;
        }
        darkRoom.bandTaken = true;
        this.transitionTo("BAND_TAKEN");
        this.logNarrativeVariant("band_taken");
    }
    lookAroundDarkRoom() {
        const darkRoom = this.state.rooms.dark_room;
        if (!darkRoom.lookUnlocked || this.state.heat === 0) {
            this.logSystemVariant("darkness_hides");
            return;
        }
        if (darkRoom.revealStep === 0) {
            darkRoom.revealStep = 1;
            darkRoom.displayName = "A DARK SPACE";
            this.transitionTo("REVEAL_1");
            this.logNarrativeVariant("look_step_1");
            return;
        }
        if (darkRoom.revealStep === 1) {
            darkRoom.revealStep = 2;
            this.transitionTo("BAND_AVAILABLE");
            this.logNarrativeVariant("look_step_2");
            return;
        }
        if (darkRoom.revealStep === 2) {
            darkRoom.revealStep = 3;
            darkRoom.displayName = DARK_ROOM_LABEL;
            this.state.navUnlocked = true;
            this.transitionTo("NAV_UNLOCKED");
            this.logNarrativeVariant("look_step_3");
            return;
        }
        this.logNarrativeVariant("look_repeat");
    }
    feelAround() {
        if (this.state.currentRoomId !== ROOM_DARKNESS) {
            return;
        }
        const darknessRoom = this.state.rooms.darkness;
        if (darknessRoom.leverPulled) {
            this.logNarrativeVariant("feel_repeat");
            return;
        }
        if (darknessRoom.feelStep === 0) {
            darknessRoom.feelStep = 1;
            this.logNarrativeVariant("feel_step_1");
            return;
        }
        if (darknessRoom.feelStep === 1) {
            darknessRoom.feelStep = 2;
            darknessRoom.pullLeverUnlocked = true;
            this.logNarrativeVariant("feel_step_2");
            return;
        }
        if (darknessRoom.feelStep === 2) {
            darknessRoom.feelStep = 3;
            this.logNarrativeVariant("feel_step_3");
            return;
        }
        if (darknessRoom.feelStep === 3) {
            darknessRoom.feelStep = 4;
            darknessRoom.partialDoorDiscovered = true;
            this.logNarrativeVariant("feel_step_4");
            return;
        }
        if (darknessRoom.feelStep === 4) {
            darknessRoom.feelStep = 5;
            darknessRoom.tabletDiscovered = true;
            this.logNarrativeVariant("feel_step_5");
            return;
        }
        this.logNarrativeVariant("feel_repeat");
    }
    pullLever() {
        if (this.state.currentRoomId !== ROOM_DARKNESS) {
            return;
        }
        const darknessRoom = this.state.rooms.darkness;
        if (!darknessRoom.pullLeverUnlocked || darknessRoom.leverPulled) {
            return;
        }
        darknessRoom.leverPulled = true;
        this.logNarrativeVariant("pull_lever");
    }
    lookAroundDarkness() {
        if (this.state.currentRoomId !== ROOM_DARKNESS) {
            return;
        }
        const darknessRoom = this.state.rooms.darkness;
        if (!darknessRoom.leverPulled) {
            this.logNarrativeVariant("feel_repeat");
            return;
        }
        if (darknessRoom.lookStep === 0) {
            darknessRoom.lookStep = 1;
            darknessRoom.displayName = "A DIMLY LIT ROOM";
            this.logNarrativeVariant("darkness_look_1");
            return;
        }
        if (darknessRoom.lookStep === 1) {
            darknessRoom.lookStep = 2;
            darknessRoom.partialDoorDiscovered = true;
            this.logNarrativeVariant("darkness_look_2");
            return;
        }
        if (darknessRoom.lookStep === 2) {
            darknessRoom.lookStep = 3;
            darknessRoom.displayName = "TERMINAL ROOM";
            this.logNarrativeVariant("darkness_look_3");
            return;
        }
        if (darknessRoom.lookStep === 3) {
            darknessRoom.lookStep = 4;
            darknessRoom.tabletDiscovered = true;
            this.logNarrativeVariant("darkness_look_4");
            return;
        }
        this.logNarrativeVariant("darkness_look_repeat");
    }
    pickUpTablet() {
        if (this.state.currentRoomId !== ROOM_DARKNESS) {
            return;
        }
        const darknessRoom = this.state.rooms.darkness;
        if (!darknessRoom.tabletDiscovered || darknessRoom.tabletTaken) {
            return;
        }
        darknessRoom.tabletTaken = true;
        this.state.playerName = "???";
        this.logNarrativeVariant("tablet_pickup");
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
    resetRuntimeCounters() {
        this.stokeCooldownUntilMs = 0;
        this.freezeAccumulatorMs = 0;
        this.heatDecayAccumulatorMs = 0;
        this.healthRegenAccumulatorMs = 0;
        this.timeAccumulatorMs = 0;
        this.freezeWarningAccumulatorMs = 0;
        this.ambientAccumulatorMs = 0;
        this.nextAmbientAtMs = this.randomBetween(AMBIENT_MIN_MS, AMBIENT_MAX_MS);
    }
    tick() {
        const now = Date.now();
        const delta = now - this.lastTickMs;
        this.lastTickMs = now;
        if (!this.state.started || this.state.stage === "DEMO_END" || this.state.stage === "DEATH_PENDING") {
            return;
        }
        this.applyTimeProgress(delta);
        this.applyHeatAndHealth(delta);
        this.applyAmbientLogs(delta);
        if (this.state.health <= 0) {
            this.logSystemVariant("death_flatline");
            this.logNarrativeVariant("death_freeze");
            this.transitionTo("DEATH_PENDING");
            const nextEchoId = this.state.echoId + 1;
            this.pendingDeathEchoId = nextEchoId;
            this.ui.setDeathMessage(`You died. ${this.formatEchoId(this.state.echoId)} terminated.\nAcknowledge to initialize ${this.formatEchoId(nextEchoId)}.`);
            this.ui.setDeathVisible(true);
            this.stopLoop();
            this.render();
            return;
        }
        this.render();
    }
    applyTimeProgress(deltaMs) {
        this.timeAccumulatorMs += deltaMs;
        while (this.timeAccumulatorMs >= 1000) {
            this.timeAccumulatorMs -= 1000;
            this.state.timeMinutes += TIME_ADVANCE_MINUTES_PER_SECOND;
            if (this.state.timeMinutes >= 24 * 60) {
                this.state.timeMinutes -= 24 * 60;
            }
        }
    }
    applyHeatAndHealth(deltaMs) {
        this.freezeWarningAccumulatorMs += deltaMs;
        this.heatDecayAccumulatorMs += deltaMs;
        while (this.heatDecayAccumulatorMs >= 1000) {
            this.heatDecayAccumulatorMs -= 1000;
            if (this.state.heat > 0) {
                this.state.heat = Math.max(0, this.state.heat - HEAT_DECAY_PER_SECOND);
            }
        }
        if (this.state.heat === 0) {
            this.healthRegenAccumulatorMs = 0;
            this.freezeAccumulatorMs += deltaMs;
            if (this.freezeWarningAccumulatorMs >= 5000) {
                this.freezeWarningAccumulatorMs = 0;
                this.logNarrativeVariant("freeze_warning");
            }
            while (this.freezeAccumulatorMs >= HEALTH_DRAIN_SECONDS * 1000) {
                this.freezeAccumulatorMs -= HEALTH_DRAIN_SECONDS * 1000;
                this.state.health = Math.max(0, this.state.health - 1);
            }
        }
        else {
            this.freezeAccumulatorMs = 0;
            this.freezeWarningAccumulatorMs = 0;
            this.healthRegenAccumulatorMs += deltaMs;
            while (this.healthRegenAccumulatorMs >= HEALTH_REGEN_SECONDS * 1000) {
                this.healthRegenAccumulatorMs -= HEALTH_REGEN_SECONDS * 1000;
                this.state.health = Math.min(this.state.maxHealth, this.state.health + 1);
            }
        }
        const darkRoom = this.state.rooms.dark_room;
        if (!darkRoom.lookUnlocked && this.state.heat >= LOOK_UNLOCK_HEAT && this.state.health > LOOK_UNLOCK_HEALTH) {
            darkRoom.lookUnlocked = true;
            this.transitionTo("LOOK_UNLOCKED");
            this.logNarrativeVariant("look_unlocked");
        }
    }
    applyAmbientLogs(deltaMs) {
        this.ambientAccumulatorMs += deltaMs;
        if (this.ambientAccumulatorMs < this.nextAmbientAtMs) {
            return;
        }
        this.ambientAccumulatorMs = 0;
        this.nextAmbientAtMs = this.randomBetween(AMBIENT_MIN_MS, AMBIENT_MAX_MS);
        if (this.rng() <= AMBIENT_TRIGGER_CHANCE) {
            this.logNarrativeVariant("ambient_noise");
        }
    }
    render() {
        this.ui.setEchoId(this.state.echoId);
        this.ui.setPlayerName(this.state.playerName);
        this.ui.setRoomTitle(this.getCurrentRoom().displayName);
        this.ui.setActions(this.getActionButtons());
        this.ui.setVitals(this.state.rooms.dark_room.bandTaken, this.getVitalsState());
        this.ui.setMap(false, "");
        this.ui.setNavigation(this.getNavigationState());
        this.ui.setDeathVisible(this.state.stage === "DEATH_PENDING");
        this.ui.setDemoVisible(this.state.demoComplete);
    }
    getActionButtons() {
        const buttons = [];
        const currentRoom = this.getCurrentRoom();
        if (currentRoom.id === ROOM_DARK_ROOM) {
            const stokeRemaining = this.getStokeCooldownRemainingMs();
            const cooldownActive = stokeRemaining > 0;
            buttons.push({
                command: "stoke",
                label: cooldownActive ? `STOKE EMBERS ${(stokeRemaining / 1000).toFixed(1)}s` : "STOKE EMBERS",
                disabled: cooldownActive,
                cooldownEndsAtMs: cooldownActive ? this.stokeCooldownUntilMs : undefined,
                cooldownDurationMs: STOKE_COOLDOWN_MS
            });
            if (currentRoom.lookUnlocked && this.state.heat !== 0) {
                buttons.push({ command: "look around", label: "LOOK AROUND" });
            }
            if (currentRoom.revealStep >= 2 && !currentRoom.bandTaken) {
                buttons.push({ command: "take band", label: "TAKE THE BAND" });
            }
        }
        if (currentRoom.id === ROOM_DARKNESS) {
            if (currentRoom.leverPulled) {
                buttons.push({ command: "look around", label: "LOOK AROUND" });
            }
            else {
                buttons.push({ command: "feel around", label: "FEEL AROUND" });
                if (currentRoom.pullLeverUnlocked && !currentRoom.leverPulled) {
                    buttons.push({ command: "pull lever", label: "PULL LEVER" });
                }
            }
            if (currentRoom.tabletDiscovered && !currentRoom.tabletTaken) {
                buttons.push({ command: "pick up tablet", label: "PICK UP TABLET" });
            }
        }
        return buttons;
    }
    getNavigationState() {
        if (!this.state.navUnlocked) {
            return { visible: false, entries: [] };
        }
        const entries = [
            {
                id: ROOM_DARK_ROOM,
                label: this.state.rooms.dark_room.displayName,
                isCurrent: this.state.currentRoomId === ROOM_DARK_ROOM,
                canEnter: this.state.currentRoomId !== ROOM_DARK_ROOM
            },
            {
                id: ROOM_DARKNESS,
                label: this.state.rooms.darkness.entered ? this.state.rooms.darkness.displayName : DARKNESS_DOORWAY_LABEL,
                isCurrent: this.state.currentRoomId === ROOM_DARKNESS,
                canEnter: this.state.currentRoomId !== ROOM_DARKNESS
            }
        ];
        if (this.state.rooms.darkness.partialDoorDiscovered) {
            entries.push({
                id: NAV_PARTIAL_DOOR,
                label: PARTIAL_DOOR_LABEL,
                isCurrent: false,
                canEnter: true
            });
        }
        return {
            visible: this.state.navUnlocked,
            entries
        };
    }
    getVitalsState() {
        return {
            health: this.state.health,
            healthMax: this.state.maxHealth,
            heat: this.state.heat,
            heatMax: this.state.heatCap,
            time: this.formatTime(this.state.timeMinutes)
        };
    }
    formatMap() {
        const darkRoom = this.state.rooms.dark_room;
        if (darkRoom.revealStep === 0) {
            return "";
        }
        if (darkRoom.revealStep < 3) {
            return [
                "+----------------------+",
                "|        (you)         |",
                "|     A DARK SPACE     |",
                "+----------------------+"
            ].join("\n");
        }
        return [
            "+-----------------------------------+",
            "| [A DARK ROOM] ---- [DOORWAY]      |",
            "|      YOU               ENTER      |",
            "+-----------------------------------+"
        ].join("\n");
    }
    formatTime(totalMinutes) {
        const hours24 = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        const isPm = hours24 >= 12;
        const displayHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
        return `${displayHour}:${minutes.toString().padStart(2, "0")} ${isPm ? "PM" : "AM"}`;
    }
    getCurrentRoom() {
        return this.state.currentRoomId === ROOM_DARK_ROOM ? this.state.rooms.dark_room : this.state.rooms.darkness;
    }
    getReturnLogKeyForDarkness() {
        const label = this.state.rooms.darkness.displayName;
        if (label === "A DIMLY LIT ROOM") {
            return "return_dimly_lit";
        }
        if (label === "TERMINAL ROOM") {
            return "return_terminal_room";
        }
        return "return_darkness";
    }
    getReturnLogKeyForDarkRoom() {
        const label = this.state.rooms.dark_room.displayName;
        if (label === "A DARK SPACE") {
            return "return_dark_space";
        }
        if (label === DARK_ROOM_LABEL) {
            return "return_dark_room";
        }
        return "return_darkness_room";
    }
    getStokeCooldownRemainingMs() {
        return Math.max(0, this.stokeCooldownUntilMs - Date.now());
    }
    randomBetween(min, max) {
        return Math.floor(this.rng() * (max - min + 1)) + min;
    }
    formatEchoId(echoId) {
        return `Echo-${echoId.toString().padStart(2, "0")}`;
    }
    logSystemVariant(key) {
        this.ui.logSystem(this.logVariants.pick(key));
    }
    logNarrativeVariant(key) {
        this.ui.logNarrative(this.logVariants.pick(key));
    }
    logNarrativeStickyVariant(key) {
        this.ui.logNarrative(this.logVariants.pickSticky(key));
    }
}
