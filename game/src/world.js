// World generation for Palma Verde in Neon Tide
import * as THREE from 'three';
import {
  CITY_SIZE,
  BLOCK_COUNT,
  BLOCK_SIZE,
  ROAD_WIDTH,
  SIDEWALK_WIDTH,
  TOTAL_SPAN,
  HALF_SPAN,
  BEACH_X,
  OCEAN_X,
  DISTRICTS,
  PICKUP_CONFIG,
} from './config.js';

export function createBuildingTexture(districtKey, seed = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  let baseColor = '#242836';
  let windowColor = '#ffeaa7';
  let accentColor = '#00f0ff';

  if (districtKey === 'DOWNTOWN') {
    baseColor = '#141824';
    windowColor = '#74b9ff';
    accentColor = '#ff007f';
  } else if (districtKey === 'BEACHFRONT') {
    baseColor = '#f5e6d3';
    windowColor = '#ffeaa7';
    accentColor = '#ff7675';
  } else if (districtKey === 'PORT') {
    baseColor = '#3d404d';
    windowColor = '#fab1a0';
    accentColor = '#fdcb6e';
  } else {
    baseColor = '#e3d7c5';
    windowColor = '#ffeaa7';
    accentColor = '#00b894';
  }

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 128, 256);

  // Shopfront or lobby at ground level
  ctx.fillStyle = accentColor;
  ctx.fillRect(4, 230, 120, 22);

  // Window grid
  const cols = 5;
  const rows = 12;
  const w = 14;
  const h = 11;
  const padX = 9;
  const padY = 7;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = (Math.sin(seed * 99 + r * 13 + c * 31) > -0.2);
      ctx.fillStyle = isLit ? windowColor : '#1e222e';
      ctx.fillRect(10 + c * (w + padX), 12 + r * (h + padY), w, h);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
