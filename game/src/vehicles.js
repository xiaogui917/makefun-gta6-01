// Neon Tide - Vehicle Physics, 3D Models, and Traffic AI
// Fictional fleet of Palma Verde

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class VehicleManager {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;
    this.vehicles = [];

    // Shared materials for performance
    this.materials = {
      glass: new THREE.MeshLambertMaterial({ color: 0x112233, transparent: true, opacity: 0.85 }),
      tire: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
      rim: new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.8, roughness: 0.2 }),
      headlightOff: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      headlightOn: new THREE.MeshBasicMaterial({ color: 0xfff9c4 }),
      taillightOff: new THREE.MeshBasicMaterial({ color: 0x5a1010 }),
      taillightBrake: new THREE.MeshBasicMaterial({ color: 0xff1744 }),
      policeRed: new THREE.MeshBasicMaterial({ color: 0xff1744 }),
      policeBlue: new THREE.MeshBasicMaterial({ color: 0x2979ff }),
      policeWhite: new THREE.MeshLambertMaterial({ color: 0xffffff }),
      policeBlack: new THREE.MeshLambertMaterial({ color: 0x111111 }),
      bumper: new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.5, roughness: 0.5 }),
      taxiSign: new THREE.MeshBasicMaterial({ color: 0xffea00 }),
    };
  }

  init() {
    this.spawnParkedCars();
    this.spawnTrafficCars();
  }

  createVehicle(typeKey, x, z, rotation = 0, isPolice = false) {
    const preset = CONFIG.VEHICLES[typeKey.toUpperCase()] || CONFIG.VEHICLES.SEDAN;
    const group = new THREE.Group();

    // Pick body color
    let bodyColor = preset.colors[Math.floor(Math.random() * preset.colors.length)];
    const bodyMat = isPolice
      ? this.materials.policeBlack
      : new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.35, metalness: 0.4 });

    // Chassis dimensions
    const isSport = preset.type === 'sport';
    const isVan = preset.type === 'van';
    const length = isSport ? 4.4 : isVan ? 5.2 : 4.6;
    const width = isSport ? 2.1 : 2.0;
    const height = isSport ? 0.9 : isVan ? 1.8 : 1.1;

    // Main lower body
    const bodyGeo = new THREE.BoxGeometry(width, height * 0.6, length);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = height * 0.45;
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Cabin / Windows
    const cabinH = isVan ? height * 0.65 : height * 0.55;
    const cabinL = isSport ? length * 0.45 : isVan ? length * 0.75 : length * 0.52;
    const cabinW = width * 0.88;
    const cabinGeo = new THREE.BoxGeometry(cabinW, cabinH, cabinL);
    const cabinMesh = new THREE.Mesh(cabinGeo, this.materials.glass);
    const cabinZOffset = isSport ? -0.2 : isVan ? -0.2 : -0.1;
    cabinMesh.position.set(0, height * 0.75 + cabinH * 0.4, cabinZOffset);
    cabinMesh.castShadow = true;
    group.add(cabinMesh);

    // Police Cruiser White Doors
    if (isPolice) {
      const doorGeo = new THREE.BoxGeometry(width + 0.02, height * 0.5, length * 0.35);
      const doorMesh = new THREE.Mesh(doorGeo, this.materials.policeWhite);
      doorMesh.position.set(0, height * 0.45, -0.1);
      group.add(doorMesh);

      // Lightbar on roof
      const barGeo = new THREE.BoxGeometry(width * 0.65, 0.18, 0.35);
      const barMesh = new THREE.Mesh(barGeo, this.materials.policeBlue);
      barMesh.position.set(0, height * 0.75 + cabinH + 0.12, cabinZOffset);
      group.add(barMesh);

      // Red/Blue strobe halves
      const redHalf = new THREE.Mesh(new THREE.BoxGeometry(width * 0.3, 0.16, 0.3), this.materials.policeRed);
      redHalf.position.set(-width * 0.16, height * 0.75 + cabinH + 0.12, cabinZOffset);
      group.add(redHalf);

      const blueHalf = new THREE.Mesh(new THREE.BoxGeometry(width * 0.3, 0.16, 0.3), this.materials.policeBlue);
      blueHalf.position.set(width * 0.16, height * 0.75 + cabinH + 0.12, cabinZOffset);
      group.add(blueHalf);

      group.userData.redHalf = redHalf;
      group.userData.blueHalf = blueHalf;
    }

    // Taxi Roof Sign
    if (preset.type === 'taxi') {
      const signGeo = new THREE.BoxGeometry(0.8, 0.22, 0.3);
      const signMesh = new THREE.Mesh(signGeo, this.materials.taxiSign);
      signMesh.position.set(0, height * 0.75 + cabinH + 0.12, cabinZOffset);
      group.add(signMesh);
    }

    // Sport car rear wing
    if (isSport) {
      const wingGeo = new THREE.BoxGeometry(width * 0.95, 0.08, 0.45);
      const wingMesh = new THREE.Mesh(wingGeo, bodyMat);
      wingMesh.position.set(0, height * 0.85, -length * 0.42);
      group.add(wingMesh);
    }

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.18, 0.1);
    const hlLeft = new THREE.Mesh(hlGeo, this.materials.headlightOn);
    hlLeft.position.set(-width * 0.36, height * 0.45, length * 0.5 + 0.02);
    group.add(hlLeft);

    const hlRight = new THREE.Mesh(hlGeo, this.materials.headlightOn);
    hlRight.position.set(width * 0.36, height * 0.45, length * 0.5 + 0.02);
    group.add(hlRight);

    // Taillights
    const tlGeo = new THREE.BoxGeometry(0.35, 0.18, 0.1);
    const tlLeft = new THREE.Mesh(tlGeo, this.materials.taillightOff);
    tlLeft.position.set(-width * 0.36, height * 0.45, -length * 0.5 - 0.02);
    group.add(tlLeft);

    const tlRight = new THREE.Mesh(tlGeo, this.materials.taillightOff);
    tlRight.position.set(width * 0.36, height * 0.45, -length * 0.5 - 0.02);
    group.add(tlRight);

    // 4 Wheels with rims
    const wheels = [];
    const wheelR = 0.38;
    const wheelW = 0.28;
    const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 14);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [
      { x: -width * 0.5, y: wheelR, z: length * 0.32, isFront: true },  // Front-left
      { x: width * 0.5, y: wheelR, z: length * 0.32, isFront: true },   // Front-right
      { x: -width * 0.5, y: wheelR, z: -length * 0.32, isFront: false },// Rear-left
      { x: width * 0.5, y: wheelR, z: -length * 0.32, isFront: false }, // Rear-right
    ];

    for (const wp of wheelPositions) {
      const wheelHolder = new THREE.Group();
      wheelHolder.position.set(wp.x, wp.y, wp.z);

      const wheelMesh = new THREE.Mesh(wheelGeo, this.materials.tire);
      wheelMesh.castShadow = true;
      wheelHolder.add(wheelMesh);

      // Chrome rim hubcap
      const rimGeo = new THREE.CylinderGeometry(wheelR * 0.6, wheelR * 0.6, wheelW + 0.02, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, this.materials.rim);
      wheelHolder.add(rimMesh);

      group.add(wheelHolder);
      wheels.push({
        holder: wheelHolder,
        mesh: wheelMesh,
        isFront: wp.isFront,
      });
    }

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    this.scene.add(group);

    const vehicle = {
      preset,
      group,
      wheels,
      tlLeft,
      tlRight,
      position: group.position,
      rotation: rotation,
      speed: 0,
      steeringAngle: 0,
      angularVelocity: 0,
      health: preset.health,
      maxHealth: preset.health,
      isDrivenByPlayer: false,
      isPolice: isPolice,
      isParked: false,
      isWrecked: false,
      radius: length * 0.45,
      length: length,
      width: width,
      sirenActive: false,
      strobeTimer: 0,

      // Traffic AI state
      trafficTarget: null,
      trafficWaypoints: [],
      waypointIndex: 0,
    };

    this.vehicles.push(vehicle);
    return vehicle;
  }

  spawnParkedCars() {
    // Parked cars stationed at curbs & mission locations
    const parkedSpots = [
      { type: 'sport', x: -30, z: -40, rot: Math.PI / 2 },   // Mission 1 target Vipera GT
      { type: 'sedan', x: -80, z: 60, rot: 0 },
      { type: 'sport', x: -210, z: 20, rot: -Math.PI / 2 },  // Coastal sports car
      { type: 'taxi', x: 20, z: -80, rot: Math.PI },
      { type: 'van', x: 190, z: 80, rot: 0 },               // Harbor van
      { type: 'sedan', x: 110, z: -140, rot: Math.PI / 2 },
      { type: 'sport', x: -160, z: -160, rot: 0 },
    ];

    for (const spot of parkedSpots) {
      const v = this.createVehicle(spot.type, spot.x, spot.z, spot.rot, false);
      v.isParked = true;
    }
  }

  spawnTrafficCars() {
    // Spawn civilian traffic cruising on road corridors
    const { GRID_BLOCKS_X, GRID_BLOCKS_Z, BLOCK_SIZE, ROAD_WIDTH } = CONFIG.WORLD;
    const pitch = BLOCK_SIZE + ROAD_WIDTH;
    const types = ['sedan', 'taxi', 'van', 'sport'];

    for (let i = 0; i < CONFIG.TRAFFIC.COUNT; i++) {
      const isVertical = i % 2 === 0;
      const lane = (i % 2 === 0 ? 1 : -1) * CONFIG.TRAFFIC.LANE_OFFSET;

      let x, z, rot;
      if (isVertical) {
        const roadIdx = (i % (GRID_BLOCKS_X + 1));
        x = -((GRID_BLOCKS_X * pitch) / 2) + roadIdx * pitch + lane;
        z = ((i * 37) % 360) - 180;
        rot = lane > 0 ? 0 : Math.PI;
      } else {
        const roadIdx = (i % (GRID_BLOCKS_Z + 1));
        z = -((GRID_BLOCKS_Z * pitch) / 2) + roadIdx * pitch + lane;
        x = ((i * 43) % 360) - 180;
        rot = lane > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      const type = types[i % types.length];
      const v = this.createVehicle(type, x, z, rot, false);
      v.speed = CONFIG.TRAFFIC.CRUISE_SPEED * (0.8 + Math.random() * 0.4);
    }
  }

  update(dt, input, world, player) {
    let playerVehicleSoundActive = false;

    for (const v of this.vehicles) {
      if (v.isWrecked) continue;

      if (v.isDrivenByPlayer) {
        this.updatePlayerDriver(v, dt, input, world);
        playerVehicleSoundActive = true;
      } else if (!v.isParked) {
        this.updateTrafficAI(v, dt, world, player);
      }

      // Wheels animation
      const wheelSpin = (v.speed / 0.38) * dt;
      for (const w of v.wheels) {
        w.mesh.rotation.x += wheelSpin;
        if (w.isFront) {
          w.holder.rotation.y = v.steeringAngle;
        }
      }

      // Police Strobe Flash
      if (v.isPolice && (v.sirenActive || v.group.userData.redHalf)) {
        v.strobeTimer += dt * 10;
        const flash = Math.sin(v.strobeTimer) > 0;
        if (v.group.userData.redHalf) {
          v.group.userData.redHalf.visible = flash;
          v.group.userData.blueHalf.visible = !flash;
        }
      }

      // Sync 3D group transform
      v.group.position.copy(v.position);
      v.group.rotation.y = v.rotation;
    }

    // Engine Audio update
    if (player.inVehicle && player.currentVehicle) {
      const v = player.currentVehicle;
      const speedRatio = Math.min(Math.abs(v.speed) / v.preset.topSpeed, 1.0);
      const isAccel = input.isForward() || input.isBackward();
      this.audio.updateEngine(speedRatio, isAccel);
    } else if (!player.inVehicle) {
      this.audio.stopEngine();
    }
  }

  updatePlayerDriver(v, dt, input, world) {
    const preset = v.preset;
    const isHandbrake = input.isHandbrake();

    // Throttle / Accel & Brake
    if (input.isForward()) {
      v.speed = Math.min(preset.topSpeed, v.speed + preset.accel * dt);
      v.tlLeft.material = this.materials.taillightOff;
      v.tlRight.material = this.materials.taillightOff;
    } else if (input.isBackward()) {
      if (v.speed > 1.0) {
        // Foot brake
        v.speed = Math.max(0, v.speed - preset.brake * dt);
        v.tlLeft.material = this.materials.taillightBrake;
        v.tlRight.material = this.materials.taillightBrake;
      } else {
        // Reverse
        v.speed = Math.max(-preset.reverseSpeed, v.speed - preset.accel * 0.7 * dt);
      }
    } else {
      // Natural rolling friction
      if (v.speed > 0) v.speed = Math.max(0, v.speed - 6.5 * dt);
      else if (v.speed < 0) v.speed = Math.min(0, v.speed + 6.5 * dt);
      v.tlLeft.material = this.materials.taillightOff;
      v.tlRight.material = this.materials.taillightOff;
    }

    // Handbrake
    if (isHandbrake) {
      v.speed = THREE.MathUtils.lerp(v.speed, 0, dt * 2.8);
      v.tlLeft.material = this.materials.taillightBrake;
      v.tlRight.material = this.materials.taillightBrake;
    }

    // Steering
    const targetSteer = input.isLeft() ? 0.55 : input.isRight() ? -0.55 : 0;
    v.steeringAngle = THREE.MathUtils.lerp(v.steeringAngle, targetSteer, dt * 10);

    // Apply rotation based on speed and steering angle
    if (Math.abs(v.speed) > 0.1) {
      const turnMultiplier = isHandbrake ? preset.handbrakeDrift : 1.0;
      const turnDir = v.speed >= 0 ? 1 : -1;
      v.rotation += v.steeringAngle * preset.steerSpeed * turnMultiplier * (v.speed / preset.topSpeed) * dt * turnDir;
    }

    // Move forward in vehicle heading
    const moveDist = v.speed * dt;
    const forwardX = Math.sin(v.rotation);
    const forwardZ = Math.cos(v.rotation);

    const nextX = v.position.x + forwardX * moveDist;
    const nextZ = v.position.z + forwardZ * moveDist;

    // Check world building collisions
    const col = world.checkCollision(nextX, nextZ, v.radius);
    if (col) {
      // Bounce and collision damage
      v.speed = -v.speed * 0.35;
      v.health -= Math.abs(v.speed) * 0.8;
      this.audio.playCrash();
    } else {
      v.position.x = nextX;
      v.position.z = nextZ;
    }

    // Vehicle boundary clamp
    v.position.x = Math.max(-280, Math.min(280, v.position.x));
    v.position.z = Math.max(-280, Math.min(280, v.position.z));
  }

  updateTrafficAI(v, dt, world, player) {
    // Traffic moves straight along current heading
    const moveDist = v.speed * dt;
    const forwardX = Math.sin(v.rotation);
    const forwardZ = Math.cos(v.rotation);

    const nextX = v.position.x + forwardX * moveDist;
    const nextZ = v.position.z + forwardZ * moveDist;

    // If approaching city border, wrap around or turn
    if (Math.abs(nextX) > 270 || Math.abs(nextZ) > 270) {
      v.rotation += Math.PI;
      return;
    }

    // Check collision with buildings
    if (world.checkCollision(nextX, nextZ, v.radius)) {
      v.rotation += Math.PI / 2;
      return;
    }

    // Simple forward vehicle yield (avoid crashing into car ahead)
    let shouldYield = false;
    for (const other of this.vehicles) {
      if (other === v) continue;
      const dist = v.position.distanceTo(other.position);
      if (dist < CONFIG.TRAFFIC.FOLLOW_DISTANCE) {
        // Dot product to check if other is ahead
        const toOtherX = other.position.x - v.position.x;
        const toOtherZ = other.position.z - v.position.z;
        const ahead = toOtherX * forwardX + toOtherZ * forwardZ;
        if (ahead > 0) {
          shouldYield = true;
          break;
        }
      }
    }

    if (shouldYield) {
      v.speed = Math.max(0, v.speed - 12 * dt);
    } else {
      v.speed = Math.min(CONFIG.TRAFFIC.CRUISE_SPEED, v.speed + 6 * dt);
      v.position.x = nextX;
      v.position.z = nextZ;
    }
  }
}
