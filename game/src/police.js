// Neon Tide - Wanted Level System, Police AI Pursuit & Flanking Behavior
import * as THREE from 'three';
import { WANTED_CONFIG, VEHICLE_CONFIG } from './config.js';
import { Vehicle } from './vehicles.js';

export class PoliceManager {
  constructor(scene, world, vehicleManager, audio) {
    this.scene = scene;
    this.world = world;
    this.vehicleManager = vehicleManager;
    this.audio = audio;

    this.wantedLevel = 0; // 0 to 5 stars
    this.cooldownTimer = 0;
    this.isPursuing = false;

    this.copVehicles = [];
    this.spawnTimer = 0;
  }

  reportCrime(crimeType) {
    const starDelta = WANTED_CONFIG.CRIMES[crimeType] || 1;
    this.setWantedLevel(Math.min(WANTED_CONFIG.MAX_STARS, this.wantedLevel + starDelta));
    this.cooldownTimer = 0;
  }

  setWantedLevel(level) {
    const oldLevel = this.wantedLevel;
    this.wantedLevel = Math.max(0, Math.min(WANTED_CONFIG.MAX_STARS, level));

    if (this.wantedLevel > 0) {
      this.isPursuing = true;
      if (this.audio) this.audio.setSirenState(true);
    } else {
      this.isPursuing = false;
      if (this.audio) this.audio.setSirenState(false);
      this.clearCopSquad();
    }
  }

  clearWanted() {
    this.setWantedLevel(0);
    this.cooldownTimer = 0;
  }
  spawnPoliceCar(playerPos) {
    if (this.copVehicles.length >= WANTED_CONFIG.MAX_COPS[this.wantedLevel]) return;

    // Spawn 55-75m away from player along a road
    const angle = Math.random() * Math.PI * 2;
    const dist = 65;
    const sx = playerPos.x + Math.sin(angle) * dist;
    const sz = playerPos.z + Math.cos(angle) * dist;

    const copCar = new Vehicle(this.scene, this.world, 'POLICE', sx, sz, angle + Math.PI);
    copCar.isAI = false; // Custom pursuit AI
    copCar.sirenActive = true;

    this.copVehicles.push(copCar);
    this.vehicleManager.vehicles.push(copCar);
  }

  clearCopSquad() {
    for (const cop of this.copVehicles) {
      cop.sirenActive = false;
      cop.isAI = true; // Turn back into ambient car
    }
    this.copVehicles = [];
  }

  update(dt, player) {
    if (this.wantedLevel === 0) return;

    // Line of sight and distance check for wanted cooldown
    let canSeePlayer = false;
    for (const cop of this.copVehicles) {
      const d = cop.position.distanceTo(player.position);
      if (d < 50) {
        canSeePlayer = true;
        break;
      }
    }

    if (!canSeePlayer) {
      this.cooldownTimer += dt;
      if (this.cooldownTimer >= WANTED_CONFIG.COOLDOWN_TIME) {
        this.clearWanted();
        return;
      }
    } else {
      this.cooldownTimer = 0;
    }

    // Spawn cop reinforcements if under capacity
    this.spawnTimer += dt;
    const targetCops = WANTED_CONFIG.MAX_COPS[this.wantedLevel];
    if (this.copVehicles.length < targetCops && this.spawnTimer > 3.0) {
      this.spawnPoliceCar(player.position);
      this.spawnTimer = 0;
    }

    this.updateCopPursuitAI(dt, player);
  }
  updateCopPursuitAI(dt, player) {
    const pPos = player.position;

    for (let i = 0; i < this.copVehicles.length; i++) {
      const cop = this.copVehicles[i];
      const dist = cop.position.distanceTo(pPos);

      // Flanking / steering towards player
      const toPlayer = new THREE.Vector3().subVectors(pPos, cop.position);
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);

      // Smooth angle interpolation
      let diff = targetAngle - cop.rotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      cop.rotation += Math.max(-2.5 * dt, Math.min(2.5 * dt, diff * 3.5 * dt));

      // Speed regulation
      const copSpeed = 16 + this.wantedLevel * 4;
      cop.velocity = Math.min(copSpeed, cop.velocity + 18 * dt);

      cop.position.x += Math.sin(cop.rotation) * cop.velocity * dt;
      cop.position.z += Math.cos(cop.rotation) * cop.velocity * dt;

      // Check ramming collision with player
      if (dist < 3.2) {
        if (player.isDriving && player.currentVehicle) {
          player.currentVehicle.velocity *= 0.6;
          cop.velocity *= 0.5;
        } else if (!player.isDriving) {
          player.takeDamage(15 * dt);
        }
      }

      // Check Arrest / Busted
      if (!player.isDriving && dist < 2.4 && player.health > 0) {
        // Player cornered on foot
        player.takeDamage(200); // Trigger bust/hospital
      }
    }
  }
}