export function createRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1c1f26';
  ctx.fillRect(0, 0, 128, 128);

  // White edge lines
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(8, 0, 4, 128);
  ctx.fillRect(116, 0, 4, 128);

  // Yellow dashed center line
  ctx.fillStyle = '#ffcc00';
  for (let y = 8; y < 128; y += 32) {
    ctx.fillRect(62, y, 4, 16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // Bounding boxes for player & vehicle collision
    this.pickups = [];
    this.oceanMesh = null;
    this.roadTexture = createRoadTexture();
    this.roadTexture.repeat.set(1, 20);

    this.buildingTextures = {
      DOWNTOWN: createBuildingTexture('DOWNTOWN', 1),
      BEACHFRONT: createBuildingTexture('BEACHFRONT', 2),
      PORT: createBuildingTexture('PORT', 3),
      RESIDENTIAL: createBuildingTexture('RESIDENTIAL', 4),
    };

    this.buildGroundAndOcean();
    this.buildRoadsAndBlocks();
    this.buildPropsAndVegetation();
    this.spawnPickups();
  }
  buildGroundAndOcean() {
    // City Base Terrain
    const groundGeo = new THREE.PlaneGeometry(CITY_SIZE, CITY_SIZE);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x2b303c });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Sandy Beach
    const beachGeo = new THREE.PlaneGeometry(70, CITY_SIZE);
    const beachMat = new THREE.MeshLambertMaterial({ color: 0xe6cd9c });
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(BEACH_X - 15, -0.02, 0);
    beach.receiveShadow = true;
    this.scene.add(beach);

    // Ocean Water
    const oceanGeo = new THREE.PlaneGeometry(350, CITY_SIZE + 200, 32, 32);
    const oceanMat = new THREE.MeshPhongMaterial({
      color: 0x0066aa,
      specular: 0x66ccff,
      shininess: 90,
      transparent: true,
      opacity: 0.88,
    });
    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.rotation.x = -Math.PI / 2;
    this.oceanMesh.position.set(OCEAN_X - 120, -0.6, 0);
    this.scene.add(this.oceanMesh);
  }
  buildRoadsAndBlocks() {
    const pitch = BLOCK_SIZE + ROAD_WIDTH;
    const startOffset = -HALF_SPAN + pitch / 2;

    // Road grid materials
    const roadMat = new THREE.MeshLambertMaterial({ map: this.roadTexture });
    const intersectionMat = new THREE.MeshLambertMaterial({ color: 0x1f232b });

    // North-South Roads
    for (let i = 0; i <= BLOCK_COUNT; i++) {
      const x = -HALF_SPAN + i * pitch;
      const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, TOTAL_SPAN + ROAD_WIDTH);
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(x, 0.01, 0);
      roadMesh.receiveShadow = true;
      this.scene.add(roadMesh);
    }

    // East-West Roads
    for (let j = 0; j <= BLOCK_COUNT; j++) {
      const z = -HALF_SPAN + j * pitch;
      const roadGeo = new THREE.PlaneGeometry(TOTAL_SPAN + ROAD_WIDTH, ROAD_WIDTH);
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.rotation.z = Math.PI / 2;
      roadMesh.position.set(0, 0.02, z);
      roadMesh.receiveShadow = true;
      this.scene.add(roadMesh);
    }

    // City blocks with sidewalks and buildings
    for (let bx = 0; bx < BLOCK_COUNT; bx++) {
      for (let bz = 0; bz < BLOCK_COUNT; bz++) {
        const cx = -HALF_SPAN + ROAD_WIDTH / 2 + BLOCK_SIZE / 2 + bx * pitch;
        const cz = -HALF_SPAN + ROAD_WIDTH / 2 + BLOCK_SIZE / 2 + bz * pitch;
        this.buildCityBlock(cx, cz, bx, bz);
      }
    }
  }
  buildCityBlock(cx, cz, bx, bz) {
    // Sidewalk base
    const swGeo = new THREE.BoxGeometry(BLOCK_SIZE, 0.22, BLOCK_SIZE);
    const swMat = new THREE.MeshLambertMaterial({ color: 0xc8cdd8 });
    const sidewalk = new THREE.Mesh(swGeo, swMat);
    sidewalk.position.set(cx, 0.11, cz);
    sidewalk.receiveShadow = true;
    this.scene.add(sidewalk);

    // Determine district
    let districtKey = 'RESIDENTIAL';
    if (cx > 0 && cz < 0) districtKey = 'DOWNTOWN';
    else if (cx <= 0 && cz < 0) districtKey = 'BEACHFRONT';
    else if (cx > 0 && cz >= 0) districtKey = 'PORT';
    else districtKey = 'RESIDENTIAL';

    const dist = DISTRICTS[districtKey];
    const subSize = (BLOCK_SIZE - 8) / 2; // 2x2 buildings per block

    for (let sx = 0; sx < 2; sx++) {
      for (let sz = 0; sz < 2; sz++) {
        const px = cx - (BLOCK_SIZE - 8) / 4 + sx * subSize;
        const pz = cz - (BLOCK_SIZE - 8) / 4 + sz * subSize;

        const hash = Math.sin(bx * 77 + bz * 33 + sx * 13 + sz * 19);
        const norm = (hash + 1) / 2;
        const height = dist.minHeight + norm * (dist.maxHeight - dist.minHeight);

        const bWidth = subSize - 4;
        const bDepth = subSize - 4;

        const bGeo = new THREE.BoxGeometry(bWidth, height, bDepth);
        const tex = this.buildingTextures[districtKey];
        const bMat = new THREE.MeshLambertMaterial({ map: tex });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.set(px, height / 2 + 0.22, pz);
        bMesh.castShadow = true;
        bMesh.receiveShadow = true;
        this.scene.add(bMesh);

        // Save collider box
        this.colliders.push(new THREE.Box3().setFromObject(bMesh));
      }
    }
  }
  createPalmTree(x, z) {
    const group = new THREE.Group();
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 6, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6e4726 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    group.add(trunk);

    // Leaves
    const leafGeo = new THREE.ConeGeometry(2.4, 1.2, 5);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const leaves = new THREE.Mesh(leafGeo, leafMat);
    leaves.position.y = 6;
    leaves.rotation.x = Math.PI;
    group.add(leaves);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  createStreetLight(x, z) {
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 5, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x444d56 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 2.5, z);
    this.scene.add(pole);

    const headGeo = new THREE.BoxGeometry(0.4, 0.15, 0.8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(x, 5.0, z);
    this.scene.add(head);
  }

  buildPropsAndVegetation() {
    // Palms along Oceanfront boulevard
    for (let z = -HALF_SPAN; z <= HALF_SPAN; z += 18) {
      this.createPalmTree(BEACH_X + 2, z);
      this.createStreetLight(BEACH_X + 8, z);
    }

    // Streetlights at grid intersections
    const pitch = BLOCK_SIZE + ROAD_WIDTH;
    for (let i = 0; i <= BLOCK_COUNT; i++) {
      for (let j = 0; j <= BLOCK_COUNT; j++) {
        const x = -HALF_SPAN + i * pitch;
        const z = -HALF_SPAN + j * pitch;
        this.createStreetLight(x + 7, z + 7);
      }
    }
  }
  spawnPickups() {
    const pickupTypes = ['health', 'ammo', 'cash'];
    const spawnLocations = [
      { x: -120, z: -80, type: 'health' },
      { x: -60, z: -140, type: 'ammo' },
      { x: 40, z: -60, type: 'cash' },
      { x: 120, z: -100, type: 'health' },
      { x: -160, z: 40, type: 'cash' },
      { x: -40, z: 80, type: 'ammo' },
      { x: 100, z: 120, type: 'cash' },
      { x: 140, z: 60, type: 'health' },
      { x: -180, z: -40, type: 'cash' },
    ];

    spawnLocations.forEach((loc) => {
      const cfg = PICKUP_CONFIG[loc.type];
      const group = new THREE.Group();

      const boxGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
      const boxMat = new THREE.MeshPhongMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.45,
      });
      const mesh = new THREE.Mesh(boxGeo, boxMat);
      group.add(mesh);

      group.position.set(loc.x, 0.8, loc.z);
      this.scene.add(group);

      this.pickups.push({
        group,
        mesh,
        type: loc.type,
        amount: cfg.amount,
        radius: cfg.radius,
        label: cfg.label,
        active: true,
      });
    });
  }

  update(dt, time) {
    // Wave animation on ocean
    if (this.oceanMesh) {
      this.oceanMesh.position.y = -0.6 + Math.sin(time * 1.5) * 0.12;
    }

    // Pickups rotate & bob
    this.pickups.forEach((p) => {
      if (p.active) {
        p.mesh.rotation.y += dt * 1.8;
        p.group.position.y = 0.8 + Math.sin(time * 3 + p.group.position.x) * 0.15;
      }
    });
  }
}
