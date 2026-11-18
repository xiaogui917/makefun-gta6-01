// Neon Tide - Main Game Controller, Lifecycle, Render Loop & Save State
import * as THREE from 'three';
import { InputHandler } from './input.js';
import { AudioManager } from './audio.js';
import { WorldManager } from './world.js';
import { Player } from './player.js';
import { VehicleManager } from './vehicles.js';
import { PedestrianManager } from './pedestrians.js';
import { PoliceManager } from './police.js';
import { MissionManager } from './missions.js';
import { CombatManager } from './combat.js';
import { HUD } from './hud.js';
import { setupDeterministicShot } from './shots.js';
import { CAMERA_CONFIG, PLAYER_CONFIG } from './config.js';

export class NeonTideGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.isPaused = false;
    this.isStarted = false;
    this.lastTime = performance.now();
    this.shotMode = null;

    this.initThree();
    this.initSystems();
    this.bindEvents();
    this.checkURLParams();

    if (!this.shotMode) {
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      1200
    );
    this.camera.position.set(-140, 6, 95);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }
  initSystems() {
    this.input = new InputHandler();
    this.audio = new AudioManager();
    this.hud = new HUD();
    this.world = new WorldManager(this.scene);
    this.player = new Player(this.scene, this.world);
    this.vehicles = new VehicleManager(this.scene, this.world);
    this.pedestrians = new PedestrianManager(this.scene, this.world);
    this.police = new PoliceManager(this.scene, this.world, this.vehicles, this.audio);
    this.missions = new MissionManager(this.scene, this.player, this.police, this.audio, this.hud);
    this.combat = new CombatManager(this.scene, this.world, this.player, this.police, this.pedestrians, this.audio, this.hud);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Start screen buttons
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.startNewGame();
      });
    }

    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        this.loadSavedGame();
        this.startNewGame(false);
      });
    }

    // Pause menu buttons
    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        this.isPaused = false;
        this.hud.togglePause(false);
      });
    }

    const btnSave = document.getElementById('btn-save');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        this.saveGameState();
        this.hud.postMessage('Game Saved Successfully!');
      });
    }

    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }
  saveGameState() {
    try {
      const state = {
        cash: this.player.cash,
        health: this.player.health,
        ammo: this.player.ammo,
        missionIndex: this.missions.currentMissionIndex
      };
      localStorage.setItem('neontide_save_v1', JSON.stringify(state));
    } catch (_) {}
  }

  loadSavedGame() {
    try {
      const raw = localStorage.getItem('neontide_save_v1');
      if (raw) {
        const state = JSON.parse(raw);
        if (state.cash != null) this.player.cash = state.cash;
        if (state.ammo != null) this.player.ammo = state.ammo;
        if (state.missionIndex != null) {
          this.missions.currentMissionIndex = state.missionIndex;
        }
      }
    } catch (_) {}
  }

  startNewGame(startFresh = true) {
    this.isStarted = true;
    this.audio.ensureContext();
    if (this.hud.startOverlay) this.hud.startOverlay.style.display = 'none';

    if (startFresh) {
      this.missions.startMission(0);
    } else {
      this.missions.startMission(this.missions.currentMissionIndex);
    }
  }

  checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      this.shotMode = shot;
      this.isStarted = true;
      setupDeterministicShot(shot, this);
      this.renderer.render(this.scene, this.camera);
    }
  }
  animate(timestamp) {
    requestAnimationFrame(this.animate);

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (this.shotMode) return;

    // Pause / Mute hotkeys
    if (this.input.consumePress('Escape') || this.input.consumePress('KeyP')) {
      this.isPaused = !this.isPaused;
      this.hud.togglePause(this.isPaused);
    }
    if (this.input.consumePress('KeyM')) {
      const isMuted = this.audio.toggleMute();
      this.hud.postMessage(isMuted ? 'Audio Muted' : 'Audio Unmuted');
    }

    if (this.isPaused) return;

    // Vehicle Enter / Exit
    const nearestCar = this.vehicles.findNearestVehicle(this.player.position, PLAYER_CONFIG.ENTER_VEHICLE_RADIUS);
    if (!this.player.isDriving && nearestCar) {
      this.hud.showPrompt('Press [E] to Enter Vehicle');
      if (this.input.consumePress('KeyE')) {
        this.player.enterVehicle(nearestCar);
        this.police.reportCrime('STEAL_CAR');
        this.hud.postMessage(`Commandeered: ${nearestCar.config.name}`);
        this.hud.showPrompt('');
      }
    } else if (this.player.isDriving) {
      this.hud.showPrompt('Press [E] to Exit Vehicle');
      if (this.input.consumePress('KeyE')) {
        this.player.exitVehicle();
        this.hud.showPrompt('');
      }
    } else {
      this.hud.showPrompt('');
    }

    // World pickups collection
    const collected = this.world.checkPickupCollect(this.player.position);
    for (const type of collected) {
      if (type === 'health') {
        this.player.health = Math.min(PLAYER_CONFIG.MAX_HEALTH, this.player.health + 40);
        this.audio.playPickup();
        this.hud.postMessage('Health Restored (+40 HP)');
      } else if (type === 'ammo') {
        this.player.ammo += 30;
        this.audio.playPickup();
        this.hud.postMessage('Ammo Collected (+30 Rounds)');
      } else if (type === 'cash') {
        this.player.cash += 250;
        this.audio.playPickup();
        this.hud.postMessage('Found Cash (+$250)');
      }
    }

    // Pedestrian vs vehicle hit checks
    const pedsHit = this.pedestrians.checkVehicleCollisions(this.vehicles.vehicles);
    if (pedsHit > 0) {
      this.police.reportCrime('HIT_PEDESTRIAN');
    }

    // Update Systems
    this.world.update(dt);
    this.player.update(dt, this.input, this.camera);
    this.vehicles.update(dt, this.input);
    this.pedestrians.update(dt, this.player.position);
    this.police.update(dt, this.player);
    this.combat.update(dt, this.input, this.camera);
    this.missions.update(dt);

    // Audio Engine pitch
    if (this.player.isDriving && this.player.currentVehicle) {
      const spdNorm = Math.abs(this.player.currentVehicle.velocity) / this.player.currentVehicle.config.maxSpeed;
      this.audio.setEnginePitchAndVolume(spdNorm, true);
    } else {
      this.audio.setEnginePitchAndVolume(0, false);
    }

    // Check Player Wasted / Hospital
    if (this.player.health <= 0) {
      this.hud.showWasted(false, () => {
        this.player.respawnAtHospital();
        this.police.clearWanted();
      });
    }

    this.hud.update(this.player, this.police, this.vehicles, this.missions);
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.neonTide = new NeonTideGame();
});
