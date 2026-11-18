# Neon Tide: Palma Verde

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/xiaogui917/makefun-gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/xiaogui917/makefun-gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

An original 3D open-world crime action game built for the **make.fun GTA 6 Bounty (`gta6-01`)**. Explore the vibrant, sun-drenched coastal metropolis of **Palma Verde**, complete with full pedestrian traffic, responsive AI police pursuit, carjacking, combat, and sequential story missions.

## Game Overview
- **Setting**: Palma Verde, a 600m² seaside metropolis featuring four unique districts:
  - *Downtown Core*: Glittering corporate high-rises and neon avenues.
  - *Oceanfront Boulevard*: Pastel Art Deco hotels, sun loungers, and palm-lined sandy beaches.
  - *Puerto Industrial*: Gritty dockyards, cargo warehouses, shipping containers, and syndicate safehouses.
  - *Palma Palms Estates*: Sun-bleached residential suburbs and neighborhood corridors.
- **Vehicles**: 5 distinct controllable vehicle types with unique physics and handling:
  - *Neon GT Turbo* (Sports Coupe)
  - *Palma Cruiser* (4-Door Sedan)
  - *PVPD Interceptor* (Police Cruiser with working lightbars and siren)
  - *Sun Cab* (City Taxi)
  - *Cargo Box Hauler* (Industrial Van)
## Gameplay Features
- **Story Missions**:
  1. *First Wheels*: Jack a luxury Neon GT sports car outside Grand Coral Hotel and drop it off at Leo’s Chop Shop in Puerto Industrial ($500 reward).
  2. *Bay Courier*: High-speed timed run retrieving encrypted drives from Downtown to Oceanfront within 90 seconds ($1,200 reward).
  3. *Heat Run*: Outrun an intense 3-star tactical police dragnet across town and reach the North Beach Safehouse alive ($3,000 reward).
- **Wanted Level & Police AI**:
  - Crimes (carjacking, shooting, hitting pedestrians, crashing into squad cars) increment wanted level from 1 to 5 stars.
  - Tactical response escalates from foot patrol officers to aggressive high-speed police cruisers.
  - Eluding sight for 14 seconds allows wanted heat to cool down to zero.
- **Combat & Collectibles**:
  - Melee punches (F key) and firearm shooting (Left Mouse Click).
  - Health packs (+40 HP), ammunition crates (+30 ammo), and cash stashes (+$250) scattered across the city.
- **Audio & Visuals**:
  - Procedural WebAudio synthesizer delivering dynamic vehicle engine pitch, police sirens, gunshots, impacts, chimes, and retro synthwave basslines.
  - Zero external network requests; self-contained Three.js rendering.
## Controls
| Action | Key / Input |
|---|---|
| Move / Steer | **W / A / S / D** or Arrow Keys |
| Sprint | **Left Shift** |
| Enter / Exit Vehicle | **E** |
| Melee Strike | **F** |
| Fire Weapon | **Left Mouse Click** |
| Handbrake / Drift | **Space** |
| Camera Orbit | **Mouse Movement** |
| Pause Game | **P** or **Escape** |
| Mute / Unmute Audio | **M** |

## Running Locally
Run the lightweight static development server:
```bash
node serve.ts --port 8080
```
Then open `http://localhost:8080` in Chrome or any modern desktop browser.

To build the submission output dossier:
```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License
MIT License. See [LICENSE](LICENSE) for details.
