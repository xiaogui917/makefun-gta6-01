// Neon Tide - Pedestrians, Sidewalk AI Wandering, Panic & Hit Reactions
import * as THREE from 'three';
import { WORLD_CONFIG } from './config.js';

export class Pedestrian {
  constructor(scene, world, x, z) {
    this.scene = scene;
    this.world = world;

    this.position = new THREE.Vector3(x, 0, z);
    this.rotation = Math.random() * Math.PI * 2;
    this.speed = 1.8 + Math.random() * 1.4;
    this.state = 'WALKING'; // WALKING, PANICKED, KNOCKED_DOWN
    this.animTime = Math.random() * 10;
    this.health = 40;
    this.knockedTimer = 0;

    this.mesh = this.buildPedestrianMesh();
    this.scene.add(this.mesh);
    this.updateMeshTransform();
  }

  buildPedestrianMesh() {
    const group = new THREE.Group();
    const shirtColors = [0xff4488, 0x44ddaa, 0xffbb33, 0x9955ee, 0x33bbee, 0xeeeeee];
    const shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.32);
    const torsoMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.36, 0.38, 0.36);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.72;
    head.castShadow = true;
    group.add(head);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.75, 0.25);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.16, 0.38, 0);
    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.16, 0.38, 0);
    group.add(this.leftLeg);
    group.add(this.rightLeg);

    return group;
  }
  update(dt, playerPos, dangerPos) {
    if (this.state === 'KNOCKED_DOWN') {
      this.knockedTimer += dt;
      if (this.knockedTimer > 15) {
        // Recover after 15s
        this.state = 'WALKING';
        this.mesh.rotation.z = 0;
        this.knockedTimer = 0;
      }
      return;
    }

    // Panic check: danger nearby (e.g. gunfire, speeding car)
    if (dangerPos && this.position.distanceTo(dangerPos) < 18) {
      this.state = 'PANICKED';
      const away = new THREE.Vector3().subVectors(this.position, dangerPos);
      this.rotation = Math.atan2(away.x, away.z);
    }

    const currentSpeed = this.state === 'PANICKED' ? this.speed * 2.6 : this.speed;
    const moveX = Math.sin(this.rotation) * currentSpeed * dt;
    const moveZ = Math.cos(this.rotation) * currentSpeed * dt;

    // Boundary & collision avoidance
    const nextX = this.position.x + moveX;
    const nextZ = this.position.z + moveZ;
    if (this.world.checkCollision(nextX, nextZ, 0.4)) {
      this.rotation += Math.PI * 0.7; // Turn around
    } else {
      this.position.x = nextX;
      this.position.z = nextZ;
    }

    // Walking stride animation
    this.animTime += dt * (this.state === 'PANICKED' ? 14 : 7);
    this.leftLeg.rotation.x = Math.sin(this.animTime) * 0.55;
    this.rightLeg.rotation.x = -Math.sin(this.animTime) * 0.55;

    this.updateMeshTransform();
  }

  takeHit(damage = 30) {
    this.health -= damage;
    if (this.health <= 0) {
      this.state = 'KNOCKED_DOWN';
      this.mesh.rotation.z = Math.PI / 2; // Lie on ground
      this.mesh.position.y = 0.2;
      return true; // Knocked down
    }
    this.state = 'PANICKED';
    return false;
  }

  updateMeshTransform() {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }
}
export class PedestrianManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.pedestrians = [];

    this.spawnPedestrians();
  }

  spawnPedestrians() {
    const { CITY_SIZE } = WORLD_CONFIG;
    const half = CITY_SIZE / 2 - 30;

    for (let i = 0; i < 35; i++) {
      const x = (Math.random() * 2 - 1) * half;
      const z = (Math.random() * 2 - 1) * half;
      const ped = new Pedestrian(this.scene, this.world, x, z);
      this.pedestrians.push(ped);
    }
  }

  triggerPanicAt(pos) {
    for (const ped of this.pedestrians) {
      if (ped.position.distanceTo(pos) < 22) {
        ped.state = 'PANICKED';
        const away = new THREE.Vector3().subVectors(ped.position, pos);
        ped.rotation = Math.atan2(away.x, away.z);
      }
    }
  }

  checkVehicleCollisions(vehicles) {
    let hitCount = 0;
    for (const v of vehicles) {
      if (Math.abs(v.velocity) < 3.5) continue;
      for (const ped of this.pedestrians) {
        if (ped.state === 'KNOCKED_DOWN') continue;
        if (ped.position.distanceTo(v.position) < 2.2) {
          const wasKnocked = ped.takeHit(50);
          if (wasKnocked) hitCount++;
        }
      }
    }
    return hitCount;
  }

  update(dt, playerPos, dangerPos) {
    for (const ped of this.pedestrians) {
      ped.update(dt, playerPos, dangerPos);
    }
  }
}
