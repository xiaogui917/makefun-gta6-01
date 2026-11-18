// Neon Tide - Player Character, On-Foot Physics, Animations & 3rd-Person Orbit Camera
import * as THREE from 'three';
import { PLAYER_CONFIG, CAMERA_CONFIG } from './config.js';

export class Player {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;

    this.position = new THREE.Vector3(-140, 0, 80);
    this.velocity = new THREE.Vector3();
    this.rotation = 0;
    this.health = PLAYER_CONFIG.MAX_HEALTH;
    this.ammo = PLAYER_CONFIG.START_AMMO;
    this.cash = 100;

    this.isDriving = false;
    this.currentVehicle = null;

    this.cameraYaw = 0;
    this.cameraPitch = 0.25;
    this.animTime = 0;

    this.mesh = this.createCharacterMesh();
    this.scene.add(this.mesh);
    this.updateMeshTransform();
  }

  createCharacterMesh() {
    const group = new THREE.Group();

    // Torso: Hawaiian / Synthwave shirt
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.4);
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x00d4ff });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.42, 0.45, 0.42);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.05;
    head.castShadow = true;
    group.add(head);

    // Sunglasses
    const glassGeo = new THREE.BoxGeometry(0.38, 0.12, 0.15);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 2.08, 0.2);
    group.add(glass);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.26, 0.9, 0.3);
    const legMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); // white pants
    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.2, 0.45, 0);
    this.leftLeg.castShadow = true;
    group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.2, 0.45, 0);
    this.rightLeg.castShadow = true;
    group.add(this.rightLeg);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.22);
    const armMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-0.48, 1.3, 0);
    this.leftArm.castShadow = true;
    group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(0.48, 1.3, 0);
    this.rightArm.castShadow = true;
    group.add(this.rightArm);

    return group;
  }
  update(dt, input, camera) {
    if (this.isDriving) {
      if (this.currentVehicle) {
        this.position.copy(this.currentVehicle.position);
        this.updateCameraForVehicle(dt, camera);
      }
      return;
    }

    // Process mouse look
    const mouseDelta = input.getAndResetMouseDelta();
    this.cameraYaw -= mouseDelta.dx * 0.003;
    this.cameraPitch = Math.max(-0.35, Math.min(0.85, this.cameraPitch - mouseDelta.dy * 0.003));

    // Calculate movement vector from input
    let moveX = 0;
    let moveZ = 0;
    if (input.isDown('KeyW')) moveZ -= 1;
    if (input.isDown('KeyS')) moveZ += 1;
    if (input.isDown('KeyA')) moveX -= 1;
    if (input.isDown('KeyD')) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;
    const isSprinting = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    const speed = isSprinting ? PLAYER_CONFIG.RUN_SPEED : PLAYER_CONFIG.WALK_SPEED;

    if (isMoving) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      // Rotate move direction relative to camera yaw
      const forwardX = -Math.sin(this.cameraYaw);
      const forwardZ = -Math.cos(this.cameraYaw);
      const rightX = Math.cos(this.cameraYaw);
      const rightZ = -Math.sin(this.cameraYaw);

      const worldMoveX = (rightX * moveX - forwardX * moveZ) * speed;
      const worldMoveZ = (rightZ * moveX - forwardZ * moveZ) * speed;

      // Wall slide collision resolution
      const nextX = this.position.x + worldMoveX * dt;
      const nextZ = this.position.z + worldMoveZ * dt;

      if (!this.world.checkCollision(nextX, this.position.z, 0.45)) {
        this.position.x = nextX;
      }
      if (!this.world.checkCollision(this.position.x, nextZ, 0.45)) {
        this.position.z = nextZ;
      }

      // Rotate player mesh towards movement direction
      this.rotation = Math.atan2(worldMoveX, worldMoveZ);

      // Limb swing animation
      this.animTime += dt * (isSprinting ? 14 : 9);
      this.leftLeg.rotation.x = Math.sin(this.animTime) * 0.65;
      this.rightLeg.rotation.x = -Math.sin(this.animTime) * 0.65;
      this.leftArm.rotation.x = -Math.sin(this.animTime) * 0.6;
      this.rightArm.rotation.x = Math.sin(this.animTime) * 0.6;
    } else {
      // Idle return
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      this.leftArm.rotation.x *= 0.8;
      this.rightArm.rotation.x *= 0.8;
    }

    this.updateMeshTransform();
    this.updateCameraOnFoot(dt, camera);
  }
  updateMeshTransform() {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }

  updateCameraOnFoot(dt, camera) {
    const dist = 4.8;
    const cx = this.position.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * dist;
    const cy = this.position.y + 1.8 + Math.sin(this.cameraPitch) * dist;
    const cz = this.position.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * dist;

    camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.18);
    camera.lookAt(this.position.x, this.position.y + 1.5, this.position.z);
  }

  updateCameraForVehicle(dt, camera) {
    if (!this.currentVehicle) return;
    const v = this.currentVehicle;
    const dist = 7.8;
    const height = 3.6;

    const angle = v.rotation;
    const targetX = v.position.x - Math.sin(angle) * dist;
    const targetZ = v.position.z - Math.cos(angle) * dist;
    const targetY = v.position.y + height;

    camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.12);
    camera.lookAt(v.position.x, v.position.y + 1.2, v.position.z);
  }

  enterVehicle(vehicle) {
    this.isDriving = true;
    this.currentVehicle = vehicle;
    vehicle.driver = this;
    this.mesh.visible = false;
  }

  exitVehicle() {
    if (!this.isDriving || !this.currentVehicle) return;
    const v = this.currentVehicle;
    // Place player beside vehicle driver side
    const exitAngle = v.rotation + Math.PI / 2;
    this.position.set(
      v.position.x + Math.sin(exitAngle) * 2.2,
      0,
      v.position.z + Math.cos(exitAngle) * 2.2
    );
    this.rotation = v.rotation;

    v.driver = null;
    this.currentVehicle = null;
    this.isDriving = false;
    this.mesh.visible = true;
    this.updateMeshTransform();
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health <= 0;
  }

  respawnAtHospital() {
    this.health = PLAYER_CONFIG.MAX_HEALTH;
    this.cash = Math.max(0, this.cash - 250);
    this.position.set(-60, 0, 45); // Hospital location
    this.rotation = 0;
    this.isDriving = false;
    this.currentVehicle = null;
    this.mesh.visible = true;
    this.updateMeshTransform();
  }
}
