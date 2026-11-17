// Neon Tide - Main Entrypoint & Game Loop
// Palma Verde 3D Open World

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';
import { World } from './world.js';
import { Player } from './player.js';
import { VehicleManager } from './vehicles.js';
import { PedestrianManager } from './pedestrians.js';
import { PoliceManager } from './police.js';
import { MissionManager } from './missions.js';
import { CombatManager } from './combat.js';
import { HUDManager } from './hud.js';
import { setupShotMode } from './shots.js';

export class Game {
  constructor() {
    this.state = 'START'; // START, PLAYING, PAUSED, BUSTED, WASTED
    this.clock = new THREE.Clock();

    // Three.js Core
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = null;

    // Subsystems
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.world = null;
    this.player = null;
    this.vehicles = null;
    this.pedestrians = null;
    this.police = null;
    this.missions = null;
    this.combat = null;
    this.hud = null;

    this.isShotMode = false;
  }

  init() {
    // Canvas & WebGL Renderer
    const canvas = document.getElementById('game-canvas') || document.getElementById('game');
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize Subsystems
    this.input.init(canvas);
    this.world = new World(this.scene);
    this.world.build();

    this.player = new Player(this.scene, this.camera);
    this.vehicles = new VehicleManager(this.scene, this.audio);
    this.vehicles.init();

    this.pedestrians = new PedestrianManager(this.scene, this.audio);
    this.pedestrians.init(this.world);

    this.police = new PoliceManager(this.scene, this.audio, this.vehicles);
    this.missions = new MissionManager(this.scene, this.audio);
    this.combat = new CombatManager(this.scene, this.audio);
    this.combat.init(this.world);

    this.hud = new HUDManager();
    this.hud.init(
      () => this.startNewGame(),
      () => this.loadGame(),
      () => this.resumeGame(),
      () => this.saveGame(),
      () => this.restartGame(),
      () => this.toggleMute(),
    );

    // Window Resize Handler
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Check for Deterministic Screenshot Mode (?shot=start|drive|chase|mission)
    const urlParams = new URLSearchParams(window.location.search);
    const shotParam = urlParams.get('shot');

    if (shotParam) {
      this.isShotMode = true;
      setupShotMode(shotParam, this);
    } else {
      // Normal game start
      this.state = 'START';
      this.camera.position.set(-180, 45, 120);
      this.camera.lookAt(-20, 25, -20);
    }

    // Start Animation Loop
    this.loop();
  }

  startNewGame() {
    this.audio.init();
    this.audio.startMusic();
    this.state = 'PLAYING';
    this.player.position.set(0, 0.5, 0);
    this.player.health = CONFIG.PLAYER.MAX_HEALTH;
    this.player.cash = CONFIG.PLAYER.START_CASH;
    this.missions.startMission(0); // Start Mission 1: First Wheels
    this.input.requestPointerLock();
  }

  resumeGame() {
    this.state = 'PLAYING';
    this.input.requestPointerLock();
  }

  pauseGame() {
    this.state = 'PAUSED';
    this.hud.pauseScreen.style.display = 'flex';
    this.input.exitPointerLock();
  }

  restartGame() {
    this.state = 'PLAYING';
    this.player.respawn();
    this.police.setWantedLevel(0);
    this.missions.startMission(0);
    this.input.requestPointerLock();
  }

  toggleMute() {
    const isMuted = this.audio.toggleMute();
    this.hud.showToast(isMuted ? 'Audio Muted' : 'Audio Enabled');
  }

  saveGame() {
    const saveData = {
      cash: this.player.cash,
      health: this.player.health,
      ammo: this.player.ammo,
      completedCount: this.missions.completedCount,
      missionIndex: this.missions.currentMissionIndex,
      posX: this.player.position.x,
      posZ: this.player.position.z,
    };
    try {
      localStorage.setItem('neontide_save', JSON.stringify(saveData));
    } catch (_) {}
  }

