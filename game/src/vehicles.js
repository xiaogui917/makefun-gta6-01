// Neon Tide - 3D Vehicles, Car Physics, AI City Traffic & Stealing System
import * as THREE from 'three';
import { VEHICLE_CONFIG, WORLD_CONFIG } from './config.js';

export class Vehicle {
  constructor(scene, world, configKey, x, z, rotation = 0) {
    this.scene = scene;
    this.world = world;
    this.config = VEHICLE_CONFIG[configKey] || VEHICLE_CONFIG.SEDAN;

    this.position = new THREE.Vector3(x, 0, z);
    this.velocity = 0;
    this.steering = 0;
    this.rotation = rotation;
    this.isHandbraking = false;

    this.driver = null; // Player or null / AI
    this.isPolice = !!this.config.isPolice;
    this.sirenActive = false;
    this.sirenTimer = 0;

    // AI navigation properties
    this.isAI = true;
    this.targetCoord = null;
    this.currentRoadAxis = Math.random() > 0.5 ? 'X' : 'Z';
    this.roadDirection = Math.random() > 0.5 ? 1 : -1;
    this.aiSpeed = 12 + Math.random() * 8;

    this.mesh = this.buildVehicleMesh();
    this.scene.add(this.mesh);
    this.updateMeshTransform();
  }
  buildVehicleMesh() {
    const group = new THREE.Group();
    const { length, width, height, colors } = this.config;
    const bodyColor = colors[Math.floor(Math.random() * colors.length)];

    // Main Chassis
    const bodyGeo = new THREE.BoxGeometry(width, height * 0.55, length);
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = height * 0.45;
    body.castShadow = true;
    group.add(body);

    // Cabin / Windows
    const cabinGeo = new THREE.BoxGeometry(width * 0.85, height * 0.45, length * 0.55);
    const glassMat = new THREE.MeshPhongMaterial({ color: 0x111622, specular: 0x00f0ff, shininess: 80 });
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, height * 0.85, -length * 0.05);
    cabin.castShadow = true;
    group.add(cabin);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const wheelX = width * 0.52;
    const wheelZ = length * 0.32;
    [
      [-wheelX, wheelZ], [wheelX, wheelZ],
      [-wheelX, -wheelZ], [wheelX, -wheelZ]
    ].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.38, wz);
      group.add(wheel);
    });

    // Headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffea });
    const hlGeo = new THREE.BoxGeometry(0.35, 0.18, 0.1);
    const hlL = new THREE.Mesh(hlGeo, hlMat);
    hlL.position.set(-width * 0.35, height * 0.48, length * 0.51);
    const hlR = new THREE.Mesh(hlGeo, hlMat);
    hlR.position.set(width * 0.35, height * 0.48, length * 0.51);
    group.add(hlL);
    group.add(hlR);

    // Taillights
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const tlL = new THREE.Mesh(hlGeo, tlMat);
    tlL.position.set(-width * 0.35, height * 0.48, -length * 0.51);
    const tlR = new THREE.Mesh(hlGeo, tlMat);
    tlR.position.set(width * 0.35, height * 0.48, -length * 0.51);
    group.add(tlL);
    group.add(tlR);

    // Props: Police Lightbar or Taxi Roof Sign
    if (this.isPolice) {
      this.sirenMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
      this.sirenMeshL.position.set(-0.35, height * 1.15, -length * 0.05);
      group.add(this.sirenMeshL);

      this.sirenMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0x0044ff }));
      this.sirenMeshR.position.set(0.35, height * 1.15, -length * 0.05);
      group.add(this.sirenMeshR);
    } else if (this.config.type === 'taxi') {
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.3), new THREE.MeshBasicMaterial({ color: 0xfff099 }));
      taxiSign.position.set(0, height * 1.15, -length * 0.05);
      group.add(taxiSign);
    }

    return group;
  }
  update(dt, input, allVehicles) {
    if (this.driver) {
      this.isAI = false;
      this.updatePlayerDriving(dt, input);
    } else if (this.isAI) {
      this.updateAITraffic(dt, allVehicles);
    }

    // World collision
    const col = this.world.checkCollision(this.position.x, this.position.z, this.config.width * 0.7);
    if (col) {
      this.velocity *= -0.4;
      this.position.x += Math.sin(this.rotation) * this.velocity * dt * 2;
      this.position.z += Math.cos(this.rotation) * this.velocity * dt * 2;
    }

    // Police flashing lights
    if (this.isPolice && this.sirenActive) {
      this.sirenTimer += dt * 8;
      const flash = Math.sin(this.sirenTimer) > 0;
      if (this.sirenMeshL) this.sirenMeshL.material.color.setHex(flash ? 0xff0000 : 0x220000);
      if (this.sirenMeshR) this.sirenMeshR.material.color.setHex(flash ? 0x000022 : 0x0044ff);
    }

    this.updateMeshTransform();
  }

  updatePlayerDriving(dt, input) {
    const { accel, brake, maxSpeed, turnSpeed } = this.config;
    this.isHandbraking = input.isDown('Space');

    // Acceleration & Reverse
    if (input.isDown('KeyW')) {
      this.velocity = Math.min(maxSpeed, this.velocity + accel * dt);
    } else if (input.isDown('KeyS')) {
      if (this.velocity > 1) {
        this.velocity = Math.max(0, this.velocity - brake * dt * 1.5); // brake
      } else {
        this.velocity = Math.max(-maxSpeed * 0.45, this.velocity - accel * 0.7 * dt); // reverse
      }
    } else {
      // Natural rolling friction
      this.velocity *= Math.pow(0.88, dt * 10);
      if (Math.abs(this.velocity) < 0.2) this.velocity = 0;
    }

    if (this.isHandbraking) {
      this.velocity *= Math.pow(0.55, dt * 10);
    }

    // Steering
    let steerInput = 0;
    if (input.isDown('KeyA')) steerInput += 1;
    if (input.isDown('KeyD')) steerInput -= 1;

    if (Math.abs(this.velocity) > 0.5) {
      const dir = this.velocity >= 0 ? 1 : -1;
      const turnMultiplier = this.isHandbraking ? 1.6 : 1.0;
      this.rotation += steerInput * turnSpeed * turnMultiplier * dt * dir * (Math.abs(this.velocity) / maxSpeed);
    }

    // Move forward in facing direction
    this.position.x += Math.sin(this.rotation) * this.velocity * dt;
    this.position.z += Math.cos(this.rotation) * this.velocity * dt;
  }
  updateAITraffic(dt, allVehicles) {
    // Check for vehicle ahead to brake
    let blocked = false;
    for (const other of allVehicles) {
      if (other === this) continue;
      const dist = this.position.distanceTo(other.position);
      if (dist < 8.0) {
        const toOther = new THREE.Vector3().subVectors(other.position, this.position);
        const forward = new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
        if (forward.dot(toOther.normalize()) > 0.65) {
          blocked = true;
          break;
        }
      }
    }

    if (blocked) {
      this.velocity = Math.max(0, this.velocity - 22 * dt);
    } else {
      this.velocity = Math.min(this.aiSpeed, this.velocity + 12 * dt);
    }

    // Drive in straight line along current road
    this.position.x += Math.sin(this.rotation) * this.velocity * dt;
    this.position.z += Math.cos(this.rotation) * this.velocity * dt;

    // Turn at boundaries or random intersections
    const half = WORLD_CONFIG.CITY_SIZE / 2 - 25;
    if (Math.abs(this.position.x) > half || Math.abs(this.position.z) > half) {
      this.rotation += Math.PI;
      this.position.x = Math.max(-half, Math.min(half, this.position.x));
      this.position.z = Math.max(-half, Math.min(half, this.position.z));
    }
  }

  updateMeshTransform() {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }

  getSpeedMPH() {
    return Math.round(Math.abs(this.velocity) * 2.236);
  }
}
export class VehicleManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.vehicles = [];

    this.spawnInitialFleet();
  }

  spawnInitialFleet() {
    const keys = ['SPORTS', 'SEDAN', 'TAXI', 'TRUCK', 'POLICE'];
    const roadsX = this.world.roadCoordsX || [-200, -100, 0, 100, 200];
    const roadsZ = this.world.roadCoordsZ || [-200, -100, 0, 100, 200];

    // Spawn 18 ambient traffic cars along road lanes
    for (let i = 0; i < 18; i++) {
      const k = keys[i % keys.length];
      const isXRoad = i % 2 === 0;
      const roadCoord = (isXRoad ? roadsZ : roadsX)[i % roadsZ.length];
      const laneOffset = i % 4 < 2 ? 4.5 : -4.5;
      const along = (Math.random() * 2 - 1) * (WORLD_CONFIG.CITY_SIZE / 2 - 40);

      const x = isXRoad ? along : roadCoord + laneOffset;
      const z = isXRoad ? roadCoord + laneOffset : along;
      const rot = isXRoad ? (laneOffset > 0 ? Math.PI / 2 : -Math.PI / 2) : (laneOffset > 0 ? 0 : Math.PI);

      const v = new Vehicle(this.scene, this.world, k, x, z, rot);
      this.vehicles.push(v);
    }

    // Spawn 4 parked stealable sports cars outside hotels
    const sportsParked = [
      { x: -140, z: 70, rot: 0 },
      { x: -140, z: -50, rot: Math.PI / 2 },
      { x: 30, z: 95, rot: 0 },
      { x: 80, z: -110, rot: Math.PI }
    ];
    sportsParked.forEach(p => {
      const v = new Vehicle(this.scene, this.world, 'SPORTS', p.x, p.z, p.rot);
      v.isAI = false;
      this.vehicles.push(v);
    });
  }

  findNearestVehicle(pos, maxDist = 4.0) {
    let nearest = null;
    let minDist = maxDist;
    for (const v of this.vehicles) {
      const d = pos.distanceTo(v.position);
      if (d < minDist) {
        minDist = d;
        nearest = v;
      }
    }
    return nearest;
  }

  update(dt, input) {
    for (const v of this.vehicles) {
      v.update(dt, input, this.vehicles);
    }
  }
}
