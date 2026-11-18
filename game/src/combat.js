// Neon Tide - Combat System, Melee Punches, Gunplay, Ammo & Gang Rivalries
import * as THREE from 'three';
import { PLAYER_CONFIG } from './config.js';

export class GangMember {
  constructor(scene, world, x, z) {
    this.scene = scene;
    this.world = world;
    this.position = new THREE.Vector3(x, 0, z);
    this.rotation = Math.random() * Math.PI * 2;
    this.health = 75;
    this.state = 'IDLE'; // IDLE, ATTACKING, DEFEATED
    this.shootTimer = 0;

    this.mesh = this.buildGangMesh();
    this.scene.add(this.mesh);
    this.updateMeshTransform();
  }

  buildGangMesh() {
    const group = new THREE.Group();

    // Torso: Crimson leather vest
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.85, 0.38);
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x990022 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.85;
    head.castShadow = true;
    group.add(head);

    // Red Bandana
    const bandanaGeo = new THREE.BoxGeometry(0.44, 0.12, 0.44);
    const bandanaMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const bandana = new THREE.Mesh(bandanaGeo, bandanaMat);
    bandana.position.y = 1.95;
    group.add(bandana);

    // Weapon prop in hand
    const gunGeo = new THREE.BoxGeometry(0.12, 0.16, 0.4);
    const gunMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const gun = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0.45, 1.15, 0.3);
    group.add(gun);

    return group;
  }
  update(dt, player, audio) {
    if (this.state === 'DEFEATED') return;

    const dist = this.position.distanceTo(player.position);
    if (dist < 22) {
      this.state = 'ATTACKING';
      // Face player
      const toPlayer = new THREE.Vector3().subVectors(player.position, this.position);
      this.rotation = Math.atan2(toPlayer.x, toPlayer.z);

      // Shoot periodically
      this.shootTimer += dt;
      if (this.shootTimer > 2.2) {
        this.shootTimer = 0;
        if (audio) audio.playGunshot();
        player.takeDamage(12);
      }
    } else {
      this.state = 'IDLE';
    }

    this.updateMeshTransform();
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.state = 'DEFEATED';
      this.mesh.rotation.x = Math.PI / 2;
      this.mesh.position.y = 0.2;
      return true; // Dropped loot
    }
    this.state = 'ATTACKING';
    return false;
  }

  updateMeshTransform() {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }
}
export class CombatManager {
  constructor(scene, world, player, police, pedestrians, audio, hud) {
    this.scene = scene;
    this.world = world;
    this.player = player;
    this.police = police;
    this.pedestrians = pedestrians;
    this.audio = audio;
    this.hud = hud;

    this.gangMembers = [];
    this.spawnPortGang();
  }

  spawnPortGang() {
    // Spawn 6 rival cartel members in port warehouse yard
    const spots = [
      { x: 95, z: -105 },
      { x: 110, z: -115 },
      { x: 125, z: -95 },
      { x: 80, z: -125 },
      { x: 135, z: -130 },
      { x: 100, z: -140 }
    ];
    spots.forEach(p => {
      const gang = new GangMember(this.scene, this.world, p.x, p.z);
      this.gangMembers.push(gang);
    });
  }

  handlePlayerPunch() {
    if (this.audio) this.audio.playPunch();
    if (this.hud) this.hud.postMessage('Melee Strike');

    // Check hit on gang members
    for (const g of this.gangMembers) {
      if (g.state !== 'DEFEATED' && this.player.position.distanceTo(g.position) < PLAYER_CONFIG.PUNCH_RANGE) {
        const defeated = g.takeDamage(PLAYER_CONFIG.PUNCH_DAMAGE);
        if (defeated) {
          this.player.cash += 80;
          if (this.hud) this.hud.postMessage('Rival Defeated: +$80');
        }
        return;
      }
    }

    // Check hit on pedestrians
    if (this.pedestrians) {
      for (const p of this.pedestrians.pedestrians) {
        if (p.state !== 'KNOCKED_DOWN' && this.player.position.distanceTo(p.position) < PLAYER_CONFIG.PUNCH_RANGE) {
          p.takeHit(PLAYER_CONFIG.PUNCH_DAMAGE);
          if (this.police) this.police.reportCrime('HIT_PEDESTRIAN');
          return;
        }
      }
    }
  }
  handlePlayerShoot(camera) {
    if (this.player.ammo <= 0) {
      if (this.hud) this.hud.postMessage('Out of Ammo!');
      return;
    }

    this.player.ammo--;
    if (this.audio) this.audio.playGunshot();
    if (this.police) this.police.reportCrime('FIRE_WEAPON');
    if (this.pedestrians) this.pedestrians.triggerPanicAt(this.player.position);

    // Aim forward raycast
    const pPos = this.player.position;
    const forward = new THREE.Vector3(-Math.sin(this.player.cameraYaw), 0, -Math.cos(this.player.cameraYaw));

    for (const g of this.gangMembers) {
      if (g.state === 'DEFEATED') continue;
      const toG = new THREE.Vector3().subVectors(g.position, pPos);
      const dist = toG.length();
      if (dist < PLAYER_CONFIG.GUN_RANGE && forward.dot(toG.normalize()) > 0.82) {
        const defeated = g.takeDamage(PLAYER_CONFIG.GUN_DAMAGE);
        if (defeated) {
          this.player.cash += 120;
          if (this.hud) this.hud.postMessage('Rival Eliminated: +$120');
        }
        return;
      }
    }
  }

  update(dt, input, camera) {
    if (input.consumePress('KeyF')) {
      this.handlePlayerPunch();
    }
    if (input.consumeClick()) {
      this.handlePlayerShoot(camera);
    }

    for (const g of this.gangMembers) {
      g.update(dt, this.player, this.audio);
    }
  }
}
