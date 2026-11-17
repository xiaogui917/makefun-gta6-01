// Neon Tide - Wanted Level & Police AI System
// Palma Verde Police Department (PVPD)

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class PoliceManager {
  constructor(scene, audio, vehicleManager) {
    this.scene = scene;
    this.audio = audio;
    this.vehicleManager = vehicleManager;

    this.wantedLevel = 0;       // 0 to 5 stars
    this.evasionTimer = 0;      // Countdown when out of sight
    this.isSearching = false;    // True when stars are flashing (breaking line of sight)
    this.copCruisers = [];      // Active pursuit cruisers
    this.copOfficers = [];      // Active pursuit foot officers
    this.bustedTimer = 0;       // Seconds surrounded before arrest

    this.spawnCooldown = 0;
  }

  reportCrime(crimeType) {
    let starsToAdd = 1;
    if (crimeType === 'HIT_PED') starsToAdd = CONFIG.WANTED.HIT_PED_CRIME;
    else if (crimeType === 'THEFT') starsToAdd = CONFIG.WANTED.THEFT_CRIME;
    else if (crimeType === 'DISCHARGE') starsToAdd = CONFIG.WANTED.DISCHARGE_CRIME;
    else if (crimeType === 'RAM_POLICE') starsToAdd = CONFIG.WANTED.RAM_POLICE_CRIME;
    else if (crimeType === 'KILL_OFFICER') starsToAdd = CONFIG.WANTED.KILL_OFFICER_CRIME;

    this.setWantedLevel(Math.min(CONFIG.WANTED.MAX_STARS, this.wantedLevel + starsToAdd));
  }

  setWantedLevel(level) {
    const oldLevel = this.wantedLevel;
    this.wantedLevel = Math.max(0, Math.min(CONFIG.WANTED.MAX_STARS, level));

    if (this.wantedLevel > 0) {
      this.evasionTimer = CONFIG.WANTED.EVASION_TIME;
      this.isSearching = false;
      this.audio.startSiren();
    } else {
      this.audio.stopSiren();
      this.clearPoliceUnits();
    }
  }

  clearPoliceUnits() {
    for (const c of this.copCruisers) {
      c.isWrecked = true;
      this.scene.remove(c.group);
    }
    this.copCruisers = [];

    for (const o of this.copOfficers) {
      this.scene.remove(o.group);
    }
    this.copOfficers = [];
  }

  update(dt, player, world, onBusted, onWasted) {
    if (player.isDead) {
      if (onWasted) onWasted();
      return;
    }

    if (this.wantedLevel === 0) {
      return;
    }

    // Maintain cop cruisers count based on stars
    const targetCruisers = Math.min(4, this.wantedLevel);
    this.spawnCooldown -= dt;
    if (this.copCruisers.length < targetCruisers && this.spawnCooldown <= 0) {
      this.spawnPoliceCruiser(player);
      this.spawnCooldown = 3.5;
    }

    // Sight & Evasion Tracking
    let hasLineOfSight = false;
    const playerPos = player.position;

    // Update Cruisers Pursuit
    for (let i = this.copCruisers.length - 1; i >= 0; i--) {
      const cruiser = this.copCruisers[i];
      if (cruiser.isWrecked) {
        this.copCruisers.splice(i, 1);
        continue;
      }

      cruiser.sirenActive = true;
      const dist = cruiser.position.distanceTo(playerPos);
      if (dist < CONFIG.WANTED.SIGHT_DISTANCE) {
        hasLineOfSight = true;
      }

      // Pursuit steering towards player
      const toPlayerX = playerPos.x - cruiser.position.x;
      const toPlayerZ = playerPos.z - cruiser.position.z;
      const targetHeading = Math.atan2(toPlayerX, toPlayerZ);

      cruiser.rotation = this.lerpAngle(cruiser.rotation, targetHeading, dt * 2.5);

      // Accelerate towards player
      const maxPursuitSpeed = 24 + this.wantedLevel * 2.5;
      cruiser.speed = Math.min(maxPursuitSpeed, cruiser.speed + 18 * dt);

      const moveDist = cruiser.speed * dt;
      const nextX = cruiser.position.x + Math.sin(cruiser.rotation) * moveDist;
      const nextZ = cruiser.position.z + Math.cos(cruiser.rotation) * moveDist;

      if (!world.checkCollision(nextX, nextZ, cruiser.radius)) {
        cruiser.position.x = nextX;
        cruiser.position.z = nextZ;
      } else {
        cruiser.rotation += (Math.random() - 0.5) * 1.5;
        cruiser.speed *= 0.5;
      }

      // Ramming / Arrest proximity
      if (dist < 4.2) {
        if (player.inVehicle && player.currentVehicle) {
          // Ramming player vehicle
          player.currentVehicle.health -= 12 * dt;
          cruiser.speed *= 0.7;
        } else {
          // On foot collision damage
          player.takeDamage(15 * dt);
        }
      }
    }

    // Check Busted Condition: surrounded by cops while stopped
    const playerSpeed = player.inVehicle && player.currentVehicle ? Math.abs(player.currentVehicle.speed) : 0;
    let copsSurrounding = 0;
    for (const c of this.copCruisers) {
      if (c.position.distanceTo(playerPos) < 6.5) copsSurrounding++;
    }

    if (copsSurrounding >= 1 && playerSpeed < 2.0) {
      this.bustedTimer += dt;
      if (this.bustedTimer >= 2.5) {
        // Player is BUSTED!
        this.setWantedLevel(0);
        this.bustedTimer = 0;
        if (onBusted) onBusted();
        return;
      }
    } else {
      this.bustedTimer = Math.max(0, this.bustedTimer - dt * 2);
    }

    // Evasion & Wanted decay
    if (!hasLineOfSight) {
      this.isSearching = true;
      this.evasionTimer -= dt;
      if (this.evasionTimer <= 0) {
        // Lost the cops!
        this.setWantedLevel(0);
      }
    } else {
      this.isSearching = false;
      this.evasionTimer = CONFIG.WANTED.EVASION_TIME;
    }
  }

  spawnPoliceCruiser(player) {
    // Spawn cruiser behind or ahead on a road corridor ~60m away
    const angle = Math.random() * Math.PI * 2;
    const dist = 65 + Math.random() * 20;
    const x = Math.max(-250, Math.min(250, player.position.x + Math.sin(angle) * dist));
    const z = Math.max(-250, Math.min(250, player.position.z + Math.cos(angle) * dist));

    const cruiser = this.vehicleManager.createVehicle('police', x, z, angle + Math.PI, true);
    cruiser.speed = 15;
    cruiser.sirenActive = true;
    this.copCruisers.push(cruiser);
  }

  lerpAngle(a, b, t) {
    let diff = (b - a) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
  }
}
