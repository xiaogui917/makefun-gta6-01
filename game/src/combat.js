// Neon Tide - Combat System, Gunplay, & Gang AI
// Palma Verde Underworld

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class CombatManager {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;

    this.tracers = [];
    this.gangMembers = [];
    this.raycaster = new THREE.Raycaster();
  }

  init(world) {
    this.spawnHarborGangMembers();
  }

  spawnHarborGangMembers() {
    // Syndicate gang enforcers stationed around Harbor warehouse
    const gangSpots = [
      { x: 185, z: 95 },
      { x: 195, z: 85 },
      { x: 205, z: 110 },
    ];

    for (const spot of gangSpots) {
      const group = new THREE.Group();

      // Red bandana & dark jacket
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.7, 0.3),
        new THREE.MeshLambertMaterial({ color: 0x212121 }),
      );
      torso.position.y = 1.0;
      group.add(torso);

      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.3),
        new THREE.MeshLambertMaterial({ color: 0x8d6e63 }),
      );
      head.position.y = 1.55;
      group.add(head);

      const bandana = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.1, 0.32),
        new THREE.MeshBasicMaterial({ color: 0xd50000 }), // Red syndicate bandana
      );
      bandana.position.y = 1.58;
      group.add(bandana);

      group.position.set(spot.x, 0.3, spot.z);
      this.scene.add(group);

      this.gangMembers.push({
        group,
        position: group.position,
        health: 60,
        isHostile: false,
        shootCooldown: 0,
      });
    }
  }

  update(dt, input, player, pedestrians, police, vehicles, world) {
    // Clean up expired bullet tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i];
      tr.life -= dt;
      if (tr.life <= 0) {
        this.scene.remove(tr.mesh);
        this.tracers.splice(i, 1);
      }
    }

    // Player Melee Punch (F key)
    if (input.justPunch() && !player.inVehicle && !player.isDead) {
      player.triggerPunch();
      this.audio.playPunch();
      this.handleMeleeHit(player, pedestrians, police);
    }

    // Player Shooting (Left Click)
    if (input.justShoot() && !player.inVehicle && !player.isDead) {
      if (player.ammo > 0) {
        player.ammo--;
        this.audio.playGunshot();
        this.handleGunshot(player, pedestrians, police, vehicles, world);
      }
    }

    // Hostile Gang AI Update
    for (const gang of this.gangMembers) {
      if (gang.health <= 0) continue;

      const dist = gang.position.distanceTo(player.position);
      if (dist < 22 && (gang.isHostile || police.wantedLevel >= 2)) {
        gang.isHostile = true;
        gang.shootCooldown -= dt;

        // Face player
        const toX = player.position.x - gang.position.x;
        const toZ = player.position.z - gang.position.z;
        gang.group.rotation.y = Math.atan2(toX, toZ);

        if (gang.shootCooldown <= 0) {
          gang.shootCooldown = 1.6 + Math.random() * 0.8;
          this.audio.playGunshot();
          player.takeDamage(12);
          this.createBulletTracer(gang.position, player.position, 0xff1744);
        }
      }
    }
  }

  handleMeleeHit(player, pedestrians, police) {
    const forwardX = Math.sin(player.rotation);
    const forwardZ = Math.cos(player.rotation);

    // Check pedestrians within punch arc
    for (const ped of pedestrians.pedestrians) {
      if (ped.state === 'DOWNED') continue;
      const dist = player.position.distanceTo(ped.position);
      if (dist < CONFIG.PLAYER.PUNCH_RANGE) {
        const toX = ped.position.x - player.position.x;
        const toZ = ped.position.z - player.position.z;
        const dot = toX * forwardX + toZ * forwardZ;

        if (dot > 0.3) {
          ped.health -= CONFIG.PLAYER.PUNCH_DAMAGE;
          if (ped.health <= 0) {
            pedestrians.downPedestrian(ped, player, (c) => police.reportCrime(c));
          }
          break;
        }
      }
    }
  }

  handleGunshot(player, pedestrians, police, vehicles, world) {
    // Gunshot alerts surrounding pedestrians to panic
    pedestrians.triggerPanicNearby(player.position, 35);
    police.reportCrime('DISCHARGE');

    // Calculate bullet trajectory from player eye along camera forward direction
    const eyePos = player.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const camDir = new THREE.Vector3();
    player.camera.getWorldDirection(camDir);

    const hitPoint = eyePos.clone().add(camDir.clone().multiplyScalar(CONFIG.PLAYER.PISTOL_RANGE));

    // Check hit against pedestrians
    for (const ped of pedestrians.pedestrians) {
      if (ped.state === 'DOWNED') continue;
      const toPed = ped.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(eyePos);
      const proj = toPed.dot(camDir);
      if (proj > 0 && proj < CONFIG.PLAYER.PISTOL_RANGE) {
        const closestPoint = eyePos.clone().add(camDir.clone().multiplyScalar(proj));
        if (closestPoint.distanceTo(ped.position.clone().add(new THREE.Vector3(0, 1, 0))) < 0.8) {
          ped.health -= CONFIG.PLAYER.PISTOL_DAMAGE;
          if (ped.health <= 0) {
            pedestrians.downPedestrian(ped, player, (c) => police.reportCrime(c));
          }
          hitPoint.copy(closestPoint);
          break;
        }
      }
    }

    // Check hit against vehicles
    for (const v of vehicles.vehicles) {
      const toCar = v.position.clone().add(new THREE.Vector3(0, 0.8, 0)).sub(eyePos);
      const proj = toCar.dot(camDir);
      if (proj > 0 && proj < CONFIG.PLAYER.PISTOL_RANGE) {
        const closest = eyePos.clone().add(camDir.clone().multiplyScalar(proj));
        if (closest.distanceTo(v.position) < v.radius) {
          v.health -= CONFIG.PLAYER.PISTOL_DAMAGE;
          hitPoint.copy(closest);
          this.audio.playCrash();
          break;
        }
      }
    }

    // Create glowing neon bullet tracer
    this.createBulletTracer(eyePos, hitPoint, 0x00e5ff);
  }

  createBulletTracer(from, to, color = 0x00e5ff) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);

    this.tracers.push({
      mesh: line,
      life: 0.08,
    });
  }
}
