// Neon Tide - Deterministic Screenshot Scenes
// Supports ?shot=start, ?shot=drive, ?shot=chase, ?shot=mission
// Sunny daytime Palma Verde with follow camera behind player vehicle

import * as THREE from 'three';
import { CONFIG } from './config.js';

// The hero car of the story is the red Vipera GT, but parked sports cars
// get a random paint job from the preset. Force the staged hero car red so
// every screenshot shows the same car the missions talk about. A sport
// car's bodyMat is created fresh per vehicle, so recoloring it touches
// only that car (police cars share one black material and are never passed here).
function paintSportRed(car) {
  if (car && car.bodyMat) car.bodyMat.color.set(0xff1744);
}

export function setupShotMode(shotName, game) {
  const { scene, camera, player, vehicles, police, missions, hud, world, pedestrians } = game;

  // Clear any existing debug references
  window.__shotObjects = {};

  if (shotName === 'start') {
    // Shot 1: Title Screen with bright daytime city skyline, coast, beach & palm trees backdrop
    hud.startScreen.style.display = 'flex';
    hud.startScreen.style.background = 'radial-gradient(circle at center, rgba(12,20,36,0.30) 0%, rgba(6,12,24,0.55) 100%)';

    // Camera high over the water west of the beach, looking east across the
    // coast to downtown: high enough to clear the beachfront hotels (max
    // 44m), so the framing survives the city's random building layout
    // instead of a hotel filling the frame on some loads
    camera.position.set(-310, 55, 130);
    camera.lookAt(-20, 25, -20);
    camera.updateMatrixWorld();

    // Place player and parked sports car along the sunlit coastal boulevard
    player.mesh.position.set(-214, 0.3, 75);
    player.mesh.rotation.y = -Math.PI / 3;
    player.mesh.visible = true;
    // Keep the logical player state with the staged mesh (minimap, HUD)
    player.position.set(-214, 0.5, 75);
    player.rotation = -Math.PI / 3;

    let car = vehicles.vehicles.find((v) => v.preset.type === 'sport');
    if (!car) {
      car = vehicles.createVehicle('sport', -214, 82, 0, false);
    } else {
      car.position.set(-214, 0, 82);
      car.rotation = 0;
    }
    paintSportRed(car);

    window.__shotObjects = {
      skylineTarget: new THREE.Vector3(-20, 25, -20),
      palmPromenade: new THREE.Vector3(-214, 5, 80),
      coastalBeach: new THREE.Vector3(-260, 0, 100),
    };
  } else if (shotName === 'drive') {
    // Shot 2: Player driving sports car on city road, with at least 2 traffic cars & 2 pedestrians in view
    hud.startScreen.style.display = 'none';

    // Player in red Vipera GT on central downtown avenue (road X = 0)
    let car = vehicles.vehicles.find((v) => v.preset.type === 'sport');
    if (!car) {
      car = vehicles.createVehicle('sport', 0, 0, 0, false);
    }
    car.position.set(0, 0, 0);
    car.rotation = 0; // heading North (+Z)
    car.speed = 32;
    paintSportRed(car);

    player.inVehicle = true;
    player.currentVehicle = car;
    car.isDrivenByPlayer = true;
    player.mesh.visible = false;
    player.cash = 1850;

    // Follow camera: behind and above player car
    camera.position.set(0, 3.4, -8.2);
    camera.lookAt(0, 1.2, 10.0);
    camera.updateMatrixWorld();

    // Spawn / position Traffic Car 1: Yellow taxi ahead on right lane
    let traffic1 = vehicles.vehicles.find((v) => !v.isDrivenByPlayer && v.preset.type === 'taxi');
    if (!traffic1) {
      traffic1 = vehicles.createVehicle('taxi', 4.0, 16.0, 0, false);
    } else {
      traffic1.position.set(4.0, 0, 16.0);
      traffic1.rotation = 0;
    }
    traffic1.speed = 16;
    traffic1.group.position.copy(traffic1.position);
    traffic1.group.rotation.y = traffic1.rotation;

    // Spawn / position Traffic Car 2: Blue sedan oncoming on left lane
    let traffic2 = vehicles.vehicles.find((v) => !v.isDrivenByPlayer && v !== traffic1 && v.preset.type === 'sedan');
    if (!traffic2) {
      traffic2 = vehicles.createVehicle('sedan', -4.2, 25.0, Math.PI, false);
    } else {
      traffic2.position.set(-4.2, 0, 25.0);
      traffic2.rotation = Math.PI;
    }
    traffic2.speed = 15;
    traffic2.group.position.copy(traffic2.position);
    traffic2.group.rotation.y = traffic2.rotation;

    // Position Pedestrian 1 on right sidewalk
    if (pedestrians.pedestrians.length > 0) {
      const ped1 = pedestrians.pedestrians[0];
      ped1.position.set(10.2, 0.3, 12.0);
      ped1.group.position.set(10.2, 0.3, 12.0);
      ped1.group.rotation.y = Math.PI;
      ped1.group.visible = true;
    }

    // Position Pedestrian 2 on left sidewalk
    if (pedestrians.pedestrians.length > 1) {
      const ped2 = pedestrians.pedestrians[1];
      ped2.position.set(-10.2, 0.3, 18.0);
      ped2.group.position.set(-10.2, 0.3, 18.0);
      ped2.group.rotation.y = 0;
      ped2.group.visible = true;
    }

    // Advance simulation slightly to spin wheels and settle speedometer
    for (let i = 0; i < 30; i++) {
      vehicles.update(0.016, { isForward: () => true, isBackward: () => false, isLeft: () => false, isRight: () => false, isHandbrake: () => false }, world, player);
      hud.update(0.016, player, police, missions, world, vehicles);
    }

    // Re-ensure exact shot transforms after update
    car.position.set(0, 0, 0);
    car.group.position.copy(car.position);
    traffic1.position.set(4.0, 0, 16.0);
    traffic1.group.position.copy(traffic1.position);
    traffic2.position.set(-4.2, 0, 25.0);
    traffic2.group.position.copy(traffic2.position);
    camera.position.set(0, 3.4, -8.2);
    camera.lookAt(0, 1.2, 10.0);
    camera.updateMatrixWorld();

    window.__shotObjects = {
      playerCar: car.position,
      trafficCar1: traffic1.position,
      trafficCar2: traffic2.position,
      pedestrian1: pedestrians.pedestrians[0]?.position,
      pedestrian2: pedestrians.pedestrians[1]?.position,
    };
  } else if (shotName === 'chase') {
    // Shot 3: 3-Star Police Pursuit with at least 2 police cruisers with red/blue strobe lights close behind the player car
    hud.startScreen.style.display = 'none';

    // Player in red Vipera GT
    let car = vehicles.vehicles.find((v) => v.preset.type === 'sport') || vehicles.vehicles[0];
    if (!car) {
      car = vehicles.createVehicle('sport', 0, 0, 0, false);
    }
    car.position.set(0, 0, 0);
    car.rotation = 0;
    car.speed = 34;
    paintSportRed(car);

    player.inVehicle = true;
    player.currentVehicle = car;
    car.isDrivenByPlayer = true;
    player.mesh.visible = false;
    player.cash = 2400;

    // Set 3 stars wanted
    police.setWantedLevel(3);

    // Spawn 2 police cruisers in immediate pursuit on the rear flanks,
    // set wide enough that the player car stays visible between them
    const cop1 = vehicles.createVehicle('police', -4.0, -6.6, 0.08, true);
    cop1.speed = 32;
    cop1.sirenActive = true;
    if (cop1.group.userData.redHalf) cop1.group.userData.redHalf.visible = true;
    if (cop1.group.userData.blueHalf) cop1.group.userData.blueHalf.visible = true;
    police.copCruisers.push(cop1);

    const cop2 = vehicles.createVehicle('police', 4.2, -6.0, -0.08, true);
    cop2.speed = 32;
    cop2.sirenActive = true;
    if (cop2.group.userData.redHalf) cop2.group.userData.redHalf.visible = true;
    if (cop2.group.userData.blueHalf) cop2.group.userData.blueHalf.visible = true;
    police.copCruisers.push(cop2);

    // Follow camera: pulled further back and higher so the player car reads
    // between the two pursuing cruisers instead of being hidden by them
    camera.position.set(0, 5.2, -15.2);
    camera.lookAt(0, 1.2, 4.0);
    camera.updateMatrixWorld();

    for (let i = 0; i < 30; i++) {
      hud.update(0.016, player, police, missions, world, vehicles);
    }

    // Lock transforms and strobes
    car.position.set(0, 0, 0);
    car.group.position.copy(car.position);
    cop1.position.set(-4.0, 0, -6.6);
    cop1.group.position.copy(cop1.position);
    cop2.position.set(4.2, 0, -6.0);
    cop2.group.position.copy(cop2.position);
    if (cop1.group.userData.redHalf) cop1.group.userData.redHalf.visible = true;
    if (cop1.group.userData.blueHalf) cop1.group.userData.blueHalf.visible = true;
    if (cop2.group.userData.redHalf) cop2.group.userData.redHalf.visible = true;
    if (cop2.group.userData.blueHalf) cop2.group.userData.blueHalf.visible = true;
    camera.position.set(0, 5.2, -15.2);
    camera.lookAt(0, 1.2, 4.0);
    camera.updateMatrixWorld();

    window.__shotObjects = {
      playerCar: car.position,
      policeCruiser1: cop1.position,
      policeCruiser2: cop2.position,
    };
  } else if (shotName === 'mission') {
    // Shot 4: Mission 2 "Bay Courier" active with checkpoint neon pillar ahead.
    // Staged on the X = -180 north-south road (a real road centerline):
    // the earlier X = -214 staging sat inside a beachfront block, where a
    // palm trunk blocked the camera and a hotel hid the checkpoint beam.
    hud.startScreen.style.display = 'none';

    missions.startMission(1); // Mission 2: Bay Courier
    missions.timer = 74.5;
    missions.activeMission.checkpoints[0] = { x: -180, z: 78 };

    let car = vehicles.vehicles.find((v) => v.preset.type === 'sport');
    if (!car) {
      car = vehicles.createVehicle('sport', -180, 30, 0, false);
    }
    car.position.set(-180, 0, 30);
    car.rotation = 0; // heading +Z along coastal highway
    car.speed = 26;
    paintSportRed(car);

    player.inVehicle = true;
    player.currentVehicle = car;
    car.isDrivenByPlayer = true;
    player.mesh.visible = false;
    player.cash = 1200;
    // Keep the logical player position with the staged car so the HUD
    // objective distance and the minimap arrow point at the real spot
    player.position.set(-180, 0.5, 30);

    // Checkpoint beam ahead on road
    const waypointPos = new THREE.Vector3(-180, 0, 78);
    missions.waypointMesh.position.copy(waypointPos);
    missions.waypointMesh.visible = true;

    // Follow camera: behind and above player car looking towards checkpoint beam
    camera.position.set(-180, 3.4, 21.8);
    camera.lookAt(-180, 1.3, 48.0);
    camera.updateMatrixWorld();

    for (let i = 0; i < 30; i++) {
      missions.update(0.016, player, police, null);
      hud.update(0.016, player, police, missions, world, vehicles);
    }

    car.position.set(-180, 0, 30);
    car.group.position.copy(car.position);
    missions.waypointMesh.position.copy(waypointPos);
    missions.waypointMesh.visible = true;
    camera.position.set(-180, 3.4, 21.8);
    camera.lookAt(-180, 1.3, 48.0);
    camera.updateMatrixWorld();

    window.__shotObjects = {
      playerCar: car.position,
      checkpointBeam: waypointPos,
    };
  }
}
