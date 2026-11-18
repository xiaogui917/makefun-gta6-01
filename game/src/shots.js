// Deterministic Screenshot Mode for Neon Tide: Palma Verde
import * as THREE from 'three';
import { Vehicle } from './vehicles.js';

export function setupDeterministicShot(shotType, game) {
  if (!shotType) return false;

  const { player, world, traffic, police, missions, hud, camera } = game;

  if (shotType === 'start') {
    // Title Start Screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.remove('hidden');
    hud.hide();

    // Position camera overlooking ocean and palm strip
    camera.position.set(-150, 18, -40);
    camera.lookAt(-210, 2, 20);
    return true;
  }

  // Hide start menu for in-game action shots
  const startScreen = document.getElementById('start-screen');
  if (startScreen) startScreen.classList.add('hidden');
  hud.show();

  if (shotType === 'drive') {
    // Driving sleek sports car in Downtown boulevard
    const car = new Vehicle('SPORTS', world.scene, false);
    car.position.set(20, 0, -50);
    car.heading = Math.PI * 0.95;
    car.velocity = 22.0;
    car.group.position.copy(car.position);
    car.group.rotation.y = car.heading;

    player.inVehicle = car;
    player.mesh.visible = false;
    player.cash = 1250;
    player.ammo = 90;

    // Traffic car ahead
    if (traffic.vehicles.length > 0) {
      traffic.vehicles[0].position.set(20, 0, 15);
      traffic.vehicles[0].velocity = 12;
      traffic.vehicles[0].heading = Math.PI;
      traffic.vehicles[0].group.position.copy(traffic.vehicles[0].position);
    }
    // Cinematic chase camera behind car
    const camBack = new THREE.Vector3(
      car.position.x - Math.sin(car.heading) * 8.5,
      car.position.y + 3.8,
      car.position.z - Math.cos(car.heading) * 8.5
    );
    camera.position.copy(camBack);
    camera.lookAt(car.position.x, car.position.y + 1.2, car.position.z);

    hud.updateStats(player, police, missions);
    hud.renderMinimap(player, traffic, police, missions);
    return true;
  }

  if (shotType === 'chase') {
    // 3-Star Police Pursuit
    const car = new Vehicle('SPORTS', world.scene, false);
    car.position.set(-60, 0, -80);
    car.heading = Math.PI * 0.45;
    car.velocity = 25.5;
    car.group.position.copy(car.position);
    car.group.rotation.y = car.heading;

    player.inVehicle = car;
    player.mesh.visible = false;
    player.cash = 2400;
    player.ammo = 120;

    police.wantedStars = 3;

    // Place police cruiser close behind in pursuit
    const cruiser = new Vehicle('POLICE', world.scene, false);
    cruiser.position.set(
      car.position.x - Math.sin(car.heading) * 11.0 + 3.5,
      0,
      car.position.z - Math.cos(car.heading) * 11.0
    );
    cruiser.heading = car.heading + 0.1;
    cruiser.velocity = 26.0;
    cruiser.sirenActive = true;
    cruiser.group.position.copy(cruiser.position);
    cruiser.group.rotation.y = cruiser.heading;
    police.units = [{ type: 'CRUISER', entity: cruiser }];
    // Camera angled to see player car and pursuing police cruiser
    const camPos = new THREE.Vector3(
      car.position.x - Math.sin(car.heading) * 12.0 - 4.5,
      car.position.y + 4.2,
      car.position.z - Math.cos(car.heading) * 12.0 + 3.0
    );
    camera.position.copy(camPos);
    camera.lookAt(car.position.x + 2, car.position.y + 1.2, car.position.z);

    hud.updateStats(player, police, missions);
    hud.renderMinimap(player, traffic, police, missions);
    return true;
  }

  if (shotType === 'mission') {
    // Mission 2: Bay Courier in progress
    missions.startMission(1);
    missions.stage = 'DELIVERY';
    missions.missionTimer = 78; // 01:18 remaining
    missions.setMarkerPosition(-180, 80);

    const car = new Vehicle('SEDAN', world.scene, false);
    car.position.set(-110, 0, 78);
    car.heading = -Math.PI / 2; // Driving west toward Oceanfront dropoff
    car.velocity = 19.5;
    car.group.position.copy(car.position);
    car.group.rotation.y = car.heading;

    player.inVehicle = car;
    player.mesh.visible = false;
    player.cash = 1850;
    player.ammo = 80;

    // Camera following sedan with golden waypoint beam framed ahead
    const camPos = new THREE.Vector3(
      car.position.x - Math.sin(car.heading) * 9.0,
      car.position.y + 3.5,
      car.position.z - Math.cos(car.heading) * 9.0
    );
    camera.position.copy(camPos);
    camera.lookAt(car.position.x - 18, car.position.y + 2.0, car.position.z);

    hud.updateStats(player, police, missions);
    hud.renderMinimap(player, traffic, police, missions);
    return true;
  }

  return false;
}
