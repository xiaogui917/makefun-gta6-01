// Neon Tide - Deterministic Screenshot Mode for AI Benchmark Judging
import * as THREE from 'three';

export function setupDeterministicShot(shotType, game) {
  const { scene, camera, player, vehicles, police, missions, hud, world } = game;

  if (shotType === 'start') {
    // Shot 1: Title Screen with scenic Palma Verde beachfront vista
    if (hud.startOverlay) hud.startOverlay.style.display = 'flex';

    // Position camera looking down Ocean Drive with palm trees and sports car
    camera.position.set(-155, 4.2, 110);
    camera.lookAt(-140, 2.0, 70);

    // Park sports car in hero angle
    const heroCar = vehicles.vehicles.find(v => v.config.type === 'sports');
    if (heroCar) {
      heroCar.position.set(-140, 0, 70);
      heroCar.rotation = -0.35;
      heroCar.updateMeshTransform();
    }
  } else if (shotType === 'drive') {
    // Shot 2: Driving in city, showing speedometer, traffic and minimap
    if (hud.startOverlay) hud.startOverlay.style.display = 'none';

    const sportsCar = vehicles.vehicles.find(v => v.config.type === 'sports');
    if (sportsCar) {
      sportsCar.position.set(-140, 0, 15);
      sportsCar.rotation = 0;
      sportsCar.velocity = 16.5; // ~37 MPH
      sportsCar.updateMeshTransform();

      player.enterVehicle(sportsCar);
      player.cash = 1850;
    }

    camera.position.set(-140, 3.8, -12);
    camera.lookAt(-140, 1.4, 25);
    hud.update(player, police, vehicles, missions);
  }
  else if (shotType === 'chase') {
    // Shot 3: High-speed police chase with 3 wanted stars and pursuit units
    if (hud.startOverlay) hud.startOverlay.style.display = 'none';

    const playerCar = vehicles.vehicles.find(v => v.config.type === 'sports');
    if (playerCar) {
      playerCar.position.set(-50, 0, 40);
      playerCar.rotation = Math.PI / 2;
      playerCar.velocity = 18.0;
      playerCar.updateMeshTransform();
      player.enterVehicle(playerCar);
    }

    police.setWantedLevel(3);
    hud.postMessage('CRIME: High-Speed Evasion');

    // Position 2 police cruisers right behind player
    const cop1 = vehicles.vehicles.find(v => v.isPolice);
    if (cop1) {
      cop1.position.set(-68, 0, 42);
      cop1.rotation = Math.PI / 2 - 0.15;
      cop1.velocity = 17.5;
      cop1.sirenActive = true;
      cop1.updateMeshTransform();
    }

    camera.position.set(-78, 5.2, 40);
    camera.lookAt(-45, 1.5, 40);
    hud.update(player, police, vehicles, missions);
  } else if (shotType === 'mission') {
    // Shot 4: Mission 2 Bay Courier in progress with objective beacon and timer
    if (hud.startOverlay) hud.startOverlay.style.display = 'none';

    missions.startMission(1); // Mission 2: Bay Courier
    missions.currentStepIndex = 1; // Delivery step
    missions.timerRemaining = 78; // 1 min 18 sec left
    missions.updateBeaconPosition();

    player.position.set(-30, 0, 75);
    player.rotation = 0;
    player.updateMeshTransform();

    camera.position.set(-30, 4.2, 58);
    camera.lookAt(-30, 2.0, 115);

    hud.showMission('Bay Courier', 'Deliver package to Downtown High-rise', 78);
    hud.postMessage('COURIER IN PROGRESS: 01:18');
    hud.update(player, police, vehicles, missions);
  }
}
