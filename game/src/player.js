// Player controller and character for Neon Tide
import * as THREE from 'three';
import { PLAYER_CONFIG } from './config.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.health = PLAYER_CONFIG.maxHealth;
    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.cash = PLAYER_CONFIG.startCash;
    this.ammo = PLAYER_CONFIG.startAmmo;
    this.isAlive = true;
    this.inVehicle = null;

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = 0;
    this.speed = 0;

    // Camera angles
    this.camYaw = 0;
    this.camPitch = 0.25;
    this.camDistance = 5.5;

    this.mesh = this.createMesh();
    this.scene.add(this.mesh);

    this.walkCycle = 0;
  }

  createMesh() {
    const group = new THREE.Group();

    // Torso (Neon Jacket)
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.4);
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x00f0ff });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffd1b3 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.68;
    head.castShadow = true;
    group.add(head);
    // Limbs
    const limbMat = new THREE.MeshLambertMaterial({ color: 0x1f2430 });
    const armMat = new THREE.MeshLambertMaterial({ color: 0x00d0ee });

    // Left Arm
    const lArmGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
    this.lArm = new THREE.Mesh(lArmGeo, armMat);
    this.lArm.position.set(-0.48, 1.05, 0);
    group.add(this.lArm);

    // Right Arm
    const rArmGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
    this.rArm = new THREE.Mesh(rArmGeo, armMat);
    this.rArm.position.set(0.48, 1.05, 0);
    group.add(this.rArm);

    // Left Leg
    const legGeo = new THREE.BoxGeometry(0.26, 0.85, 0.26);
    this.lLeg = new THREE.Mesh(legGeo, limbMat);
    this.lLeg.position.set(-0.2, 0.42, 0);
    this.lLeg.castShadow = true;
    group.add(this.lLeg);

    // Right Leg
    this.rLeg = new THREE.Mesh(legGeo, limbMat);
    this.rLeg.position.set(0.2, 0.42, 0);
    this.rLeg.castShadow = true;
    group.add(this.rLeg);

    // Weapon prop (in right hand)
    const gunGeo = new THREE.BoxGeometry(0.1, 0.14, 0.32);
    const gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    this.gunMesh = new THREE.Mesh(gunGeo, gunMat);
    this.gunMesh.position.set(0, -0.32, 0.12);
    this.rArm.add(this.gunMesh);

    return group;
  }
  updateCameraAngles(dx, dy) {
    const sens = 0.0035;
    this.camYaw -= dx * sens;
    this.camPitch = Math.max(-0.2, Math.min(1.1, this.camPitch + dy * sens));
  }

  updateOnFoot(dt, input, colliders) {
    if (!this.isAlive) return;

    const f = input.getForward();
    const t = input.getTurn();
    const sprinting = input.isSprinting();
    const targetSpeed = sprinting ? PLAYER_CONFIG.runSpeed : PLAYER_CONFIG.walkSpeed;

    if (f !== 0 || t !== 0) {
      // Move relative to camera yaw
      const moveAngle = this.camYaw + Math.atan2(-t, f);
      this.rotationY = moveAngle;
      this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, dt * 10);

      const vx = Math.sin(moveAngle) * this.speed * dt;
      const vz = Math.cos(moveAngle) * this.speed * dt;

      // Check collision on X
      const nextPosX = this.position.x + vx;
      if (!this.checkBuildingCollision(nextPosX, this.position.z, colliders)) {
        this.position.x = nextPosX;
      }

      // Check collision on Z
      const nextPosZ = this.position.z + vz;
      if (!this.checkBuildingCollision(this.position.x, nextPosZ, colliders)) {
        this.position.z = nextPosZ;
      }

      // Limb animation
      this.walkCycle += dt * (sprinting ? 16 : 9);
      const swing = Math.sin(this.walkCycle) * 0.6;
      this.lLeg.rotation.x = swing;
      this.rLeg.rotation.x = -swing;
      this.lArm.rotation.x = -swing * 0.7;
      this.rArm.rotation.x = swing * 0.7;
    } else {
      this.speed = THREE.MathUtils.lerp(this.speed, 0, dt * 12);
      this.lLeg.rotation.x = THREE.MathUtils.lerp(this.lLeg.rotation.x, 0, dt * 10);
      this.rLeg.rotation.x = THREE.MathUtils.lerp(this.rLeg.rotation.x, 0, dt * 10);
      this.lArm.rotation.x = THREE.MathUtils.lerp(this.lArm.rotation.x, 0, dt * 10);
      this.rArm.rotation.x = THREE.MathUtils.lerp(this.rArm.rotation.x, 0, dt * 10);
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;
  }
  checkBuildingCollision(px, pz, colliders) {
    const r = 0.5;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(px - r, 0, pz - r),
      new THREE.Vector3(px + r, 2.0, pz + r)
    );
    for (let i = 0; i < colliders.length; i++) {
      if (playerBox.intersectsBox(colliders[i])) {
        return true;
      }
    }
    return false;
  }

  checkPickups(world, audio, onFeed) {
    if (!this.isAlive) return;
    world.pickups.forEach((p) => {
      if (p.active) {
        const dist = this.position.distanceTo(p.group.position);
        if (dist < p.radius) {
          p.active = false;
          p.group.visible = false;
          audio.playPickup();

          if (p.type === 'health') {
            this.health = Math.min(this.maxHealth, this.health + p.amount);
            if (onFeed) onFeed(`Picked up +${p.amount} Health`);
          } else if (p.type === 'ammo') {
            this.ammo += p.amount;
            if (onFeed) onFeed(`Picked up +${p.amount} Ammo`);
          } else if (p.type === 'cash') {
            this.cash += p.amount;
            if (onFeed) onFeed(`Found +$${p.amount} Cash`);
          }
        }
      }
    });
  }

  takeDamage(amt, audio) {
    if (!this.isAlive) return;
    this.health = Math.max(0, this.health - amt);
    if (audio) audio.playPunch();
    if (this.health <= 0) {
      this.isAlive = false;
    }
  }

  respawn(hospitalPos = { x: -30, z: -30 }) {
    this.health = this.maxHealth;
    this.isAlive = true;
    this.inVehicle = null;
    this.cash = Math.max(0, this.cash - PLAYER_CONFIG.hospitalFee);
    this.position.set(hospitalPos.x, 0, hospitalPos.z);
    this.mesh.position.copy(this.position);
    this.mesh.visible = true;
  }

  getCameraTarget() {
    return new THREE.Vector3(this.position.x, this.position.y + 1.4, this.position.z);
  }
}
