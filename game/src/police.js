// Police and Wanted Level System for Neon Tide
import * as THREE from 'three';
import { WANTED_CONFIG, VEHICLE_TYPES } from './config.js';
import { Vehicle } from './vehicles.js';

export class PoliceOfficer {
  constructor(scene, x, z) {
    this.scene = scene;
    this.position = new THREE.Vector3(x, 0, z);
    this.heading = 0;
    this.speed = 4.8;
    this.health = 45;
    this.isAlive = true;

    this.group = new THREE.Group();
    this.buildMesh();
    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  buildMesh() {
    // Torso (Police Blue / Vest)
    const tGeo = new THREE.BoxGeometry(0.65, 0.85, 0.38);
    const tMat = new THREE.MeshLambertMaterial({ color: 0x1a2436 });
    const torso = new THREE.Mesh(tGeo, tMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    this.group.add(torso);

    // Head with Police Cap
    const hGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    const hMat = new THREE.MeshLambertMaterial({ color: 0xffd1b3 });
    const head = new THREE.Mesh(hGeo, hMat);
    head.position.y = 1.55;
    this.group.add(head);

    const capGeo = new THREE.BoxGeometry(0.38, 0.12, 0.42);
    const capMat = new THREE.MeshLambertMaterial({ color: 0x111622 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 1.72, 0.04);
    this.group.add(cap);
    // Limbs
    const lMat = new THREE.MeshLambertMaterial({ color: 0x111622 });
    const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);
    this.lLeg = new THREE.Mesh(legGeo, lMat);
    this.lLeg.position.set(-0.18, 0.38, 0);
    this.group.add(this.lLeg);

    this.rLeg = new THREE.Mesh(legGeo, lMat);
    this.rLeg.position.set(0.18, 0.38, 0);
    this.group.add(this.rLeg);
  }

  takeDamage(amt) {
    this.health -= amt;
    if (this.health <= 0) {
      this.isAlive = false;
      this.group.rotation.x = Math.PI / 2;
      this.group.position.y = 0.2;
    }
  }

  updateChase(dt, targetPos) {
    if (!this.isAlive) return;

    const angle = Math.atan2(targetPos.x - this.position.x, targetPos.z - this.position.z);
    this.heading = angle;

    const dist = this.position.distanceTo(targetPos);
    if (dist > 1.8) {
      this.position.x += Math.sin(this.heading) * this.speed * dt;
      this.position.z += Math.cos(this.heading) * this.speed * dt;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;
  }
}
export class PoliceManager {
  constructor(scene) {
    this.scene = scene;
    this.wantedStars = 0;
    this.decayTimer = 0;
    this.units = []; // cruisers & foot officers
    this.spawnTimer = 0;
  }

  addCrime(crimeType, onWantedChange) {
    const addStars = WANTED_CONFIG.crimes[crimeType] || 1;
    const oldStars = this.wantedStars;
    this.wantedStars = Math.min(WANTED_CONFIG.maxStars, this.wantedStars + addStars);
    this.decayTimer = WANTED_CONFIG.decayCooldown;

    if (this.wantedStars !== oldStars && onWantedChange) {
      onWantedChange(this.wantedStars);
    }
  }

  setWantedLevel(stars, onWantedChange) {
    this.wantedStars = Math.max(0, Math.min(WANTED_CONFIG.maxStars, stars));
    this.decayTimer = WANTED_CONFIG.decayCooldown;
    if (onWantedChange) {
      onWantedChange(this.wantedStars);
    }
  }

  spawnCruiser(nearPos) {
    const cruiser = new Vehicle('POLICE', this.scene, false);
    const angle = Math.random() * Math.PI * 2;
    const dist = 55 + Math.random() * 25;
    cruiser.position.set(nearPos.x + Math.sin(angle) * dist, 0, nearPos.z + Math.cos(angle) * dist);
    cruiser.heading = angle + Math.PI;
    cruiser.velocity = 16.0;
    cruiser.group.position.copy(cruiser.position);
    this.units.push({ type: 'CRUISER', entity: cruiser });
  }

  spawnOfficer(nearPos) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 35 + Math.random() * 15;
    const officer = new PoliceOfficer(this.scene, nearPos.x + Math.sin(angle) * dist, nearPos.z + Math.cos(angle) * dist);
    this.units.push({ type: 'OFFICER', entity: officer });
  }
  update(dt, time, player, audio, onBusted, onWantedChange) {
    if (this.wantedStars <= 0) {
      audio.setSiren(false);
      return;
    }

    const playerPos = player.inVehicle ? player.inVehicle.position : player.position;

    // Siren audio when cruisers are pursuing
    const hasCruiser = this.units.some(u => u.type === 'CRUISER');
    audio.setSiren(hasCruiser);

    // Spawn reinforcements based on wanted level
    this.spawnTimer += dt;
    const interval = WANTED_CONFIG.spawnIntervals[this.wantedStars] || 8;
    const maxUnits = WANTED_CONFIG.maxCops[this.wantedStars] || 4;

    if (this.spawnTimer > interval && this.units.length < maxUnits) {
      this.spawnTimer = 0;
      if (this.wantedStars >= 2) {
        this.spawnCruiser(playerPos);
      } else {
        this.spawnOfficer(playerPos);
      }
    }

    // Update units pursuit
    let playerInSight = false;
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      if (u.type === 'CRUISER') {
        const v = u.entity;
        v.updateSiren(time);

        // Steer cruiser toward player
        const toPlayer = new THREE.Vector3().subVectors(playerPos, v.position);
        const dist = toPlayer.length();
        if (dist < WANTED_CONFIG.sightRadius) playerInSight = true;

        const targetHeading = Math.atan2(toPlayer.x, toPlayer.z);
        let angleDiff = targetHeading - v.heading;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        v.steer = Math.max(-0.6, Math.min(0.6, angleDiff));
        v.heading += v.steer * 2.2 * dt;
        v.velocity = 18.0;

        v.position.x += Math.sin(v.heading) * v.velocity * dt;
        v.position.z += Math.cos(v.heading) * v.velocity * dt;
        v.group.position.copy(v.position);
        v.group.rotation.y = v.heading;

        // Ramming damage to player car or player on foot
        if (dist < 3.2) {
          if (player.inVehicle) {
            audio.playCrash();
          } else {
            player.takeDamage(35, audio);
            if (player.health <= 0 && onBusted) onBusted('WASTED');
          }
        }
      } else if (u.type === 'OFFICER') {
        const officer = u.entity;
        if (!officer.isAlive) continue;

        const dist = officer.position.distanceTo(playerPos);
        if (dist < WANTED_CONFIG.sightRadius) playerInSight = true;

        officer.updateChase(dt, playerPos);

        // Tackle / arrest / shoot
        if (dist < 2.2) {
          player.takeDamage(20 * dt, null);
          if (player.health <= 0 && onBusted) onBusted('BUSTED');
        }
      }
    }

    // Wanted decay when out of sight
    if (!playerInSight) {
      this.decayTimer -= dt;
      if (this.decayTimer <= 0) {
        this.wantedStars = 0;
        this.units.forEach(u => {
          if (u.type === 'CRUISER') this.scene.remove(u.entity.group);
          if (u.type === 'OFFICER') this.scene.remove(u.entity.group);
        });
        this.units = [];
        audio.setSiren(false);
        if (onWantedChange) onWantedChange(0);
      }
    } else {
      this.decayTimer = WANTED_CONFIG.decayCooldown;
    }
  }
}
