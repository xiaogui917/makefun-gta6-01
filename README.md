# Neon Tide - Palma Verde Stories

[![make.fun competition](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![make.fun rank](https://make.fun/badge/gta6-01/xiaogui917/makefun-gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![make.fun reward](https://make.fun/badge/gta6-01/xiaogui917/makefun-gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

**Neon Tide** is an open-world 3D crime action game built for the [make.fun gta6-01](https://make.fun/bounty/gta6-01) competition.

Set in the sun-soaked, synth-lit coastal metropolis of **Palma Verde**, players take on the role of Dante Rios, navigating high-stakes crime, high-speed vehicle getaways, and intense tactical police pursuits across diverse city districts.

---

## Features

- **Living 3D City (Palma Verde)**:
  - Multi-lane road grid, sidewalks with curbs, and crosswalks.
  - Distinct architectural districts: Downtown highrises with lit neon windows and rooftop spires, Art-Deco pastel beachfront hotels, Port Lorenzo industrial warehouses with cargo containers, and Palma Heights residential plazas.
  - Coastal highway along Ocean Boulevard with sandy beaches, palm trees, and animated ocean water.
  - Collectible pickups: Health medkits (+40 HP), Ammo crates (+30 rounds), and Cash briefcases (+$250).

- **Vehicles & Arcade Driving Physics**:
  - Stealable parked cars and active NPC traffic cruising city road corridors.
  - Diverse vehicle fleet: Vipera GT (sports coupe), Stallion 400 (4-door sedan), Palma PD Interceptor (police cruiser), Sun Cab (taxi), and Hauler Cargo (van).
  - Acceleration, braking, reverse gear, handbrake drift sliding, wheel rotation, steering wheel pivot, and headlights.
  - Vehicle damage, collision impacts, and deformation.

- **Pedestrian Life & Pedestrian AI**:
  - Citizens strolling along sidewalks with randomized appearances.
  - Reactive AI: pedestrians panic and run away with flailing limbs when gunshots are fired or speeding cars crash nearby.
  - Downed pedestrians drop cash that can be scavenged.

- **5-Star Wanted System & Police Pursuit AI**:
  - Dynamic crime detection: vehicle theft (+1★), assault/hit-and-run (+2★), firearm discharge (+1★), ramming police vehicles (+2★), and attacking officers (+3★).
  - Palma Verde PD dispatches high-speed pursuit cruisers with alternating red/blue light bars and wailing sirens.
  - Evasion & search mechanic: break line of sight and evade cruisers for 14 seconds to drop wanted stars back to 0.
  - Busted / Wasted system: surrounded or downed players respawn outside Central Hospital with bail/medical fines.

- **Story Campaign & Missions**:
  - **Mission 1: First Wheels**: Locate and hotwire the Vipera GT near Club Neon downtown and deliver it to Lorenzo's Harbor Garage ($500).
  - **Mission 2: Bay Courier**: High-speed timed delivery across 3 coastal checkpoints along Ocean Boulevard ($1,200).
  - **Mission 3: Heat Run**: Survive a mandatory 3-Star PVPD pursuit, lose the tail, and deliver contraband safely to the safehouse ($3,000).
  - 3D neon waypoint beacons and minimap GPS markers.

- **Combat System**:
  - Unarmed melee punch with forward impact detection (`F`).
  - Pistol shooting with bullet tracers, raycast hit detection, and sound effects (Left Click).
  - Hostile syndicate gang enforcers guarding Port Lorenzo who return fire when provoked.

- **Cyber-Retro HUD & Radar Minimap**:
  - Player health bar, armor bar, cash counter, weapon ammo status.
  - Dynamic flashing 5-star wanted display.
  - Digital speedometer with MPH and RPM throttle indicator when driving.
  - Real-time rotating 2D Canvas radar minimap with roads, ocean boundary, player heading arrow, police blips, and mission waypoints.
  - Start screen with lore prologue, pause menu, game over screen, and mission success banners.

- **100% Procedural Web Audio**:
  - Dynamic engine pitch modulation based on RPM and speed.
  - Oscillating police siren wails.
  - Synthesized gunshot cracks and punch impacts.
  - Looping ambient synthwave soundtrack generated via Web Audio API oscillators and filters.
  - Audio mute toggle (`M`).

- **Save / Load Persistence**:
  - Saves progress, cash, health, ammo, and completed mission state to `localStorage`.
  - Auto-saves upon mission completion; manual save available in the pause menu.

---

## Controls

| Action | Key / Input |
|---|---|
| **Move / Steer** | `W`, `A`, `S`, `D` / Arrow Keys |
| **Look / Orbit Camera** | Mouse Movement |
| **Sprint** | `Shift` (Hold) |
| **Enter / Exit Vehicle** | `E` |
| **Handbrake / Drift** | `Space` |
| **Melee Punch** | `F` |
| **Shoot Pistol** | `Left Mouse Click` |
| **Pause / Menu** | `P` / `Escape` |
| **Mute / Unmute Audio** | `M` |

---

## Running Locally

Requirements: Node.js 22+ (no build step, pure static ES modules).

```bash
# Start local static server
node serve.ts --port 8080
```

Open your browser and navigate to:
```
http://localhost:8080
```

---

## Deterministic Screenshots Mode

The game includes URL-driven deterministic modes for testing and inspection:
- `http://localhost:8080/?shot=start`: Title screen overlooking Palma Verde skyline.
- `http://localhost:8080/?shot=drive`: High-speed cruise in the Vipera GT along Ocean Blvd.
- `http://localhost:8080/?shot=chase`: 3-Star tactical pursuit with PVPD cruisers.
- `http://localhost:8080/?shot=mission`: Mission 2 "Bay Courier" checkpoint race.

---

## Packaging

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Outputs the validated `game/`, `screenshots/`, and `dossier.json` to the target directory.

---

## License

This project is licensed under the [MIT License](LICENSE).
