// Neon Tide - Story Campaign & Mission Manager
// Storyline of Dante Rios in Palma Verde

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class MissionManager {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;

    this.currentMissionIndex = 0;
    this.activeMission = null;
    this.missionState = 'IDLE'; // IDLE, ACTIVE, PASSED, FAILED
    this.stepIndex = 0;
    this.timer = 0;
    this.completedCount = 0;

    // Visual 3D Waypoint Beacon
    this.waypointMesh = this.createWaypointMarker();
    this.scene.add(this.waypointMesh);
    this.waypointMesh.visible = false;
  }

  createWaypointMarker() {
    const group = new THREE.Group();

    // High vertical neon beam of light
    const beamGeo = new THREE.CylinderGeometry(2.5, 2.5, 60, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 30;
    group.add(beam);

    // Glowing ground ring
    const ringGeo = new THREE.RingGeometry(2.0, 3.8, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd600,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.15;
    group.add(ring);

    group.userData = { beam, ring };
    return group;
  }

  startMission(index) {
    if (index >= CONFIG.MISSIONS.length) return false;

    this.currentMissionIndex = index;
    this.activeMission = CONFIG.MISSIONS[index];
    this.missionState = 'ACTIVE';
    this.stepIndex = 0;
    this.timer = this.activeMission.timeLimit || 0;

    this.updateWaypointPosition();
    return true;
  }

  update(dt, player, police, onMissionPassed) {
    if (this.missionState !== 'ACTIVE' || !this.activeMission) {
      this.waypointMesh.visible = false;
      return;
    }

    // Animate waypoint beacon rotation & pulse
    this.waypointMesh.visible = true;
    this.waypointMesh.rotation.y += dt * 1.5;
    const pulse = 1.0 + Math.sin(Date.now() * 0.005) * 0.15;
    this.waypointMesh.scale.set(pulse, 1.0, pulse);

    // Handle Mission-specific objectives
    const missionId = this.activeMission.id;

    if (missionId === 'm1_first_wheels') {
      this.updateMission1(dt, player, onMissionPassed);
    } else if (missionId === 'm2_bay_courier') {
      this.updateMission2(dt, player, onMissionPassed);
    } else if (missionId === 'm3_heat_run') {
      this.updateMission3(dt, player, police, onMissionPassed);
    }
  }

  updateMission1(dt, player, onMissionPassed) {
    // Step 0: Find & Enter sports car
    if (this.stepIndex === 0) {
      if (player.inVehicle && player.currentVehicle && player.currentVehicle.preset.type === 'sport') {
        this.stepIndex = 1;
        this.updateWaypointPosition();
      }
    } else if (this.stepIndex === 1) {
      // Step 1: Deliver car to Harbor Garage drop point
      const target = this.activeMission.dropPoint;
      const dist = Math.hypot(player.position.x - target.x, player.position.z - target.z);

      if (dist < this.activeMission.tolerance && player.inVehicle) {
        this.completeCurrentMission(player, onMissionPassed);
      }
    }
  }

  updateMission2(dt, player, onMissionPassed) {
    // Timed checkpoints delivery
    this.timer -= dt;
    if (this.timer <= 0) {
      this.missionState = 'FAILED';
      this.waypointMesh.visible = false;
      return;
    }

    const checkpoints = this.activeMission.checkpoints;
    const currentCp = checkpoints[this.stepIndex];
    const dist = Math.hypot(player.position.x - currentCp.x, player.position.z - currentCp.z);

    if (dist < this.activeMission.tolerance) {
      this.stepIndex++;
      this.audio.playPickup();

      if (this.stepIndex >= checkpoints.length) {
        this.completeCurrentMission(player, onMissionPassed);
      } else {
        this.updateWaypointPosition();
      }
    }
  }

  updateMission3(dt, player, police, onMissionPassed) {
    // Heat run: Start with 3 stars wanted
    if (this.stepIndex === 0) {
      police.setWantedLevel(3);
      this.stepIndex = 1;
      this.updateWaypointPosition();
    }

    const safehouse = this.activeMission.safehousePoint;
    const dist = Math.hypot(player.position.x - safehouse.x, player.position.z - safehouse.z);

    if (dist < this.activeMission.tolerance) {
      police.setWantedLevel(0);
      this.completeCurrentMission(player, onMissionPassed);
    }
  }

  completeCurrentMission(player, onMissionPassed) {
    this.missionState = 'PASSED';
    this.waypointMesh.visible = false;
    this.completedCount = Math.max(this.completedCount, this.currentMissionIndex + 1);

    const reward = this.activeMission.reward;
    player.cash += reward;
    this.audio.playMissionSuccess();

    if (onMissionPassed) {
      onMissionPassed(this.activeMission);
    }
  }

  updateWaypointPosition() {
    if (!this.activeMission) return;

    let target = { x: 0, z: 0 };
    if (this.activeMission.id === 'm1_first_wheels') {
      target = this.stepIndex === 0 ? this.activeMission.startPoint : this.activeMission.dropPoint;
    } else if (this.activeMission.id === 'm2_bay_courier') {
      target = this.activeMission.checkpoints[this.stepIndex] || { x: 0, z: 0 };
    } else if (this.activeMission.id === 'm3_heat_run') {
      target = this.activeMission.safehousePoint;
    }

    this.waypointMesh.position.set(target.x, 0, target.z);
  }

  getCurrentObjectiveText(player) {
    if (this.missionState !== 'ACTIVE' || !this.activeMission) {
      return { title: 'FREE ROAM', detail: 'Explore Palma Verde. Steal cars, collect cash, evade police.' };
    }

    const m = this.activeMission;
    if (m.id === 'm1_first_wheels') {
      if (this.stepIndex === 0) {
        const dist = Math.round(Math.hypot(player.position.x - m.startPoint.x, player.position.z - m.startPoint.z));
        return { title: m.title, detail: `Hotwire the red Vipera GT near Club Neon (${dist}m)` };
      } else {
        const dist = Math.round(Math.hypot(player.position.x - m.dropPoint.x, player.position.z - m.dropPoint.z));
        return { title: m.title, detail: `Deliver vehicle to Lorenzo's Harbor Garage (${dist}m)` };
      }
    } else if (m.id === 'm2_bay_courier') {
      const cp = m.checkpoints[this.stepIndex];
      const dist = Math.round(Math.hypot(player.position.x - cp.x, player.position.z - cp.z));
      const secs = Math.ceil(this.timer);
      return {
        title: m.title,
        detail: `Checkpoint ${this.stepIndex + 1}/${m.checkpoints.length} along coastal road (${dist}m) [${secs}s remaining]`,
      };
    } else if (m.id === 'm3_heat_run') {
      const dist = Math.round(Math.hypot(player.position.x - m.safehousePoint.x, player.position.z - m.safehousePoint.z));
      return { title: m.title, detail: `Evade 3-Star pursuit & reach safehouse hideout (${dist}m)` };
    }

    return { title: m.title, detail: 'In progress' };
  }

  getWaypointCoords() {
    if (this.missionState !== 'ACTIVE' || !this.activeMission) return null;
    return { x: this.waypointMesh.position.x, z: this.waypointMesh.position.z };
  }
}
