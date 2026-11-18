// Vehicle system and traffic for Neon Tide
import * as THREE from 'three';
import { VEHICLE_TYPES, HALF_SPAN, BLOCK_SIZE, ROAD_WIDTH, BLOCK_COUNT } from './config.js';

export class Vehicle {
  constructor(typeKey, scene, isTraffic = false) {
    this.typeKey = typeKey;
    this.type = VEHICLE_TYPES[typeKey] || VEHICLE_TYPES.SEDAN;
    this.scene = scene;
    this.isTraffic = isTraffic;

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = 0; // forward/backward scalar
    this.steer = 0;
    this.heading = 0; // rotation Y
    this.health = 100;
    this.driver = null; // player or npc
    this.sirenActive = (typeKey === 'POLICE');

    this.group = new THREE.Group();
    this.wheels = [];
    this.lightbar = null;
    this.buildMesh();
    this.scene.add(this.group);
  }

  buildMesh() {
    const t = this.type;
    // Lower body / chassis
    const bodyGeo = new THREE.BoxGeometry(t.width, t.height * 0.45, t.length);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: t.bodyColor,
      specular: 0x555555,
      shininess: 40,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = t.height * 0.35;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);
    // Cabin / Roof
    const cabinWidth = t.width * 0.88;
    const cabinHeight = t.height * 0.55;
    const cabinLength = t.length * 0.52;
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const glassMat = new THREE.MeshPhongMaterial({
      color: 0x111622,
      specular: 0x88bbff,
      shininess: 90,
      transparent: true,
      opacity: 0.85,
    });
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, t.height * 0.75, -t.length * 0.05);
    cabin.castShadow = true;
    this.group.add(cabin);

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.16, 0.1);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlL = new THREE.Mesh(hlGeo, hlMat);
    hlL.position.set(-t.width * 0.35, t.height * 0.35, t.length * 0.5 + 0.02);
    const hlR = new THREE.Mesh(hlGeo, hlMat);
    hlR.position.set(t.width * 0.35, t.height * 0.35, t.length * 0.5 + 0.02);
    this.group.add(hlL);
    this.group.add(hlR);

    // Taillights
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });
    const tlL = new THREE.Mesh(hlGeo, tlMat);
    tlL.position.set(-t.width * 0.35, t.height * 0.35, -t.length * 0.5 - 0.02);
    const tlR = new THREE.Mesh(hlGeo, tlMat);
    tlR.position.set(t.width * 0.35, t.height * 0.35, -t.length * 0.5 - 0.02);
    this.group.add(tlL);
    this.group.add(tlR);
    // Police Lightbar
    if (this.typeKey === 'POLICE') {
      const barGroup = new THREE.Group();
      const redMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
      const blueMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });
      const sirenL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.25), redMat);
      sirenL.position.set(-0.35, 0, 0);
      const sirenR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.25), blueMat);
      sirenR.position.set(0.35, 0, 0);
      barGroup.add(sirenL);
      barGroup.add(sirenR);
      barGroup.position.set(0, t.height * 1.08, -t.length * 0.05);
      this.group.add(barGroup);
      this.lightbar = { group: barGroup, sirenL, sirenR, redMat, blueMat };
    }

    // Taxi Sign
    if (this.typeKey === 'TAXI') {
      const signGeo = new THREE.BoxGeometry(0.6, 0.2, 0.2);
      const signMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, t.height * 1.08, -t.length * 0.05);
      this.group.add(sign);
    }

    // Wheels
    const wRad = 0.38;
    const wThick = 0.24;
    const wGeo = new THREE.CylinderGeometry(wRad, wRad, wThick, 14);
    const wMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const wheelOffsets = [
      { x: -t.width * 0.48, z: t.length * 0.32, isFront: true },
      { x: t.width * 0.48, z: t.length * 0.32, isFront: true },
      { x: -t.width * 0.48, z: -t.length * 0.32, isFront: false },
      { x: t.width * 0.48, z: -t.length * 0.32, isFront: false },
    ];

    wheelOffsets.forEach((wo) => {
      const wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.rotation.z = Math.PI / 2;
      const wAnchor = new THREE.Group();
      wAnchor.position.set(wo.x, wRad, wo.z);
      wAnchor.add(wMesh);
      this.group.add(wAnchor);
      this.wheels.push({ anchor: wAnchor, mesh: wMesh, isFront: wo.isFront });
    });
  }
  updateDriving(dt, input, colliders) {
    const f = input.getForward();
    const t = input.getTurn();
    const handbrake = input.isHandbrake();

    // Acceleration & Braking
    if (f > 0) {
      this.velocity += this.type.accel * dt;
    } else if (f < 0) {
      if (this.velocity > 0.5) {
        this.velocity -= this.type.brake * dt;
      } else {
        this.velocity -= (this.type.accel * 0.6) * dt; // reverse
      }
    } else {
      // Coasting drag
      this.velocity = THREE.MathUtils.lerp(this.velocity, 0, dt * 2.0);
    }

    if (handbrake) {
      this.velocity = THREE.MathUtils.lerp(this.velocity, 0, dt * 5.0);
    }

    // Velocity limits
    this.velocity = Math.max(-this.type.maxSpeed * 0.4, Math.min(this.type.maxSpeed, this.velocity));

    // Steering
    const steerTarget = t * 0.5;
    this.steer = THREE.MathUtils.lerp(this.steer, steerTarget, dt * 8);

    // Apply turn to heading when moving
    if (Math.abs(this.velocity) > 0.1) {
      const turnDir = this.velocity > 0 ? 1 : -1;
      this.heading += this.steer * this.type.turnSpeed * (this.velocity / this.type.maxSpeed) * dt * turnDir;
    }

    // Update wheel visual rotation
    this.wheels.forEach((w) => {
      w.mesh.rotation.x += (this.velocity / 0.38) * dt;
      if (w.isFront) {
        w.anchor.rotation.y = this.steer;
      }
    });

    // Move forward along heading vector
    const dx = Math.sin(this.heading) * this.velocity * dt;
    const dz = Math.cos(this.heading) * this.velocity * dt;

    const nextX = this.position.x + dx;
    const nextZ = this.position.z + dz;

    if (!this.checkBuildingCollision(nextX, nextZ, colliders)) {
      this.position.x = nextX;
      this.position.z = nextZ;
    } else {
      this.velocity = -this.velocity * 0.3; // bounce slightly
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;
  }
  checkBuildingCollision(px, pz, colliders) {
    const halfW = this.type.width * 0.5;
    const halfL = this.type.length * 0.5;
    const vehBox = new THREE.Box3(
      new THREE.Vector3(px - halfW, 0, pz - halfL),
      new THREE.Vector3(px + halfW, this.type.height, pz + halfL)
    );
    for (let i = 0; i < colliders.length; i++) {
      if (vehBox.intersectsBox(colliders[i])) {
        return true;
      }
    }
    return false;
  }

  updateSiren(time) {
    if (this.lightbar && this.sirenActive) {
      const flash = Math.sin(time * 16) > 0;
      this.lightbar.sirenL.visible = flash;
      this.lightbar.sirenR.visible = !flash;
    }
  }

  getSpeedMph() {
    return Math.round(Math.abs(this.velocity) * 2.8);
  }
}

