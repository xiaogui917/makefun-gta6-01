// Neon Tide - Deterministic Screenshot Scenes
// Supports ?shot=start, ?shot=drive, ?shot=chase, ?shot=mission

import * as THREE from 'three';
import { CONFIG } from './config.js';

export function setupShotMode(shotName, game) {
  const { scene, camera, player, vehicles, police, missions, hud, world } = game;

  if (shotName === 'start') {
    // Shot 1: Title Screen with skyline backdrop
    hud.startScreen.style.display = 'flex';
    camera.position.set(-180, 45, 120);
    camera.lookAt(-20, 25, -20);
    player.mesh.position.set(-140, 0.5, 60);
    player.rotation = 0.8;
  } else if (shotName === 'drive') {
    // Shot 2: Player driving sports car at high speed along Ocean Blvd
    hud.startScreen.style.display = 'none';

    // Find sports car
    let car = vehicles.vehicles.find((v) => v.preset.type === 'sport');
    if (!car) {
      car = vehicles.createVehicle('sport', -214, 20, 0, false);
    }
    car.position.set(-214, 0, 40);
    car.rotation = 0; // heading North along Ocean Blvd
    car.speed = 30.5; // ~68 MPH

    player.inVehicle = true;
    player.currentVehicle = car;
    car.isDrivenByPlayer = true;
    player.mesh.visible = false;
    player.cash = 1850;

    // Follow camera low and dynamic behind vehicle
    player.camYaw = Math.PI;
    player.camPitch = 0.18;
    player.camDist = 7.5;
    player.targetCamDist = 7.5;

    // Advance 60 frames to spin wheels and settle HUD
    for (let i = 0; i < 60; i++) {
      vehicles.update(0.016, { isForward: () => true, isBackward: () => false, isLeft: () => false, isRight: () => false, isHandbrake: () => false }, world, player);
      hud.update(0.016, player, police, missions, world, vehicles);
    }
  } else if (shotName === 'chase') {
    // Shot 3: 3-Star Police Pursuit
    hud.startScreen.style.display = 'none';

    // Player in sedan cruiser
    let car = vehicles.vehicles.find((v) => v.preset.type === 'sedan');
    if (!car) {
      car = vehicles.createVehicle('sedan', 0, 0, 0, false);
    }
    car.position.set(45, 0, -30);
    car.rotation = -Math.PI / 4;
    car.speed = 28;

    player.inVehicle = true;
    player.currentVehicle = car;
    car.isDrivenByPlayer = true;
    player.mesh.visible = false;
    player.cash = 2400;

    // Set 3 stars wanted
    police.setWantedLevel(3);

    // Spawn 2 police cruisers in immediate pursuit behind
    const cop1 = vehicles.createVehicle('police', 35, -55, -Math.PI / 4, true);
    cop1.speed = 26;
    cop1.sirenActive = true;
    police.copCruisers.push(cop1);

    const cop2 = vehicles.createVehicle('police', 58, -50, -Math.PI / 4.5, true);
    cop2.speed = 27;
    cop2.sirenActive = true;
    police.copCruisers.push(cop2);

    // Camera behind car
    player.camYaw = car.rotation + Math.PI;
    player.camPitch = 0.22;
    player.camDist = 8.5;
    player.targetCamDist = 8.5;

    for (let i = 0; i < 60; i++) {
      hud.update(0.016, player, police, missions, world, vehicles);
    }
  } else if (shotName === 'mission') {
    // Shot 4: Mission 2 "Bay Courier" active with checkpoint beam ahead
    hud.startScreen.style.display = 'none';

    missions.startMission(1); // Mission 2: Bay Courier
    missions.timer = 74.2;

    let car = vehicles.vehicles.find((v) => v.preset.type === 'sport');
    if (!car) {
      car = vehicles.createVehicle('sport', -160, 40, 0, false);
    }
    car.position.set(-160, 0, 50);
    car.rotation = 0;
    car.speed = 24;

    player.inVehicle = true;
    player.currentVehicle = car;
    car.isDrivenByPlayer = true;
    player.mesh.visible = false;
    player.cash = 850;

    // Checkpoint beam ahead on road
    missions.waypointMesh.position.set(-160, 0, 120);
    missions.waypointMesh.visible = true;

    player.camYaw = Math.PI;
    player.camPitch = 0.22;
    player.camDist = 7.2;

    for (let i = 0; i < 60; i++) {
      missions.update(0.016, player, police, null);
      hud.update(0.016, player, police, missions, world, vehicles);
    }
  }
}
