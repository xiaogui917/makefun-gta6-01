// Pedestrian AI and management for Neon Tide
import * as THREE from 'three';
import { HALF_SPAN, BLOCK_SIZE, ROAD_WIDTH, BLOCK_COUNT } from './config.js';

export class Pedestrian {
  constructor(scene, x, z) {
    this.scene = scene;
    this.position = new THREE.Vector3(x, 0, z);
    this.heading = Math.random() * Math.PI * 2;
    this.speed = 1.4 + Math.random() * 0.8;
    this.panicked = false;
    this.panicTimer = 0;
    this.health = 25;
    this.isAlive = true;
    this.walkCycle = Math.random() * 10;

    this.group = new THREE.Group();
    this.buildMesh();
    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  buildMesh() {
    const shirtColors = [0xff6b6b, 0x48dbfb, 0x1dd1a1, 0xfeca57, 0xff9ff3, 0x54a0ff];
    const sCol = shirtColors[Math.floor(Math.random() * shirtColors.length)];

    // Torso
    const tGeo = new THREE.BoxGeometry(0.6, 0.8, 0.35);
    const tMat = new THREE.MeshLambertMaterial({ color: sCol });
    const torso = new THREE.Mesh(tGeo, tMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    this.group.add(torso);

    // Head
    const hGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    const hMat = new THREE.MeshLambertMaterial({ color: 0xffd1b3 });
    const head = new THREE.Mesh(hGeo, hMat);
    head.position.y = 1.55;
    head.castShadow = true;
    this.group.add(head);
    // Legs
    const lMat = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
    const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);
    this.lLeg = new THREE.Mesh(legGeo, lMat);
    this.lLeg.position.set(-0.18, 0.38, 0);
    this.group.add(this.lLeg);

    this.rLeg = new THREE.Mesh(legGeo, lMat);
    this.rLeg.position.set(0.18, 0.38, 0);
    this.group.add(this.rLeg);
  }

  triggerPanic(fromPos) {
    this.panicked = true;
    this.panicTimer = 6.0;
    this.speed = 5.2; // sprint away
    const awayAngle = Math.atan2(this.position.x - fromPos.x, this.position.z - fromPos.z);
    this.heading = awayAngle + (Math.random() - 0.5) * 0.5;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isAlive = false;
      this.group.rotation.x = Math.PI / 2;
      this.group.position.y = 0.2;
    }
  }

  update(dt) {
    if (!this.isAlive) return;

    if (this.panicked) {
      this.panicTimer -= dt;
      if (this.panicTimer <= 0) {
        this.panicked = false;
        this.speed = 1.6;
      }
    } else {
      // Occasional gentle wander
      if (Math.random() < 0.02) {
        this.heading += (Math.random() - 0.5) * 0.8;
      }
    }

    const dx = Math.sin(this.heading) * this.speed * dt;
    const dz = Math.cos(this.heading) * this.speed * dt;
    this.position.x += dx;
    this.position.z += dz;

    // Boundaries
    if (Math.abs(this.position.x) > HALF_SPAN + 10 || Math.abs(this.position.z) > HALF_SPAN + 10) {
      this.heading += Math.PI;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;

    // Leg walk cycle
    this.walkCycle += dt * (this.panicked ? 14 : 7);
    const swing = Math.sin(this.walkCycle) * 0.5;
    this.lLeg.rotation.x = swing;
    this.rLeg.rotation.x = -swing;
  }
}
export class PedestrianManager {
  constructor(scene) {
    this.scene = scene;
    this.pedestrians = [];
    this.spawnPedestrians();
  }

  spawnPedestrians() {
    const pitch = BLOCK_SIZE + ROAD_WIDTH;
    let count = 0;
    for (let i = 0; i < BLOCK_COUNT; i++) {
      for (let j = 0; j < BLOCK_COUNT; j++) {
        if (count >= 24) break;
        const cx = -HALF_SPAN + ROAD_WIDTH / 2 + BLOCK_SIZE / 2 + i * pitch;
        const cz = -HALF_SPAN + ROAD_WIDTH / 2 + BLOCK_SIZE / 2 + j * pitch;
        // Place along block sidewalk perimeter
        const px = cx + (Math.random() - 0.5) * (BLOCK_SIZE - 6);
        const pz = cz + (Math.random() - 0.5) * (BLOCK_SIZE - 6);
        const ped = new Pedestrian(this.scene, px, pz);
        this.pedestrians.push(ped);
        count++;
      }
    }
  }

  alertNearby(sourcePos, radius = 30) {
    this.pedestrians.forEach((p) => {
      if (p.isAlive && p.position.distanceTo(sourcePos) < radius) {
        p.triggerPanic(sourcePos);
      }
    });
  }

  update(dt, player, onHitPedestrian) {
    const playerPos = player.inVehicle ? player.inVehicle.position : player.position;
    const isPlayerInCar = !!player.inVehicle;
    const carSpeed = isPlayerInCar ? Math.abs(player.inVehicle.velocity) : 0;

    this.pedestrians.forEach((p) => {
      if (!p.isAlive) return;

      p.update(dt);

      // Check collision with player vehicle (hit-and-run)
      if (isPlayerInCar && carSpeed > 3.0) {
        const dist = playerPos.distanceTo(p.position);
        if (dist < 2.2) {
          p.takeDamage(100);
          if (onHitPedestrian) onHitPedestrian(p);
        }
      }
    });
  }
}