export class TrafficManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.vehicles = [];
    this.spawnInitialTraffic();
  }

  spawnInitialTraffic() {
    const types = ['SPORTS', 'SEDAN', 'TAXI', 'VAN', 'SEDAN'];
    const pitch = BLOCK_SIZE + ROAD_WIDTH;

    // Spawn parked / traffic cars along main roads
    let count = 0;
    for (let i = 0; i <= BLOCK_COUNT; i++) {
      const x = -HALF_SPAN + i * pitch;
      for (let j = 0; j <= BLOCK_COUNT; j += 2) {
        const z = -HALF_SPAN + j * pitch;
        if (count >= 16) break;
        const typeKey = types[count % types.length];
        const v = new Vehicle(typeKey, this.scene, true);
        v.position.set(x + (count % 2 === 0 ? 4 : -4), 0, z + 20);
        v.heading = count % 2 === 0 ? 0 : Math.PI;
        v.velocity = 6.0 + (count % 3) * 2;
        v.group.position.copy(v.position);
        v.group.rotation.y = v.heading;
        this.vehicles.push(v);
        count++;
      }
    }
  }
  update(dt, time, player) {
    this.vehicles.forEach((v) => {
      if (v === player.inVehicle) return; // Controlled by player

      if (v.isTraffic) {
        // Cruise along road
        const dz = Math.cos(v.heading) * v.velocity * dt;
        const dx = Math.sin(v.heading) * v.velocity * dt;
        v.position.x += dx;
        v.position.z += dz;

        // Loop within city boundaries
        if (v.position.z > HALF_SPAN + 20) v.position.z = -HALF_SPAN - 20;
        if (v.position.z < -HALF_SPAN - 20) v.position.z = HALF_SPAN + 20;
        if (v.position.x > HALF_SPAN + 20) v.position.x = -HALF_SPAN - 20;
        if (v.position.x < -HALF_SPAN - 20) v.position.x = HALF_SPAN + 20;

        v.group.position.copy(v.position);
        v.group.rotation.y = v.heading;

        // Wheel spin
        v.wheels.forEach((w) => {
          w.mesh.rotation.x += (v.velocity / 0.38) * dt;
        });
      }

      v.updateSiren(time);
    });
  }

  getNearestVehicle(pos, maxDist = 4.0) {
    let nearest = null;
    let minDist = maxDist;
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const d = pos.distanceTo(v.position);
      if (d < minDist) {
        minDist = d;
        nearest = v;
      }
    }
    return nearest;
  }
}
