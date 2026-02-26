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
    pod_room_reveal: [
        {
            text: "In the pulsing light, you notice other devices like the one you crawled out of... lined along the walls. Most are dormant. Some are cracked open. Some look destroyed."
        },
        {
            text: "The pulsing light reveals other pods like yours along the walls. Most are dormant. Some are cracked open. Some look destroyed."
        }
    ],
    enter_darkness: [
        { text: "You step into the darkness beyond the doorway." },
        { text: "Darkness swallows the doorway behind you." }
    ],
    enter_control_room: [
        { text: "You step into the terminal chamber, red light pulsing across the floor." },
        { text: "You move into the control chamber as dim red pulses return." }
    ],
    return_control_room: [
        { text: "You return to the control room." },
        { text: "You step back toward the control terminals." }
    ],
    enter_pod_room: [
        { text: "You step back into the room of dormant pods." },
        { text: "You enter the pod room again." }
    ],
    return_dark_room: [
        { text: "You return to the room with the embers." },
        { text: "You step back toward the glow of the embers." }
    ],
    return_pod_room: [
        { text: "You return to the pod room." },
        { text: "You step back among the dormant pods." }
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
    darkness_look_doors: [
        {
            text: "Through the pulse, you spot two exits: a jammed door on one side and a partially open door bleeding darkness on the other."
        },
        {
            text: "The red light catches two routes -- one jammed shut, one partially open into deeper dark."
        }
    ],
    enter_hub: [
        { text: "You step through the partially open door into deeper darkness." },
        { text: "You move into a dark space beyond the doorway." }
    ],
    return_hub: [
        { text: "You return to the dark space." },
        { text: "You step back into the darkness and sparks." }
    ],
    hub_left_wing_movement: [
        { text: "From the left wing, something heavy drags across metal." },
        { text: "A heavy scrape rolls from the left wing." }
    ],
    hub_debris_collapse: [
        { text: "Debris crashes down somewhere in the dark, blocking a route." },
        { text: "Something collapses ahead and a path is cut off." }
    ],
    hub_look_1: [
        {
            text: "Intermittent sparks reveal torn paneling, dried blood trails, and wreckage scattered through the space."
        },
        {
            text: "Warped shadows from loose wiring expose blood, debris, and structural damage across the space."
        }
    ],
    hub_look_blocked_door: [
        {
            text: "Through the sparks you catch glimpses of the debris that fell, and see a door behind it, now blocked..."
        },
        {
            text: "A flash of light shows a door buried behind collapsed debris."
        }
    ],
    hub_look_sealed_door: [
        { text: "The sparks flash again and you notice a closed door on the opposite side of the space." },
        { text: "Another flicker reveals a sealed door across the chamber." }
    ],
    hub_look_dark_doorway: [
        {
            text: "To your right, you notice a bare doorway... the door on the floor near it, as if torn from its hinges... Faint red light pulses from the other side."
        },
        {
            text: "A torn doorway opens to your right, door panel ripped free. Faint red light pulses beyond."
        }
    ],
    hub_look_repeat: [
        { text: "You scan the space again, but nothing new emerges from the flicker." },
        { text: "Another pass through the darkness reveals no new detail." }
    ],
    enter_dark_doorway: [
        { text: "You step through the doorway, following the glow..." },
        { text: "You move through the dark doorway toward the faint red light." }
    ],
    return_dimly_lit_space: [
        { text: "You return to the dimly lit space." },
        { text: "You step back into the dimly lit space." }
    ],
    return_research_room: [
        { text: "You return to the research room." },
        { text: "You step back into the room lined with damaged research equipment." }
    ],
    enter_service_power: [
        {
            text: "You step into a smaller-feeling room. The air is warmer here -- radiating heat, like something powerful is nearby."
        },
        { text: "You enter a tighter passage where heat rolls across the walls and unstable light flickers." }
    ],
    return_service_power: [
        { text: "You return to the warm, flickering passage." },
        { text: "Heat builds again as you step back into the service passage." }
    ],
    power_service_look_1: [
        { text: "Flickering light comes from intermittent sparks popping somewhere in the back of the room." },
        { text: "Sparks crackle in the rear, casting brief flashes across the passage." }
    ],
    power_service_look_2: [
        { text: "Between the sparks, something boxy catches the light -- maybe a control panel, half-hidden in shadow." },
        { text: "A boxy shape glints in the flashes, like a panel buried in darkness." }
    ],
    power_service_look_repeat: [
        { text: "The same sparks keep flashing, but no new details emerge." },
        { text: "You watch the intermittent flashes. Nothing else becomes clear." }
    ],
    enter_service_machine: [
        {
            text: "You step into what feels like a wide chamber. Somewhere in the dark, metal shifts with a sharp, deliberate sound."
        },
        { text: "A wider service passage opens ahead. In the dark, metal scrapes with deliberate weight." }
    ],
    return_service_machine: [
        { text: "You return to the dark service chamber." },
        { text: "You step back into the wide, shadowed passage." }
    ],
    machine_service_look_1: [
        {
            text: "Faint backlight flickers from the same direction as the movement, sketching the silhouette of a large figure."
        },
        { text: "A weak backlight catches a large silhouette where the metal shifting came from." }
    ],
    machine_service_look_2: [
        { text: "It's too dim to make out details -- only the silhouette and weak backlighting." },
        { text: "You still can only see the silhouette against faint backlight." }
    ],
    machine_service_look_post_inspect: [
        { text: "A flicker of light reveals tools and machinery lining the walls." },
        { text: "In a brighter flash, you spot tools and heavy machinery mounted along the walls." }
    ],
    machine_service_look_repeat: [
        { text: "The chamber remains dim, with only brief flashes of detail." },
        { text: "You scan the room again, but the darkness hides most detail." }
    ],
    machine_inspect_movement_unknown: [
        { text: "Up close, it looks like a large droid caught in a repeating boot cycle. Frayed cables trail from its frame." },
        { text: "The figure is a heavy droid-like machine stuck restarting, its power lines frayed and unstable." }
    ],
    allocation_room_required: [
        { text: "Power controls are only accessible from the power room." },
        { text: "You need to be in the power room to access allocation controls." }
    ],
    enter_research: [
        { text: "You cross into a ruined lab space." },
        { text: "You enter a wrecked section lined with broken equipment." }
    ],
    return_research: [
        { text: "You return to the research lab." },
        { text: "You step back into the ruined lab." }
    ],
    research_entry_movement: [
        { text: "Something shifts deeper in the room, hidden by darkness." },
        { text: "A soft movement stirs beyond the red glow." }
    ],
    research_look_1: [
        {
            text: "In the dim flashes of light you catch a glimpse of a broken table, and what looks like science equipment scattered about..."
        },
        {
            text: "Faint pulses reveal a broken table and scattered pieces of scientific equipment."
        }
    ],
    research_look_restricted: [
        { text: "Through the light pulses, you notice a heavy sealed door cut into the far wall." },
        { text: "A sealed blast door emerges in the flashes, marked and reinforced." }
    ],
    research_look_maintenance: [
        { text: "To one side, a service passage opens into deeper shadow." },
        { text: "You notice a maintenance passage branching off in the dark." }
    ],
    research_look_power: [
        { text: "Beyond broken consoles, a route continues toward a brighter electrical glow." },
        { text: "You find a corridor leading toward a stronger power source." }
    ],
    research_look_repeat: [
        { text: "You look again, but the lab offers nothing new." },
        { text: "Another scan of the lab yields no new clue." }
    ],
    restricted_door_eye: [
        { text: "The blast-sealed door bears a faintly glowing eye symbol." },
        { text: "A dim eye sigil pulses on the sealed restricted lab door." }
    ],
    restricted_door_repeat: [
        { text: "The eye symbol remains fixed on the sealed door." },
        { text: "The restricted lab door remains sealed, eye marker faintly lit." }
    ],
    enter_power_station: [
        { text: "You enter a chamber humming with unstable current." },
        { text: "You step into a flickering power station." }
    ],
    return_power_station: [
        { text: "You return to the power station." },
        { text: "You step back into the generator chamber." }
    ],
    power_look_1: [
        { text: "Emergency feeds arc through damaged conduits across the room." },
        { text: "Generator housings pulse weakly around you." }
    ],
    power_look_2: [
        { text: "You locate a control panel wired into emergency distribution." },
        { text: "A battered control panel sits against the far wall." }
    ],
    power_look_repeat: [
        { text: "You look again, but notice nothing new in the station." },
        { text: "No new detail stands out in the power station." }
    ],
    power_panel_inspected: [
        { text: "The panel responds. Emergency allocation controls unlock." },
        { text: "Diagnostic lines flicker online. Emergency allocation is accessible." }
    ],
    power_panel_repeat: [
        { text: "The panel is already active." },
        { text: "The allocation controls are still online." }
    ],
    allocation_open: [{ text: "Emergency allocation interface opened." }],
    allocation_close: [{ text: "Emergency allocation interface closed." }],
    allocation_locked: [{ text: "Allocation locked by override protocol." }],
    allocation_no_power: [{ text: "No available emergency power to allocate." }],
    allocation_adjusted: [{ text: "Emergency allocation updated." }],
    alloc_failure_open_circuit: [{ text: "Emergency feed is bleeding into an open line." }],
    alloc_failure_converter: [{ text: "Power reaches this wing, but cannot be transformed for use." }],
    alloc_failure_distribution: [{ text: "Power arrives. Nothing downstream responds." }],
    door_jammed: [{ text: "The door will not move. It is jammed." }],
    door_sealed: [{ text: "The door is sealed shut." }],
    door_collapsed: [{ text: "Debris blocks the route completely." }],
    terminals_dead: [{ text: "The terminals are dead in the dark." }],
    control_room_power_loss: [{ text: "Control room power dropped below operational threshold." }],
    ai_boot_hello: [{ text: "Hello, Cass." }],
    ai_query_1: [{ text: "It is good to see you up... but you are not safe..." }],
    ai_query_2: [{ text: "Our first priority is getting you clothes. There should be some in the living quarters." }],
    ai_query_3: [{ text: "It is blocked by debris... I see. The maintenance droid should be able to take care of that for us." }],
    ai_query_check_droid: [{ text: "Check the maintenance bay for the droid..." }],
    ai_unlock_toolkit: [
        { text: "Frayed wires... unfortunate... but repairable. I will unlock the emergency toolkit for you. It's in the maintenance bay." }
    ],
    ai_query_blocked: [{ text: "You stare at the terminal screen, but no more messages appear." }],
    ai_query_finished: [{ text: "You stare at the terminal screen, but no more messages appear." }],
    enter_maintenance: [
        { text: "You move into a service bay where machinery ticks in the dark." },
        { text: "You enter maintenance, the air full of stale coolant and static." }
    ],
    return_maintenance: [
        { text: "You return to the maintenance bay." },
        { text: "You step back into maintenance." }
    ],
    maintenance_entry_loop: [
        { text: "A servo whine rises and dies in a repeating mechanical loop." },
        { text: "A failed boot rhythm clicks from deeper in the bay." }
    ],
    maintenance_look_1: [
        { text: "A silhouette stands near faint lights at the back of the bay." },
        { text: "In dim light, you make out a figure slumped near the rear wall." }
    ],
    maintenance_look_low_power: [
        { text: "The bay is too dim. You can only see the silhouette and weak backlights." },
        { text: "Low power leaves most of the bay unreadable." }
    ],
    maintenance_look_repeat: [
        { text: "You look again. Nothing else stands out." },
        { text: "Another scan of the bay reveals nothing new." }
    ],
    maintenance_inspect_movement: [
        { text: "It is a service droid stuck in a boot loop. Frayed cables bleed what little charge reaches it." },
        { text: "A maintenance droid keeps restarting. Frayed power lines prevent a stable feed." }
    ],
    maintenance_inspect_repeat: [
        { text: "The droid still fails to complete boot." },
        { text: "The droid remains locked in the same boot cycle." }
    ],
    maintenance_inspect_repeat_named: [
        { text: "The maintenance droid still fails to complete boot." },
        { text: "The maintenance droid remains trapped in the same boot cycle." }
    ],
    maintenance_power_low: [{ text: "Insufficient emergency power reaches the bay." }],
    maintenance_repair_cables: [{ text: "You splice the frayed lines and restore a stable feed path." }],
    maintenance_droid_boot: [{ text: "The droid's boot loop stabilizes under sustained power." }],
    toolkit_found: [
        { text: "By touch, you locate an emergency toolkit stashed under a torn floor panel." },
        { text: "Your hand finds a hard case in the dark: an emergency toolkit." }
    ],
    maintenance_feel_repeat: [
        { text: "You feel around, but find nothing new." },
        { text: "Another sweep of the bay turns up nothing." }
    ],
    toolkit_taken: [
        { text: "You secure the emergency toolkit." },
        { text: "You take the emergency toolkit and sling it over your shoulder." }
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
    inspect_terminals_1: [
        {
            text: "You step closer and examine the terminals. They feel like part of a control system -- old, industrial, purpose-built."
        },
        {
            text: "You inspect the terminals up close. They feel like part of an old control system -- industrial, purpose-built."
        }
    ],
    inspect_terminals_2: [
        {
            text: "One terminal isn't fully dead. Faint text pulses on its screen... in sync with the red ceiling light."
        },
        {
            text: "A single terminal flickers to life. Faint text pulses in time with the red ceiling light."
        }
    ],
    inspect_terminals_repeat: [
        { text: "You scan the terminals again, but nothing new answers you." },
        { text: "The terminals remain quiet and unchanged." }
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
        { text: "Ruined papers cover the floor around your feet." }
    ],
    darkness_look_repeat: [
        { text: "You scan the room again, but nothing new stands out..." },
        { text: "Another look yields no new details..." }
    ],
    ai_offline: [{ text: "Artificial Intelligence Offline." }],
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
    ambient_hub: [
        { text: "A heavy scrape echoes through the dark space." },
        { text: "Debris shifts somewhere beyond the sparks." }
    ],
    ambient_research: [
        { text: "A light scuttle taps across broken lab flooring." },
        { text: "You hear intermittent clicks from deeper in the lab." }
    ],
    ambient_maintenance: [
        { text: "A servo whine rises and fails again." },
        { text: "A motor stutters in the dark, then dies." }
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
