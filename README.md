# Neon Tide: Palma Verde

[![Competition](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/xiaogui917/makefun-gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/xiaogui917/makefun-gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

**Neon Tide** is an open-world 3D crime action game set in the fictional coastal metropolis of **Palma Verde**, 1986. Built entirely with Three.js, ES modules, and procedural WebAudio sound synthesis, the game delivers an authentic 80s synthwave crime experience running offline in any modern desktop browser with zero external network requests.

---

## Game Features

- **Living Open World City**: 600m x 600m urban expanse spanning four distinct districts:
  - *Oceanfront Promenade*: Sun-drenched coastal drive lined with palm trees, beaches, and art deco hotels.
  - *Downtown Skylines*: Towering skyscrapers with illuminated neon windows.
  - *Port & Industrial District*: Warehouses, shipping yards, and hostile syndicate territory.
  - *Palma Suburbs*: Residential neighborhoods with winding streets.
- **Dynamic AI Traffic & Stealable Vehicles**: Five driveable vehicle types:
  - *Verde Turbo GT*: Fast, high-acceleration sports car.
  - *Palma Cruiser*: Four-door family sedan.
  - *Metro Police Cruiser*: High-speed pursuit car with flashing sirens.
  - *Cab 86*: Classic yellow city taxi.
  - *Cargo Mule*: Heavy delivery utility truck.
- **5-Star Wanted System**:
  - Police patrol units respond dynamically to player crimes (car theft, reckless driving, hitting pedestrians, gunfire).
  - Pursuit squad cars flank and attempt pit maneuvers.
  - Breaking line-of-sight for 14 seconds clears active wanted stars.
- **Story Missions & Syndicate Contracts**:
  - *Mission 1 - First Wheels*: Commandeer a high-end sports car and deliver it to the Port chop shop (Reward: $500).
  - *Mission 2 - Bay Courier*: High-speed timed cross-city contraband delivery across heavy traffic (Reward: $1,200).
  - *Mission 3 - Heat Run*: Survive a citywide 3-star police dragnet and reach the safehouse garage (Reward: $3,000).
- **Combat & World Pickups**:
  - Melee punches with swoosh impact physics.
  - Ranged gunplay with ammo management.
  - Scattered health, ammo, and cash pickup crates.
  - Rival cartel gang members defending warehouse docks.
- **Heads-Up Display (HUD) & Radar**:
  - Live rotating canvas minimap radar displaying city roads, player heading, traffic blips, police cruisers, and mission beacons.
  - Speedometer readout, wanted star tracker, cash and health bars.
- **Procedural WebAudio Synthesis**:
  - Procedurally generated engine revs, multi-tone police sirens, gunshots, punches, and synthwave bassline soundtrack.

---

## Controls

| Action | Control |
| :--- | :--- |
| Move / Drive | `W`, `A`, `S`, `D` |
| Camera Look / Aim | Mouse Orbit |
| Sprint | `Shift` (hold) |
| Enter / Exit Vehicle | `E` |
| Melee Punch | `F` |
| Shoot Weapon | `Left Mouse Button` |
| Handbrake / Drift | `Space` |
| Pause Game | `Esc` or `P` |
| Mute Audio | `M` |
## Playing Locally

No complex build pipeline or bundle step is required. Serve the game locally with Node 22:

```bash
node serve.ts
```

Open your browser at `http://localhost:8080` to play.

To test with custom port:
```bash
node serve.ts --port 8901
```

## Deterministic AI Benchmarking Screenshots

The game supports deterministic scenario rendering for automated verification:
- `?shot=start`: Title screen with Palma Verde coastal vista.
- `?shot=drive`: High-speed cruise through city streets with speedometer and traffic.
- `?shot=chase`: 3-star wanted level with sirens, police pursuit units, and radar tracking.
- `?shot=mission`: Mission 2 delivery in progress with 3D waypoint beacon.

## Building Submission Output

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
