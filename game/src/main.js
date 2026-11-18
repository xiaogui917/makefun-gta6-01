// Neon Tide - Palma Verde Chronicle (Main Entrypoint)
import * as THREE from 'three';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';
import { World } from './world.js';
import { Player } from './player.js';
import { TrafficManager } from './vehicles.js';
import { PedestrianManager } from './pedestrians.js';
import { PoliceManager } from './police.js';
import { MissionManager } from './missions.js';
import { CombatManager } from './combat.js';
import { HUD } from './hud.js';
import { setupDeterministicShot } from './shots.js';

export class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sun-drenched sky
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0022);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.input = new InputManager();
    this.audio = new AudioManager();
    this.world = new World(this.scene);
    this.player = new Player(this.scene);
    this.traffic = new TrafficManager(this.scene, this.world);
    this.pedestrians = new PedestrianManager(this.scene);
    this.police = new PoliceManager(this.scene);
    this.missions = new MissionManager(this.scene);
    this.combat = new CombatManager(this.scene);
    this.hud = new HUD();

    this.state = 'START'; // 'START', 'PLAYING', 'PAUSED', 'OVER'
    this.clock = new THREE.Clock();
    this.setupLighting();
    this.setupEvents();
    this.checkSavedGame();
  }
  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffeedd, 0x445566, 0.45);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfffaf0, 1.25);
    sun.position.set(120, 180, 90);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 450;
    const d = 160;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    this.scene.add(sun);
  }

  checkSavedGame() {
    const btnContinue = document.getElementById('btn-continue');
    try {
      const data = localStorage.getItem('neontide_save');
      if (data && btnContinue) {
        btnContinue.classList.remove('hidden');
      }
    } catch {}
  }

  saveGame() {
    try {
      const saveObj = {
        cash: this.player.cash,
        ammo: this.player.ammo,
        missionIndex: this.missions.currentMissionIndex,
        posX: this.player.position.x,
        posZ: this.player.position.z,
      };
      localStorage.setItem('neontide_save', JSON.stringify(saveObj));
      this.hud.addFeedMessage('Game Progress Saved to Local Storage');
    } catch {}
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('neontide_save');
      if (!raw) return;
      const data = JSON.parse(raw);
      this.player.cash = data.cash ?? 250;
      this.player.ammo = data.ammo ?? 60;
      this.player.position.set(data.posX ?? 0, 0, data.posZ ?? 0);
      this.player.mesh.position.copy(this.player.position);
      this.missions.startMission(data.missionIndex ?? 0);
      this.hud.addFeedMessage('Saved Game Loaded Successfully');
    } catch {}
  }
  setupEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Mute key
    this.input.onMuteToggle = () => {
      const isMuted = this.audio.toggleMute();
      this.hud.addFeedMessage(isMuted ? 'Audio Muted' : 'Audio Active');
    };

    // Pause key
    this.input.onPauseToggle = () => {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        document.getElementById('pause-screen')?.classList.remove('hidden');
      } else if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        document.getElementById('pause-screen')?.classList.add('hidden');
      }
    };

    // Buttons
    document.getElementById('btn-start')?.addEventListener('click', () => {
      this.audio.ensureContext();
      this.audio.startMusic();
      document.getElementById('start-screen')?.classList.add('hidden');
      this.hud.show();
      this.state = 'PLAYING';
      this.missions.startMission(0);
      this.container.requestPointerLock?.();
    });

    document.getElementById('btn-continue')?.addEventListener('click', () => {
      this.audio.ensureContext();
      this.audio.startMusic();
      this.loadGame();
      document.getElementById('start-screen')?.classList.add('hidden');
      this.hud.show();
      this.state = 'PLAYING';
      this.container.requestPointerLock?.();
    });

    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this.state = 'PLAYING';
      document.getElementById('pause-screen')?.classList.add('hidden');
    });

    document.getElementById('btn-save')?.addEventListener('click', () => {
      this.saveGame();
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('btn-respawn')?.addEventListener('click', () => {
      document.getElementById('death-screen')?.classList.add('hidden');
      this.player.respawn();
      this.police.setWantedLevel(0);
      this.state = 'PLAYING';
    });

    document.getElementById('btn-modal-ok')?.addEventListener('click', () => {
      document.getElementById('mission-modal')?.classList.add('hidden');
      this.state = 'PLAYING';
      this.saveGame();
      if (this.missions.currentMissionIndex < 3) {
        this.missions.startMission(this.missions.currentMissionIndex, this.traffic, this.police);
      }
    });
  }
  handleVehicleInteraction() {
    if (this.player.inVehicle) {
      // Exit vehicle
      const v = this.player.inVehicle;
      this.player.inVehicle = null;
      this.player.position.set(v.position.x + 2.4, 0, v.position.z);
      this.player.mesh.position.copy(this.player.position);
      this.player.mesh.visible = true;
      this.audio.stopEngine();
      this.hud.addFeedMessage('Exited vehicle');
    } else {
      // Enter nearest vehicle
      const nearest = this.traffic.getNearestVehicle(this.player.position, 4.2);
      if (nearest) {
        this.player.inVehicle = nearest;
        this.player.mesh.visible = false;
        if (nearest.isTraffic) {
          nearest.isTraffic = false;
          this.police.addCrime('stealVehicle', (w) => {
            this.hud.addFeedMessage(`Carjacked civilian ride! Wanted +1 Star`);
          });
        }
        this.hud.addFeedMessage(`Driving ${nearest.type.name}`);
      }
    }
  }

  updateCamera(dt) {
    const { dx, dy } = this.input.consumeMouseDelta();
    this.player.updateCameraAngles(dx, dy);

    if (this.player.inVehicle) {
      const v = this.player.inVehicle;
      const targetPos = v.position;
      const targetCam = new THREE.Vector3(
        targetPos.x - Math.sin(v.heading) * 7.5,
        targetPos.y + 3.2,
        targetPos.z - Math.cos(v.heading) * 7.5
      );
      this.camera.position.lerp(targetCam, dt * 8);
      this.camera.lookAt(targetPos.x, targetPos.y + 1.2, targetPos.z);
    } else {
      const target = this.player.getCameraTarget();
      const yaw = this.player.camYaw;
      const pitch = this.player.camPitch;
      const dist = this.player.camDistance;

      const cx = target.x - Math.sin(yaw) * Math.cos(pitch) * dist;
      const cy = target.y + Math.sin(pitch) * dist;
      const cz = target.z - Math.cos(yaw) * Math.cos(pitch) * dist;

      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(target);
    }
  }
  start() {
    const urlParams = new URLSearchParams(window.location.search);
    const shotParam = urlParams.get('shot');

    if (shotParam) {
      // Deterministic screenshot render
      setupDeterministicShot(shotParam, this);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // Normal play loop
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.1);
      const time = this.clock.getElapsedTime();

      if (this.state === 'PLAYING') {
        if (this.input.isActionEnterExit()) {
          this.handleVehicleInteraction();
        }

        if (this.player.inVehicle) {
          this.player.inVehicle.updateDriving(dt, this.input, this.world.colliders);
          this.player.position.copy(this.player.inVehicle.position);
          this.audio.updateEngine(this.player.inVehicle.velocity / this.player.inVehicle.type.maxSpeed);
        } else {
          this.player.updateOnFoot(dt, this.input, this.world.colliders);
          this.player.checkPickups(this.world, this.audio, (msg) => this.hud.addFeedMessage(msg));
          this.audio.stopEngine();
        }

        if (this.input.isActionPunch()) {
          this.combat.punch(this.player, this.pedestrians, this.police, this.audio, (msg) => this.hud.addFeedMessage(msg));
        }

        if (this.input.isActionShoot()) {
          this.combat.shoot(this.player, this.pedestrians, this.police, this.audio, (msg) => this.hud.addFeedMessage(msg));
        }

        this.combat.update(dt, this.player, this.audio);
        this.traffic.update(dt, time, this.player);
        this.pedestrians.update(dt, this.player, (ped) => {
          this.police.addCrime('hitPedestrian');
          this.hud.addFeedMessage('Hit pedestrian! +2 Wanted Stars');
        });

        this.police.update(dt, time, this.player, this.audio, (reason) => {
          this.state = 'OVER';
          const deathScreen = document.getElementById('death-screen');
          const deathTitle = document.getElementById('death-title');
          if (deathTitle) deathTitle.textContent = reason;
          deathScreen?.classList.remove('hidden');
        }, (stars) => {
          this.hud.addFeedMessage(stars > 0 ? `Wanted Heat Level: ${stars} Stars` : 'Heat Lost - Wanted Cooldown Expired');
        });

        this.missions.update(dt, this.player, this.police, this.audio, (res) => {
          this.state = 'PAUSED';
          const modal = document.getElementById('mission-modal');
          const title = document.getElementById('modal-title');
          const desc = document.getElementById('modal-desc');
          const rew = document.getElementById('modal-reward');
          if (title) title.textContent = res.title;
          if (desc) desc.textContent = res.name;
          if (rew) rew.textContent = `+$${res.reward} CASH`;
          modal?.classList.remove('hidden');
        }, (failMsg) => {
          this.hud.addFeedMessage(failMsg);
        }, (feed) => {
          this.hud.addFeedMessage(feed);
        });

        this.world.update(dt, time);
        this.updateCamera(dt);
        this.hud.updateStats(this.player, this.police, this.missions);
        this.hud.renderMinimap(this.player, this.traffic, this.police, this.missions);
      } else if (this.state === 'START') {
        // Slow scenic camera sweep
        this.camera.position.set(-150 + Math.sin(time * 0.2) * 20, 18, -40 + Math.cos(time * 0.2) * 20);
        this.camera.lookAt(-210, 2, 20);
        this.world.update(dt, time);
      }

      this.input.update();
      this.renderer.render(this.scene, this.camera);
    };

    requestAnimationFrame(loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