  loadGame() {
    this.audio.init();
    this.audio.startMusic();
    try {
      const raw = localStorage.getItem('neontide_save');
      if (raw) {
        const data = JSON.parse(raw);
        this.player.cash = data.cash || CONFIG.PLAYER.START_CASH;
        this.player.health = data.health || CONFIG.PLAYER.MAX_HEALTH;
        this.player.ammo = data.ammo || CONFIG.PLAYER.START_AMMO;
        this.player.position.set(data.posX || 0, 0.5, data.posZ || 0);
        this.missions.completedCount = data.completedCount || 0;
        this.missions.startMission(data.missionIndex || 0);
      } else {
        this.startNewGame();
        return;
      }
    } catch (_) {
      this.startNewGame();
      return;
    }

    this.state = 'PLAYING';
    this.input.requestPointerLock();
  }

  handleBusted() {
    this.state = 'BUSTED';
    this.audio.stopSiren();
    this.player.cash = Math.max(0, this.player.cash - CONFIG.WANTED.BUSTED_FEE);
    this.input.exitPointerLock();

    this.hud.showBusted(false, CONFIG.WANTED.BUSTED_FEE, () => {
      this.player.respawn();
      this.state = 'PLAYING';
      this.input.requestPointerLock();
    });
  }

  handleWasted() {
    this.state = 'WASTED';
    this.audio.stopSiren();
    this.player.cash = Math.max(0, this.player.cash - CONFIG.WANTED.HOSPITAL_FEE);
    this.input.exitPointerLock();

    this.hud.showBusted(true, CONFIG.WANTED.HOSPITAL_FEE, () => {
      this.player.respawn();
      this.state = 'PLAYING';
      this.input.requestPointerLock();
    });
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    const delta = this.clock.getDelta();
    const dt = Math.min(delta, 0.05);
    const elapsed = this.clock.getElapsedTime();

    if (!this.isShotMode) {
      // Toggle Pause
      if (this.input.justPause()) {
        if (this.state === 'PLAYING') this.pauseGame();
        else if (this.state === 'PAUSED') this.resumeGame();
      }

      // Toggle Mute
      if (this.input.justMute()) {
        this.toggleMute();
      }
    }

    if (this.state === 'PLAYING') {
      // Update Subsystems
      this.world.update(dt, elapsed);
      this.player.update(dt, this.input, this.world, this.vehicles.vehicles);
      this.vehicles.update(dt, this.input, this.world, this.player);
      this.pedestrians.update(dt, this.player, this.vehicles, this.world, (crime) => {
        this.police.reportCrime(crime);
      });
      this.police.update(
        dt,
        this.player,
        this.world,
        () => this.handleBusted(),
        () => this.handleWasted(),
      );
      this.missions.update(dt, this.player, this.police, (mission) => {
        this.hud.showMissionPassed(mission);
        this.saveGame();
      });
      this.combat.update(
        dt,
        this.input,
        this.player,
        this.pedestrians,
        this.police,
        this.vehicles,
        this.world,
      );

      // Check item pickups
      for (const p of this.world.pickups) {
        if (!p.active) continue;
        if (Math.hypot(this.player.position.x - p.x, this.player.position.z - p.z) < 2.4) {
          p.active = false;
          p.group.visible = false;
          p.respawnTimer = CONFIG.PICKUPS.RESPAWN_TIME;
          this.audio.playPickup();

          if (p.type === 'HEALTH') {
            this.player.health = Math.min(CONFIG.PLAYER.MAX_HEALTH, this.player.health + p.value);
            this.hud.showToast('+40 HP Health Picked Up');
          } else if (p.type === 'AMMO') {
            this.player.ammo = Math.min(CONFIG.PLAYER.MAX_AMMO, this.player.ammo + p.value);
            this.hud.showToast('+30 Rounds Pistol Ammo');
          } else if (p.type === 'CASH') {
            this.player.cash += p.value;
            this.hud.showToast(`+$${p.value} Cash Briefcase`);
          }
        }
      }

      this.hud.update(dt, this.player, this.police, this.missions, this.world, this.vehicles);
      this.input.update();
    } else if (this.isShotMode) {
      // In shot mode, keep world and HUD updated
      this.world.update(dt, elapsed);
      this.hud.update(dt, this.player, this.police, this.missions, this.world, this.vehicles);
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Bootstrap game when window loads
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();
});
