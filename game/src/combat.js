// Combat, Weapons, and Gang Encounters for Neon Tide
import * as THREE from 'three';
import { PLAYER_CONFIG } from './config.js';

export class CombatManager {
  constructor(scene) {
    this.scene = scene;
    this.tracers = [];
    this.hostiles = [];
    this.spawnGangMembers();
  }

  createBulletTracer(from, to) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffe600,
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({ line, life: 0.09 });
  }

  spawnGangMembers() {
    // Syndicate rivals near Puerto Industrial
    const gangPositions = [
      { x: 130, z: 110 },
      { x: 145, z: 125 },
      { x: 160, z: 95 },
    ];

    gangPositions.forEach((pos) => {
      const group = new THREE.Group();

      const tGeo = new THREE.BoxGeometry(0.65, 0.85, 0.38);
      const tMat = new THREE.MeshLambertMaterial({ color: 0x8b0000 }); // Syndicate Crimson
      const torso = new THREE.Mesh(tGeo, tMat);
      torso.position.y = 0.95;
      group.add(torso);

      const hGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
      const hMat = new THREE.MeshLambertMaterial({ color: 0xffd1b3 });
      const head = new THREE.Mesh(hGeo, hMat);
      head.position.y = 1.55;
      group.add(head);
      const lMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const legGeo = new THREE.BoxGeometry(0.24, 0.75, 0.24);
      const lLeg = new THREE.Mesh(legGeo, lMat);
      lLeg.position.set(-0.18, 0.38, 0);
      group.add(lLeg);
      const rLeg = new THREE.Mesh(legGeo, lMat);
      rLeg.position.set(0.18, 0.38, 0);
      group.add(rLeg);

      group.position.set(pos.x, 0, pos.z);
      this.scene.add(group);

      this.hostiles.push({
        group,
        position: group.position,
        health: 50,
        isAlive: true,
        heading: 0,
        shootCooldown: 1.5 + Math.random(),
      });
    });
  }

  punch(player, pedestrians, police, audio, onFeed) {
    if (!player.isAlive || player.inVehicle) return;

    audio.playPunch();
    const punchPos = new THREE.Vector3(
      player.position.x + Math.sin(player.rotationY) * 1.5,
      1.0,
      player.position.z + Math.cos(player.rotationY) * 1.5
    );

    // Check hit pedestrians
    pedestrians.pedestrians.forEach((p) => {
      if (p.isAlive && p.position.distanceTo(punchPos) < PLAYER_CONFIG.punchRange) {
        p.takeDamage(PLAYER_CONFIG.punchDamage);
        police.addCrime('hitPedestrian');
        if (onFeed) onFeed('Assaulted pedestrian! +2 Wanted Stars');
      }
    });

    // Check hit police
    police.units.forEach((u) => {
      if (u.type === 'OFFICER' && u.entity.isAlive && u.entity.position.distanceTo(punchPos) < PLAYER_CONFIG.punchRange) {
        u.entity.takeDamage(PLAYER_CONFIG.punchDamage);
        police.addCrime('attackPolice');
        if (onFeed) onFeed('Assaulted police officer! +3 Wanted Stars');
      }
    });

    // Check hit gang hostiles
    this.hostiles.forEach((h) => {
      if (h.isAlive && h.position.distanceTo(punchPos) < PLAYER_CONFIG.punchRange) {
        h.health -= PLAYER_CONFIG.punchDamage;
        if (h.health <= 0) {
          h.isAlive = false;
          h.group.rotation.x = Math.PI / 2;
          player.cash += 100;
          if (onFeed) onFeed('Eliminated syndicate gunman! +$100 Cash');
        }
      }
    });
  }
  shoot(player, pedestrians, police, audio, onFeed) {
    if (!player.isAlive || player.ammo <= 0) return;

    player.ammo--;
    audio.playGunshot();
    police.addCrime('shootWeapon');

    const fromPos = player.inVehicle
      ? player.inVehicle.position.clone().add(new THREE.Vector3(0, 1.2, 0))
      : player.position.clone().add(new THREE.Vector3(0, 1.4, 0));

    const shootAngle = player.inVehicle ? player.inVehicle.heading : player.camYaw;
    const dir = new THREE.Vector3(Math.sin(shootAngle), 0, Math.cos(shootAngle));
    const toPos = fromPos.clone().add(dir.clone().multiplyScalar(PLAYER_CONFIG.gunRange));

    this.createBulletTracer(fromPos, toPos);
    pedestrians.alertNearby(fromPos, 45);

    // Hit checks along ray
    pedestrians.pedestrians.forEach((p) => {
      if (p.isAlive) {
        const toPed = new THREE.Vector3().subVectors(p.position, fromPos);
        const proj = toPed.dot(dir);
        if (proj > 0 && proj < PLAYER_CONFIG.gunRange) {
          const perp = toPed.clone().sub(dir.clone().multiplyScalar(proj)).length();
          if (perp < 1.0) {
            p.takeDamage(PLAYER_CONFIG.gunDamage);
            police.addCrime('hitPedestrian');
            if (onFeed) onFeed('Pedestrian shot! +2 Wanted Stars');
          }
        }
      }
    });

    police.units.forEach((u) => {
      if (u.type === 'OFFICER' && u.entity.isAlive) {
        const toCop = new THREE.Vector3().subVectors(u.entity.position, fromPos);
        const proj = toCop.dot(dir);
        if (proj > 0 && proj < PLAYER_CONFIG.gunRange) {
          const perp = toCop.clone().sub(dir.clone().multiplyScalar(proj)).length();
          if (perp < 1.2) {
            u.entity.takeDamage(PLAYER_CONFIG.gunDamage);
            police.addCrime('attackPolice');
            if (onFeed) onFeed('Police shot! +3 Wanted Stars');
          }
        }
      }
    });

    this.hostiles.forEach((h) => {
      if (h.isAlive) {
        const toH = new THREE.Vector3().subVectors(h.position, fromPos);
        const proj = toH.dot(dir);
        if (proj > 0 && proj < PLAYER_CONFIG.gunRange) {
          const perp = toH.clone().sub(dir.clone().multiplyScalar(proj)).length();
          if (perp < 1.2) {
            h.health -= PLAYER_CONFIG.gunDamage;
            if (h.health <= 0) {
              h.isAlive = false;
              h.group.rotation.x = Math.PI / 2;
              player.cash += 150;
              if (onFeed) onFeed('Syndicate hit target neutralized! +$150 Cash');
            }
          }
        }
      }
    });
  }

  update(dt, player, audio) {
    // Fade tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i];
      tr.life -= dt;
      if (tr.life <= 0) {
        this.scene.remove(tr.line);
        this.tracers.splice(i, 1);
      }
    }

    // Gang hostility logic
    const playerPos = player.inVehicle ? player.inVehicle.position : player.position;
    this.hostiles.forEach((h) => {
      if (!h.isAlive) return;
      const dist = h.position.distanceTo(playerPos);
      if (dist < 28.0) {
        h.group.lookAt(playerPos.x, h.position.y, playerPos.z);
        h.shootCooldown -= dt;
        if (h.shootCooldown <= 0) {
          h.shootCooldown = 2.0 + Math.random() * 1.5;
          audio.playGunshot();
          this.createBulletTracer(h.position.clone().add(new THREE.Vector3(0, 1.3, 0)), playerPos);
          player.takeDamage(18, audio);
        }
      }
    });
  }
}
