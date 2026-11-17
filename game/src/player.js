// Neon Tide - Player Character & Camera Controller
// Protagonist: Dante Rios in Palma Verde

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // State
    this.health = CONFIG.PLAYER.MAX_HEALTH;
    this.armor = 0;
    this.cash = CONFIG.PLAYER.START_CASH;
    this.ammo = CONFIG.PLAYER.START_AMMO;
    this.inVehicle = false;
    this.currentVehicle = null;
    this.isDead = false;

    // Transform
    this.position = new THREE.Vector3(0, 0.5, 0);
    this.velocity = new THREE.Vector3();
    this.rotation = 0; // heading angle around Y
    this.radius = 0.5;

    // Animation state
    this.walkCycle = 0;
    this.punchTimer = 0;
    this.isPunching = false;

    // Camera Orbit
    this.camYaw = 0;
    this.camPitch = 0.28; // slight downward angle
    this.camDist = 4.8;
    this.targetCamDist = 4.8;

    this.mesh = this.createCharacterMesh();
    this.scene.add(this.mesh);
  }

  createCharacterMesh() {
    const group = new THREE.Group();

    // Torso: Teal tropical floral shirt
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.32);
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x00897b });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);
    this.torsoMesh = torso;

    // Head
    const headGeo = new THREE.BoxGeometry(0.32, 0.35, 0.32);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8 }); // skin tone
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.62;
    head.castShadow = true;
    group.add(head);

    // Sunglasses
    const glassesGeo = new THREE.BoxGeometry(0.28, 0.1, 0.08);
    const glassesMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const glasses = new THREE.Mesh(glassesGeo, glassesMat);
    glasses.position.set(0, 1.65, 0.18);
    group.add(glasses);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.34, 0.12, 0.34);
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.8;
    group.add(hair);

    // Left Arm
    const armGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
    const armMat = new THREE.MeshLambertMaterial({ color: 0x00796b });
    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-0.38, 1.05, 0);
    this.leftArm.castShadow = true;
    group.add(this.leftArm);

    // Right Arm (Punches)
    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(0.38, 1.05, 0);
    this.rightArm.castShadow = true;
    group.add(this.rightArm);

    // Left Leg: White tropical trousers
    const legGeo = new THREE.BoxGeometry(0.2, 0.72, 0.22);
    const legMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.16, 0.36, 0);
    this.leftLeg.castShadow = true;
    group.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.16, 0.36, 0);
    this.rightLeg.castShadow = true;
    group.add(this.rightLeg);

    return group;
  }

  update(dt, input, world, vehicles) {
    if (this.isDead) return;

    // Handle mouse camera orbit
    const mouseDelta = input.consumeMouseDelta();
    this.camYaw -= mouseDelta.dx * 0.0035;
    this.camPitch = Math.max(-0.25, Math.min(1.2, this.camPitch + mouseDelta.dy * 0.0035));

    // Handle Vehicle Enter / Exit
    if (input.justEnterVehicle()) {
      if (this.inVehicle) {
        this.exitVehicle(world);
      } else {
        this.tryEnterVehicle(vehicles);
      }
    }

    if (this.inVehicle) {
      // Vehicle controls player position & camera
      this.updateInVehicle(dt, input);
      return;
    }

    // On-foot movement relative to camera yaw
    let moveX = 0;
    let moveZ = 0;
    if (input.isForward()) moveZ -= 1;
    if (input.isBackward()) moveZ += 1;
    if (input.isLeft()) moveX -= 1;
    if (input.isRight()) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;
    const isSprinting = input.isSprint() && isMoving;
    const speed = isSprinting ? CONFIG.PLAYER.RUN_SPEED : CONFIG.PLAYER.WALK_SPEED;

    if (isMoving) {
      // Normalize input direction
      const inputLen = Math.hypot(moveX, moveZ);
      const nx = moveX / inputLen;
      const nz = moveZ / inputLen;

      // Transform by camera yaw
      const forwardX = -Math.sin(this.camYaw);
      const forwardZ = -Math.cos(this.camYaw);
      const rightX = Math.cos(this.camYaw);
      const rightZ = -Math.sin(this.camYaw);

      const dirX = forwardX * -nz + rightX * nx;
      const dirZ = forwardZ * -nz + rightZ * nx;

      // Smoothly rotate character towards movement heading
      const targetRot = Math.atan2(dirX, dirZ);
      this.rotation = this.lerpAngle(this.rotation, targetRot, CONFIG.PLAYER.TURN_SPEED * dt);

      // Desired next position with collision resolution
      const nextX = this.position.x + dirX * speed * dt;
      const nextZ = this.position.z + dirZ * speed * dt;

      // Check X and Z independently for smooth wall sliding
      if (!world.checkCollision(nextX, this.position.z, this.radius)) {
        this.position.x = nextX;
      }
      if (!world.checkCollision(this.position.x, nextZ, this.radius)) {
        this.position.z = nextZ;
      }

      // Animate walk cycle
      this.walkCycle += dt * (isSprinting ? 16 : 9);
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.65;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.65;
      if (!this.isPunching) {
        this.leftArm.rotation.x = -Math.sin(this.walkCycle) * 0.55;
        this.rightArm.rotation.x = Math.sin(this.walkCycle) * 0.55;
      }
    } else {
      // Idle pose
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, dt * 10);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, dt * 10);
      if (!this.isPunching) {
        this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, dt * 10);
        this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, dt * 10);
      }
    }

    // Punch Animation
    if (this.isPunching) {
      this.punchTimer -= dt;
      this.rightArm.rotation.x = -1.5; // arm thrust forward
      if (this.punchTimer <= 0) {
        this.isPunching = false;
      }
    }

    // Apply position & rotation to mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;

    // Follow camera
    this.updateCamera(dt, this.position, 1.4);
  }

  updateInVehicle(dt, input) {
    if (!this.currentVehicle) return;

    // Hide on-foot mesh while inside
    this.mesh.visible = false;
    this.position.copy(this.currentVehicle.position);

    // Car camera pulls back and follows vehicle heading smoothly
    const speed = Math.abs(this.currentVehicle.speed);
    const speedRatio = Math.min(speed / 35, 1);
    this.targetCamDist = 6.8 + speedRatio * 2.5;

    // Follow car heading gently if not manually orbiting
    if (Math.abs(input.mouse.dx) < 0.1) {
      this.camYaw = this.lerpAngle(this.camYaw, this.currentVehicle.rotation + Math.PI, dt * 3.5);
    }

    this.updateCamera(dt, this.currentVehicle.position, 1.2);
  }

  updateCamera(dt, targetPos, targetHeight) {
    this.camDist = THREE.MathUtils.lerp(this.camDist, this.targetCamDist, dt * 8);

    const horizontalDist = this.camDist * Math.cos(this.camPitch);
    const verticalDist = this.camDist * Math.sin(this.camPitch);

    const cx = targetPos.x + Math.sin(this.camYaw) * horizontalDist;
    const cz = targetPos.z + Math.cos(this.camYaw) * horizontalDist;
    const cy = Math.max(0.6, targetPos.y + targetHeight + verticalDist);

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(targetPos.x, targetPos.y + targetHeight, targetPos.z);
  }

  tryEnterVehicle(vehicles) {
    let nearest = null;
    let minDist = CONFIG.PLAYER.VEHICLE_ENTER_DIST;

    for (const v of vehicles) {
      const d = this.position.distanceTo(v.position);
      if (d < minDist) {
        minDist = d;
        nearest = v;
      }
    }

    if (nearest) {
      this.inVehicle = true;
      this.currentVehicle = nearest;
      nearest.isDrivenByPlayer = true;
      this.mesh.visible = false;
    }
  }

  exitVehicle(world) {
    if (!this.currentVehicle) return;

    // Exit to driver-side (left of vehicle heading)
    const v = this.currentVehicle;
    v.isDrivenByPlayer = false;

    const exitOffset = new THREE.Vector3(-2.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.rotation);
    const exitPos = v.position.clone().add(exitOffset);

    // If colliding with building, exit to right side
    if (world.checkCollision(exitPos.x, exitPos.z, this.radius)) {
      exitOffset.set(2.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.rotation);
      exitPos.copy(v.position).add(exitOffset);
    }

    this.position.copy(exitPos);
    this.position.y = 0.5;
    this.mesh.position.copy(this.position);
    this.mesh.visible = true;

    this.inVehicle = false;
    this.currentVehicle = null;
    this.targetCamDist = 4.8;
  }

  triggerPunch() {
    this.isPunching = true;
    this.punchTimer = CONFIG.PLAYER.PUNCH_COOLDOWN;
  }

  takeDamage(amount) {
    if (this.armor > 0) {
      const armorAbsorb = Math.min(this.armor, amount);
      this.armor -= armorAbsorb;
      amount -= armorAbsorb;
    }
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  respawn() {
    this.health = CONFIG.PLAYER.MAX_HEALTH;
    this.armor = 25;
    this.isDead = false;
    this.inVehicle = false;
    this.currentVehicle = null;
    this.mesh.visible = true;
    this.position.set(CONFIG.PLAYER.RESPAWN_POS.x, CONFIG.PLAYER.RESPAWN_POS.y, CONFIG.PLAYER.RESPAWN_POS.z);
    this.mesh.position.copy(this.position);
    this.rotation = 0;
    this.targetCamDist = 4.8;
  }

  lerpAngle(a, b, t) {
    let diff = (b - a) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
  }
}
