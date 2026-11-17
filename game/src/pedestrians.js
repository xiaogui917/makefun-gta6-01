// Neon Tide - Pedestrian AI & Sidewalk Life
// Pedestrians of Palma Verde

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class PedestrianManager {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;
    this.pedestrians = [];

    this.skinColors = [0xd7ccc8, 0x8d6e63, 0xffccbc, 0x5d4037];
    this.shirtColors = [0xe91e63, 0x00e676, 0xffeb3b, 0x00b0ff, 0xff5722, 0x9c27b0, 0xffffff];
    this.pantColors = [0x1565c0, 0x212121, 0xeeeeee, 0x37474f, 0x4e342e];
  }

  init(world) {
    this.spawnPedestrians(world);
  }

  createPedestrianMesh(skinColor, shirtColor, pantColor) {
    const group = new THREE.Group();

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.45, 0.65, 0.28);
    const torsoMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.28, 0.3, 0.28);
    const headMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.48;
    head.castShadow = true;
    group.add(head);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.14, 0.55, 0.14);
    const armMat = new THREE.MeshLambertMaterial({ color: skinColor });

    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.32, 0.95, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.32, 0.95, 0);
    group.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2);
    const legMat = new THREE.MeshLambertMaterial({ color: pantColor });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.14, 0.33, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.14, 0.33, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    return { group, leftArm, rightArm, leftLeg, rightLeg };
  }

  spawnPedestrians(world) {
    const { GRID_BLOCKS_X, GRID_BLOCKS_Z, BLOCK_SIZE, ROAD_WIDTH } = CONFIG.WORLD;
    const pitch = BLOCK_SIZE + ROAD_WIDTH;

    for (let i = 0; i < CONFIG.PEDESTRIANS.COUNT; i++) {
      const skin = this.skinColors[i % this.skinColors.length];
      const shirt = this.shirtColors[i % this.shirtColors.length];
      const pant = this.pantColors[i % this.pantColors.length];

      const parts = this.createPedestrianMesh(skin, shirt, pant);

      // Place along sidewalk perimeters
      const gx = i % GRID_BLOCKS_X;
      const gz = Math.floor(i / GRID_BLOCKS_X) % GRID_BLOCKS_Z;
      const bx = -((GRID_BLOCKS_X * pitch) / 2) + gx * pitch + pitch / 2;
      const bz = -((GRID_BLOCKS_Z * pitch) / 2) + gz * pitch + pitch / 2;

      const side = (i % 4);
      let px = bx;
      let pz = bz;
      const offset = BLOCK_SIZE / 2 - 2;

      if (side === 0) { px += offset; pz += (Math.random() - 0.5) * BLOCK_SIZE; }
      else if (side === 1) { px -= offset; pz += (Math.random() - 0.5) * BLOCK_SIZE; }
      else if (side === 2) { pz += offset; px += (Math.random() - 0.5) * BLOCK_SIZE; }
      else { pz -= offset; px += (Math.random() - 0.5) * BLOCK_SIZE; }

      parts.group.position.set(px, 0.3, pz);
      this.scene.add(parts.group);

      const ped = {
        parts,
        group: parts.group,
        position: parts.group.position,
        rotation: Math.random() * Math.PI * 2,
        state: 'WANDER', // WANDER, PANIC, DOWNED
        health: CONFIG.PEDESTRIANS.MAX_HEALTH,
        speed: CONFIG.PEDESTRIANS.WALK_SPEED,
        walkCycle: Math.random() * 10,
        panicTimer: 0,
        hasDroppedCash: false,
      };

      this.pedestrians.push(ped);
    }
  }

  update(dt, player, vehicles, world, onCrime) {
    for (const ped of this.pedestrians) {
      if (ped.state === 'DOWNED') {
        continue;
      }

      // Check collision with player vehicle
      if (player.inVehicle && player.currentVehicle) {
        const v = player.currentVehicle;
        const dist = ped.position.distanceTo(v.position);
        if (dist < v.radius + 0.6 && Math.abs(v.speed) > 3.0) {
          // Hit by player car!
          this.downPedestrian(ped, player, onCrime);
          continue;
        }
      }

      // Check panic triggers (gunshots or fast vehicle near)
      if (ped.state === 'PANIC') {
        ped.panicTimer -= dt;
        if (ped.panicTimer <= 0) {
          ped.state = 'WANDER';
          ped.speed = CONFIG.PEDESTRIANS.WALK_SPEED;
        }
      }

      // Movement update
      const moveSpeed = ped.state === 'PANIC' ? CONFIG.PEDESTRIANS.RUN_SPEED : ped.speed;
      const moveDist = moveSpeed * dt;

      const dirX = Math.sin(ped.rotation);
      const dirZ = Math.cos(ped.rotation);

      const nextX = ped.position.x + dirX * moveDist;
      const nextZ = ped.position.z + dirZ * moveDist;

      // Obstacle collision: turn if walking into building
      if (world.checkCollision(nextX, nextZ, 0.4)) {
        ped.rotation += Math.PI * 0.75;
      } else {
        ped.position.x = nextX;
        ped.position.z = nextZ;
      }

      // Random wander redirection occasionally
      if (Math.random() < 0.015 && ped.state === 'WANDER') {
        ped.rotation += (Math.random() - 0.5) * 1.5;
      }

      // Limb animation
      ped.walkCycle += dt * (ped.state === 'PANIC' ? 18 : 8);
      ped.parts.leftLeg.rotation.x = Math.sin(ped.walkCycle) * 0.6;
      ped.parts.rightLeg.rotation.x = -Math.sin(ped.walkCycle) * 0.6;
      ped.parts.leftArm.rotation.x = -Math.sin(ped.walkCycle) * 0.5;
      ped.parts.rightArm.rotation.x = Math.sin(ped.walkCycle) * 0.5;

      ped.group.rotation.y = ped.rotation;
    }
  }

  triggerPanicNearby(point, radius = 25) {
    for (const ped of this.pedestrians) {
      if (ped.state === 'DOWNED') continue;
      if (ped.position.distanceTo(point) < radius) {
        ped.state = 'PANIC';
        ped.panicTimer = 8.0;
        // Run away from threat point
        const awayX = ped.position.x - point.x;
        const awayZ = ped.position.z - point.z;
        ped.rotation = Math.atan2(awayX, awayZ);
      }
    }
  }

  downPedestrian(ped, player, onCrime) {
    ped.state = 'DOWNED';
    ped.health = 0;
    this.audio.playCrash();

    // Ragdoll onto ground
    ped.group.rotation.x = Math.PI / 2;
    ped.group.position.y = 0.2;

    // Report hit crime
    if (onCrime) {
      onCrime('HIT_PED');
    }

    // Drop cash briefcase
    if (!ped.hasDroppedCash) {
      ped.hasDroppedCash = true;
      const cashVal = Math.floor(CONFIG.PEDESTRIANS.CASH_DROP.min + Math.random() * (CONFIG.PEDESTRIANS.CASH_DROP.max - CONFIG.PEDESTRIANS.CASH_DROP.min));
      player.cash += cashVal;
    }
  }
}
