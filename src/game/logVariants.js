const CATALOG = {
    wake_silent: [
        { text: "The darkness is silent..." },
        { text: "Silence wraps around you in the dark..." },
        { text: "Only darkness and silence answer you..." }
    ],
    wake_machine: [
        { text: "You see a machine in front of you, its embers nearly dead..." },
        { text: "In front of you, a machine glows weakly with fading embers..." },
        { text: "A machine stands ahead, its embers barely alive..." }
    ],
    stoke_first: [
        { text: "You stoke the glowing embers in the reactor before you..." },
        { text: "You stir the fading embers, coaxing light from the reactor..." },
        { text: "You feed the near-dead embers until they answer with a glow..." }
    ],
    stoke_repeat: [
        { text: "You feed the embers and hold your hands over the heat." },
        { text: "You stir the coals and wait as warmth returns." },
        { text: "You push more fuel into the embers and breathe easier." }
    ],
    reserve_grows: [
        { text: "Reactor reserve grows stronger" },
        { text: "Reserve capacity climbs a little higher" },
        { text: "The reserve stabilizes at a higher level" }
    ],
    reserve_limit: [
        { text: "Reactor reserve has reached its limit" },
        { text: "Reserve ceiling reached. No further expansion detected" },
        { text: "The reserve tops out. The system refuses higher capacity" }
    ],
    thaw_line: [
        { text: "Your skin begins to thaw." },
        { text: "Feeling returns to your hands." },
        { text: "The numbness starts to lift." }
    ],
    heat_grows_line: [
        { text: "The heat grows..." },
        { text: "Warmth spreads a little farther." },
        { text: "The reactor glow pushes back the cold." }
    ],
    body_warms_line: [
        { text: "Your body warms from the heat." },
        { text: "The heat settles into your bones." },
        { text: "You feel warmth return through your chest and hands." }
    ],
    look_unlocked: [
        { text: "Your eyes adjust to the faint light from the reactor." },
        { text: "The reactor glow sharpens the edges of the room." },
        { text: "Dim light finally lets your eyes make out shapes." }
    ],
    darkness_hides: [
        { text: "The darkness hides everything" },
        { text: "There is not enough light to make out anything" },
        { text: "The shadows swallow every detail" }
    ],
    look_step_1: [
        {
            text: "You look around. The glow from the reactor reveals the pod you climbed out of. The glass is cracked. The power is on reserve."
        },
        {
            text: "You look around. Reactor light spills across the pod you climbed out of. The glass is fractured. The power is on reserve."
        },
        {
            text: "You look around. In the faint reactor glow you spot the pod you climbed out of. Cracks web the glass. The power is on reserve."
        }
    ],
    look_step_2: [
        { text: "You notice a dark band on the ground next to the large device." },
        { text: "Near the machine, you spot a dark band on the floor." },
        { text: "A dark wrist band lies beside the large device." }
    ],
    look_step_3: [
        {
            text: "You notice walls all around you... you are in a room... a few feet away you see a doorway leading into darkness."
        },
        {
            text: "As your eyes adjust further, walls emerge around you. A doorway waits a few feet away in the dark."
        },
        {
            text: "You realize this is a room. Ahead, a doorway opens into deeper darkness."
        }
    ],
    look_repeat: [
        { text: "You look around again, but don't notice anything new..." },
        { text: "You scan the room once more, but nothing new stands out..." },
        { text: "Another careful look reveals no new details..." }
    ],
    enter_darkness: [
        { text: "You step into the darkness beyond the doorway." },
        { text: "Darkness swallows the doorway behind you." }
    ],
    return_dark_room: [
        { text: "You return to the room with the embers." },
        { text: "You step back toward the glow of the embers." }
    ],
    return_dark_space: [
        { text: "You step back into the dark space." },
        { text: "You return to the dim outline of the space." }
    ],
    return_darkness_room: [
        { text: "You move back into the darkness." },
        { text: "You step into the dark once more." }
    ],
    return_darkness: [
        { text: "You move back into the darkness." },
        { text: "You slip into the dark again." }
    ],
    return_dimly_lit: [
        { text: "You return to the dimly lit room." },
        { text: "You step back into the pulsing red light." }
    ],
    return_terminal_room: [
        { text: "You return to the terminal room." },
        { text: "You step back toward the dead terminals." }
    ],
    feel_step_1: [
        { text: "You feel around in the darkness. There's a wall to your left. It's cold." },
        { text: "You reach into the dark and find a wall to your left. It's cold." }
    ],
    feel_step_2: [
        { text: "On that wall, something feels familiar... like a lever..." },
        { text: "Your fingers find something on the wall... a lever shape..." }
    ],
    feel_step_3: [
        { text: "You brush against something chair-shaped on the floor." },
        { text: "Your hand bumps a chair-like frame on the ground." }
    ],
    feel_step_4: [
        { text: "Tracing the wall, you find a partially closed doorway. Cold air leaks through the seam." },
        { text: "Your hand follows the wall to a partially closed door. Darkness leaks through its seam." }
    ],
    feel_step_5: [
        { text: "By your feet, you find a broken tablet, its screen faintly warm." },
        { text: "Your fingers catch the edge of a shattered tablet on the floor." }
    ],
    feel_repeat: [
        { text: "You feel around again, but nothing new stands out..." },
        { text: "You sweep the darkness once more, finding nothing new..." }
    ],
    pull_lever: [
        { text: "Dim red lighting begins pulsing from the ceiling." },
        { text: "A faint red pulse rolls across the ceiling as the lever engages." }
    ],
    darkness_look_1: [
        {
            text: "The pulsing red light reveals a room in disarray -- chairs knocked over, broken devices strewn across the floor, wires sparking faintly in the dark."
        },
        {
            text: "Red pulses expose a wrecked room -- chairs toppled, devices shattered, wires sparking faintly in the dark."
        }
    ],
    darkness_look_2: [
        { text: "In the center of the far wall, you notice a partially closed door -- its seam leaking darkness." },
        { text: "A partially closed door sits in the far wall, its seam leaking darkness." }
    ],
    darkness_look_3: [
        { text: "Along the right wall, dark terminals sit lifeless in a row -- dead screens, silent panels, faint grime." },
        { text: "To the right, a row of dead terminals lines the wall, screens black and grimy." }
    ],
    darkness_look_4: [
        {
            text: "Near your feet, ruined documents are scattered across the floor. Beside them, a broken tablet sits frozen on a diagnostic screen."
        },
        {
            text: "Ruined papers cover the floor. A broken tablet lies beside them, frozen on a diagnostic screen."
        }
    ],
    darkness_look_4_docs: [
        { text: "Near your feet, ruined documents are scattered across the floor." },
        { text: "Ruined papers cover the floor around your boots." }
    ],
    darkness_look_repeat: [
        { text: "You scan the room again, but nothing new stands out..." },
        { text: "Another look yields no new details..." }
    ],
    tablet_pickup: [
        {
            text: "The tablet's screen shows a fractured image -- too broken to read a name, too warped to make sense of the details. You recognize the face as yours... but it feels wrong. Foreign. Like something is missing."
        },
        {
            text: "A fractured image flickers on the tablet. The name is unreadable, the details warped. The face is yours... but wrong. Foreign. Like something is missing."
        }
    ],
    band_taken: [
        { text: "You take the band, and place it around your wrist. Its screen flickers on..." },
        { text: "You slip the band onto your wrist. The display sparks to life..." },
        { text: "You secure the band to your wrist, and its screen wakes with a flicker..." }
    ],
    freeze_warning: [
        { text: "You are freezing..." },
        { text: "Your skin is numb from the cold..." },
        { text: "The cold digs deeper into your bones..." }
    ],
    ambient_noise: [
        { text: "You hear a faint scuttle from the darkness..." },
        { text: "You hear a sharp scratch from the darkness..." },
        { text: "Something shifts just outside the reactor glow..." }
    ],
    death_flatline: [
        { text: "Vital signs flatline" },
        { text: "Life signs drop to zero" },
        { text: "No vital response detected" }
    ],
    death_freeze: [
        { text: "You freeze before the station wakes." },
        { text: "The cold takes you before dawn." },
        { text: "Your body gives in to the dark and the cold." }
    ]
};
export class LogVariantService {
    constructor(rng) {
        this.rng = rng;
        this.lastByKey = new Map();
        this.stickyByKey = new Map();
    }
    pick(key, vars) {
        const options = CATALOG[key];
        if (!options || options.length === 0) {
            return key;
        }
        let selected = 0;
        if (options.length === 1) {
            selected = 0;
        }
        else {
            const previous = this.lastByKey.get(key);
            const weighted = options.map((option, index) => ({
                index,
                weight: option.weight ?? 1
            }));
            const filtered = previous === undefined ? weighted : weighted.filter((item) => item.index !== previous);
            const pool = filtered.length > 0 ? filtered : weighted;
            const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
            let roll = this.rng() * totalWeight;
            selected = pool[pool.length - 1].index;
            for (const item of pool) {
                roll -= item.weight;
                if (roll <= 0) {
                    selected = item.index;
                    break;
                }
            }
        }
        this.lastByKey.set(key, selected);
        return this.interpolate(options[selected].text, vars);
    }
    pickSticky(key, vars) {
        const cached = this.stickyByKey.get(key);
        if (cached) {
            return this.interpolate(cached, vars);
        }
        const picked = this.pick(key);
        this.stickyByKey.set(key, picked);
        return this.interpolate(picked, vars);
    }
    interpolate(template, vars) {
        if (!vars) {
            return template;
        }
        return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
            if (vars[key] === undefined) {
                return "";
            }
            return String(vars[key]);
        });
    }
}
export function createSeededRng(seedInput) {
    let seed = seedInput >>> 0;
    if (seed === 0) {
        seed = 0x9e3779b9;
    }
    return () => {
        seed += 0x6d2b79f5;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export function createRunSeed() {
    const now = Date.now() >>> 0;
    const jitter = Math.floor(Math.random() * 0xffffffff) >>> 0;
    return (now ^ jitter) >>> 0;
}
