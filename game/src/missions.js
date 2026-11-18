// Neon Tide - Story Missions, Objectives, Waypoints & Progression System
import * as THREE from 'three';
import { ECONOMY_CONFIG } from './config.js';

export const MISSIONS_DATA = [
  {
    id: 1,
    title: 'First Wheels',
    subtitle: 'Steal & Deliver',
    intro: 'Welcome to Palma Verde. Boost a sports car parked on Ocean Drive and deliver it to the Port chop shop.',
    reward: ECONOMY_CONFIG.MISSION_REWARDS[0],
    steps: [
      { text: 'Steal a sports car from Oceanfront', target: new THREE.Vector3(-140, 0, 70), radius: 5.0, requiresVehicle: 'sports' },
      { text: 'Deliver the sports car to the Port chop shop', target: new THREE.Vector3(120, 0, -110), radius: 6.0, inVehicle: true }
    ]
  },
  {
    id: 2,
    title: 'Bay Courier',
    subtitle: 'Timed Express Delivery',
    intro: 'Priority package at the Port. Pick it up and race cross-city to the Downtown high-rise before time runs out!',
    reward: ECONOMY_CONFIG.MISSION_REWARDS[1],
    timeLimit: 90,
    steps: [
      { text: 'Pick up the package at Port Warehouse', target: new THREE.Vector3(100, 0, -140), radius: 4.5 },
      { text: 'Deliver the package to Downtown High-rise', target: new THREE.Vector3(-30, 0, 120), radius: 6.0 }
    ]
  },
  {
    id: 3,
    title: 'Heat Run',
    subtitle: 'High-Speed Syndicate Evasion',
    intro: 'The precinct set up a citywide dragnet! Survive 3-Star wanted heat and reach the safehouse garage!',
    reward: ECONOMY_CONFIG.MISSION_REWARDS[2],
    triggerWanted: 3,
    steps: [
      { text: 'Evade police dragnet and reach Safehouse', target: new THREE.Vector3(140, 0, 130), radius: 6.5 }
    ]
  }
];
export class MissionManager {
  constructor(scene, player, policeManager, audio, hud) {
    this.scene = scene;
    this.player = player;
    this.police = policeManager;
    this.audio = audio;
    this.hud = hud;

    this.currentMissionIndex = 0; // 0, 1, 2
    this.currentStepIndex = 0;
    this.missionActive = false;
    this.timerRemaining = 0;

    this.beaconMesh = this.createBeaconMesh();
    this.scene.add(this.beaconMesh);
    this.beaconMesh.visible = false;
  }

  createBeaconMesh() {
    const group = new THREE.Group();

    // Vertical cylinder light column
    const beamGeo = new THREE.CylinderGeometry(1.8, 1.8, 45, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff0077,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 22.5;
    group.add(beam);

    // Floating diamond marker
    const markerGeo = new THREE.OctahedronGeometry(1.4, 0);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    this.diamond = new THREE.Mesh(markerGeo, markerMat);
    this.diamond.position.y = 2.5;
    group.add(this.diamond);

    return group;
  }

  startMission(index) {
    if (index >= MISSIONS_DATA.length) return;
    this.currentMissionIndex = index;
    this.currentStepIndex = 0;
    this.missionActive = true;

    const data = MISSIONS_DATA[index];
    this.timerRemaining = data.timeLimit || 0;

    if (data.triggerWanted && this.police) {
      this.police.setWantedLevel(data.triggerWanted);
    }

    this.updateBeaconPosition();
    if (this.hud) {
      this.hud.showMission(data.title, data.steps[0].text, this.timerRemaining);
      this.hud.postMessage(`MISSION STARTED: ${data.title}`);
    }
  }
  updateBeaconPosition() {
    const data = MISSIONS_DATA[this.currentMissionIndex];
    if (!data || !this.missionActive) {
      this.beaconMesh.visible = false;
      return;
    }
    const step = data.steps[this.currentStepIndex];
    if (step && step.target) {
      this.beaconMesh.position.set(step.target.x, 0, step.target.z);
      this.beaconMesh.visible = true;
    } else {
      this.beaconMesh.visible = false;
    }
  }

  getActiveTarget() {
    if (!this.missionActive) return null;
    const data = MISSIONS_DATA[this.currentMissionIndex];
    if (!data) return null;
    const step = data.steps[this.currentStepIndex];
    return step ? step.target : null;
  }

  completeMission() {
    const data = MISSIONS_DATA[this.currentMissionIndex];
    this.player.cash += data.reward;
    this.missionActive = false;
    this.beaconMesh.visible = false;

    if (this.audio) this.audio.playMissionComplete();
    if (this.hud) {
      this.hud.showMission('MISSION COMPLETE!', `Earned $${data.reward}`, 0);
      this.hud.postMessage(`MISSION COMPLETE: +$${data.reward}`);
    }

    if (this.police && data.triggerWanted) {
      this.police.clearWanted();
    }

    // Auto-advance to next mission after 4s
    setTimeout(() => {
      if (this.currentMissionIndex + 1 < MISSIONS_DATA.length) {
        this.startMission(this.currentMissionIndex + 1);
      } else {
        if (this.hud) {
          this.hud.showMission('ALL MISSIONS COMPLETED', 'Palma Verde is yours!', 0);
          this.hud.postMessage('VICTORY: Palma Verde Underworld Conquered!');
        }
      }
    }, 4000);
  }
  failMission(reason = 'Mission Failed!') {
    this.missionActive = false;
    this.beaconMesh.visible = false;
    if (this.hud) {
      this.hud.showMission('MISSION FAILED', reason, 0);
      this.hud.postMessage(`FAILED: ${reason}`);
    }
  }

  update(dt) {
    if (!this.missionActive) return;

    // Animate beacon diamond
    if (this.diamond) {
      this.diamond.rotation.y += dt * 2.2;
      this.diamond.rotation.x += dt * 1.1;
    }

    const data = MISSIONS_DATA[this.currentMissionIndex];
    if (!data) return;

    // Countdown timer if applicable
    if (this.timerRemaining > 0) {
      this.timerRemaining -= dt;
      if (this.hud) this.hud.updateTimer(this.timerRemaining);
      if (this.timerRemaining <= 0) {
        this.failMission('Time Expired!');
        return;
      }
    }

    // Check step condition
    const step = data.steps[this.currentStepIndex];
    if (!step) return;

    // Proximity check to step target
    const dist = this.player.position.distanceTo(step.target);
    if (dist < step.radius) {
      if (step.requiresVehicle && (!this.player.isDriving || this.player.currentVehicle.config.type !== step.requiresVehicle)) {
        // Needs specific vehicle
        return;
      }
      if (step.inVehicle && !this.player.isDriving) {
        return;
      }

      // Step completed!
      this.currentStepIndex++;
      if (this.currentStepIndex >= data.steps.length) {
        this.completeMission();
      } else {
        const nextStep = data.steps[this.currentStepIndex];
        this.updateBeaconPosition();
        if (this.hud) {
          this.hud.showMission(data.title, nextStep.text, this.timerRemaining);
          this.hud.postMessage(`OBJECTIVE: ${nextStep.text}`);
        }
      }
    }
  }
}
