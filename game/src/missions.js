// Missions and Story Progression System for Neon Tide
import * as THREE from 'three';
import { MISSIONS_DATA } from './config.js';

export class MissionManager {
  constructor(scene) {
    this.scene = scene;
    this.currentMissionIndex = 0;
    this.activeMission = null;
    this.missionTimer = 0;
    this.stage = 'START'; // 'START', 'PICKUP', 'DELIVERY', 'COMPLETE'
    this.targetVehicle = null;

    // 3D Waypoint beacon marker
    this.markerGroup = new THREE.Group();
    this.buildWaypointMarker();
    this.scene.add(this.markerGroup);
    this.markerGroup.visible = false;
  }

  buildWaypointMarker() {
    // Vertical light beam cylinder
    const cylGeo = new THREE.CylinderGeometry(1.6, 1.6, 25, 16, 1, true);
    const cylMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.y = 12.5;
    this.markerGroup.add(cyl);

    // Ground ring
    const ringGeo = new THREE.RingGeometry(1.4, 2.2, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    this.markerGroup.add(ring);
  }

  setMarkerPosition(x, z) {
    this.markerGroup.position.set(x, 0, z);
    this.markerGroup.visible = true;
  }

  hideMarker() {
    this.markerGroup.visible = false;
  }
  startMission(index = 0, trafficManager = null, policeManager = null) {
    if (index >= MISSIONS_DATA.length) return false;
    this.currentMissionIndex = index;
    this.activeMission = MISSIONS_DATA[index];
    this.missionTimer = this.activeMission.timeLimit || 0;

    if (this.activeMission.id === 'mission_1') {
      this.stage = 'PICKUP';
      // Find or spawn sports car near spawnPos
      this.setMarkerPosition(this.activeMission.spawnPos.x, this.activeMission.spawnPos.z);
    } else if (this.activeMission.id === 'mission_2') {
      this.stage = 'PICKUP';
      this.setMarkerPosition(this.activeMission.pickupPos.x, this.activeMission.pickupPos.z);
    } else if (this.activeMission.id === 'mission_3') {
      this.stage = 'DELIVERY';
      this.setMarkerPosition(this.activeMission.safehousePos.x, this.activeMission.safehousePos.z);
      if (policeManager) {
        policeManager.setWantedLevel(3);
      }
    }
    return true;
  }

  getCurrentObjective() {
    if (!this.activeMission) {
      return {
        title: 'Palma Verde',
        desc: 'Explore the city, acquire weapons and vehicles, or trigger wanted heat.',
        timerText: null,
      };
    }

    let desc = this.activeMission.desc;
    if (this.activeMission.id === 'mission_1') {
      desc = this.stage === 'PICKUP' ? 'Locate and steal the Neon GT sports car at Grand Coral Hotel.' : 'Deliver the Neon GT to Leo’s Chop Shop in Puerto Industrial.';
    } else if (this.activeMission.id === 'mission_2') {
      desc = this.stage === 'PICKUP' ? 'Pick up encrypted drives at Downtown Tech Hub.' : 'Deliver the drives to Oceanfront contact before time runs out!';
    } else if (this.activeMission.id === 'mission_3') {
      desc = 'Evade 3-star tactical police lockdown and reach the North Beach Safehouse!';
    }

    let timerText = null;
    if (this.missionTimer > 0) {
      const mins = Math.floor(this.missionTimer / 60);
      const secs = Math.floor(this.missionTimer % 60);
      timerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return {
      title: `${this.activeMission.name} (${this.currentMissionIndex + 1}/3)`,
      desc,
      timerText,
    };
  }
  update(dt, player, policeManager, audio, onComplete, onFail, onFeed) {
    if (!this.activeMission) return;

    // Rotate waypoint beacon
    if (this.markerGroup.visible) {
      this.markerGroup.rotation.y += dt * 1.5;
    }

    const playerPos = player.inVehicle ? player.inVehicle.position : player.position;

    // Timer check for timed missions
    if (this.missionTimer > 0) {
      this.missionTimer -= dt;
      if (this.missionTimer <= 0) {
        if (onFail) onFail('TIME EXPIRED - DELIVERY FAILED');
        this.activeMission = null;
        this.hideMarker();
        return;
      }
    }

    // Mission 1: First Wheels
    if (this.activeMission.id === 'mission_1') {
      if (this.stage === 'PICKUP') {
        if (player.inVehicle && player.inVehicle.typeKey === 'SPORTS') {
          this.stage = 'DELIVERY';
          this.setMarkerPosition(this.activeMission.dropoffPos.x, this.activeMission.dropoffPos.z);
          if (onFeed) onFeed('Neon GT acquired! Proceed to Puerto Industrial dropoff.');
        }
      } else if (this.stage === 'DELIVERY') {
        const dist = playerPos.distanceTo(this.markerGroup.position);
        if (dist < 8.0 && player.inVehicle) {
          this.completeCurrentMission(player, audio, onComplete);
        }
      }
    }
    // Mission 2: Bay Courier
    else if (this.activeMission.id === 'mission_2') {
      if (this.stage === 'PICKUP') {
        const dist = playerPos.distanceTo(this.markerGroup.position);
        if (dist < 5.0) {
          this.stage = 'DELIVERY';
          this.setMarkerPosition(this.activeMission.dropoffPos.x, this.activeMission.dropoffPos.z);
          if (onFeed) onFeed('Drives collected! 90-second countdown started!');
        }
      } else if (this.stage === 'DELIVERY') {
        const dist = playerPos.distanceTo(this.markerGroup.position);
        if (dist < 7.0) {
          this.completeCurrentMission(player, audio, onComplete);
        }
      }
    }
    // Mission 3: Heat Run
    else if (this.activeMission.id === 'mission_3') {
      const dist = playerPos.distanceTo(this.markerGroup.position);
      if (dist < 7.0) {
        if (policeManager) policeManager.setWantedLevel(0);
        this.completeCurrentMission(player, audio, onComplete);
      }
    }
  }

  completeCurrentMission(player, audio, onComplete) {
    const reward = this.activeMission.reward;
    const missionName = this.activeMission.name;
    player.cash += reward;
    audio.playMissionComplete();
    this.hideMarker();

    if (onComplete) {
      onComplete({
        title: 'MISSION COMPLETE',
        name: missionName,
        reward,
        nextIndex: this.currentMissionIndex + 1,
      });
    }

    this.activeMission = null;
    this.currentMissionIndex++;
  }
}
