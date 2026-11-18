// Neon Tide - Procedural 3D City, Ocean, Districts & World Environment
import * as THREE from 'three';
import { WORLD_CONFIG, ECONOMY_CONFIG } from './config.js';

export class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.roadNodes = [];
    this.pickups = [];
    this.palmTrees = [];
    this.waterMesh = null;
    this.waterTime = 0;

    this.buildingTexture = this.createBuildingTexture();
    this.roadTexture = this.createRoadTexture();
    this.init();
  }

  init() {
    this.setupLighting();
    this.buildTerrainAndOcean();
    this.buildRoadNetwork();
    this.buildDistrictsAndBuildings();
    this.buildPalmTrees();
    this.buildPickups();
  }

  setupLighting() {
    // Warm Palma Verde tropical sunlight
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x334422, 0.7);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    sunLight.position.set(180, 240, 140);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 600;
    const d = 320;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0022);
  }
  createBuildingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, 256, 512);

    // Glowing window grid
    const cols = 8;
    const rows = 24;
    const padX = 8;
    const padY = 6;
    const winW = (256 - (cols + 1) * padX) / cols;
    const winH = (512 - (rows + 1) * padY) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padX + c * (winW + padX);
        const y = padY + r * (winH + padY);
        const rand = Math.random();
        if (rand > 0.45) {
          ctx.fillStyle = rand > 0.85 ? '#00f0ff' : (rand > 0.7 ? '#ff0077' : '#ffe6aa');
          ctx.fillRect(x, y, winW, winH);
        } else {
          ctx.fillStyle = '#0a0d14';
          ctx.fillRect(x, y, winW, winH);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  createRoadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#22252c';
    ctx.fillRect(0, 0, 128, 128);

    // Subtle asphalt noise
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#1a1c22' : '#2b2f38';
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }
  buildTerrainAndOcean() {
    const size = WORLD_CONFIG.CITY_SIZE;
    // Ground base plate
    const groundGeo = new THREE.PlaneGeometry(size + 80, size + 80);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x181e26 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Ocean on West side
    const oceanW = WORLD_CONFIG.OCEAN_WIDTH;
    const oceanGeo = new THREE.PlaneGeometry(oceanW, size + 200, 32, 32);
    const oceanMat = new THREE.MeshPhongMaterial({
      color: 0x006699,
      emissive: 0x002244,
      specular: 0x00f0ff,
      shininess: 90,
      transparent: true,
      opacity: 0.88
    });
    this.waterMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(-size / 2 - oceanW / 2 + 15, -0.4, 0);
    this.scene.add(this.waterMesh);

    // Sandy Beach
    const beachW = WORLD_CONFIG.BEACH_WIDTH;
    const beachGeo = new THREE.PlaneGeometry(beachW, size + 100);
    const beachMat = new THREE.MeshLambertMaterial({ color: 0xf4d29c });
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(-size / 2 + beachW / 2 - 25, -0.02, 0);
    beach.receiveShadow = true;
    this.scene.add(beach);
  }
  buildRoadNetwork() {
    const { CITY_SIZE, BLOCK_COUNT, BLOCK_SIZE, ROAD_WIDTH } = WORLD_CONFIG;
    const half = CITY_SIZE / 2;
    const roadMat = new THREE.MeshLambertMaterial({ map: this.roadTexture });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.roadCoordsX = [];
    this.roadCoordsZ = [];

    for (let i = 0; i <= BLOCK_COUNT; i++) {
      const coord = -half + i * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2;
      this.roadCoordsX.push(coord);
      this.roadCoordsZ.push(coord);

      // East-West Road (Z constant)
      const roadXGeo = new THREE.PlaneGeometry(CITY_SIZE, ROAD_WIDTH);
      const roadX = new THREE.Mesh(roadXGeo, roadMat);
      roadX.rotation.x = -Math.PI / 2;
      roadX.position.set(0, 0.01, coord);
      roadX.receiveShadow = true;
      this.scene.add(roadX);

      // Center dashed line
      const lineXGeo = new THREE.PlaneGeometry(CITY_SIZE, 0.35);
      const lineX = new THREE.Mesh(lineXGeo, lineMat);
      lineX.rotation.x = -Math.PI / 2;
      lineX.position.set(0, 0.02, coord);
      this.scene.add(lineX);

      // North-South Road (X constant)
      const roadZGeo = new THREE.PlaneGeometry(ROAD_WIDTH, CITY_SIZE);
      const roadZ = new THREE.Mesh(roadZGeo, roadMat);
      roadZ.rotation.x = -Math.PI / 2;
      roadZ.position.set(coord, 0.01, 0);
      roadZ.receiveShadow = true;
      this.scene.add(roadZ);

      // Center dashed line
      const lineZGeo = new THREE.PlaneGeometry(0.35, CITY_SIZE);
      const lineZ = new THREE.Mesh(lineZGeo, lineMat);
      lineZ.rotation.x = -Math.PI / 2;
      lineZ.position.set(coord, 0.02, 0);
      this.scene.add(lineZ);
    }
  }
  buildDistrictsAndBuildings() {
    const { CITY_SIZE, BLOCK_COUNT, BLOCK_SIZE, ROAD_WIDTH, SIDEWALK_WIDTH } = WORLD_CONFIG;
    const half = CITY_SIZE / 2;
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });

    for (let bz = 0; bz < BLOCK_COUNT; bz++) {
      for (let bx = 0; bx < BLOCK_COUNT; bx++) {
        const blockCenterX = -half + ROAD_WIDTH + bx * (BLOCK_SIZE + ROAD_WIDTH) + BLOCK_SIZE / 2;
        const blockCenterZ = -half + ROAD_WIDTH + bz * (BLOCK_SIZE + ROAD_WIDTH) + BLOCK_SIZE / 2;

        // Sidewalk base for block
        const swGeo = new THREE.BoxGeometry(BLOCK_SIZE, 0.22, BLOCK_SIZE);
        const swMesh = new THREE.Mesh(swGeo, sidewalkMat);
        swMesh.position.set(blockCenterX, 0.11, blockCenterZ);
        swMesh.receiveShadow = true;
        this.scene.add(swMesh);

        // Determine district
        let district = WORLD_CONFIG.DISTRICTS.RESIDENTIAL;
        if (bx < 2) {
          district = WORLD_CONFIG.DISTRICTS.BEACHFRONT;
        } else if (bx >= 3 && bz >= 3) {
          district = WORLD_CONFIG.DISTRICTS.DOWNTOWN;
        } else if (bx >= 3 && bz < 3) {
          district = WORLD_CONFIG.DISTRICTS.PORT;
        }

        // Subdivide block into 2x2 buildings
        const subSize = (BLOCK_SIZE - SIDEWALK_WIDTH * 2 - 4) / 2;
        for (let subZ = 0; subZ < 2; subZ++) {
          for (let subX = 0; subX < 2; subX++) {
            const bX = blockCenterX - BLOCK_SIZE / 4 + (subX === 1 ? subSize / 2 + 1 : -subSize / 2 - 1);
            const bZ = blockCenterZ - BLOCK_SIZE / 4 + (subZ === 1 ? subSize / 2 + 1 : -subSize / 2 - 1);
            this.createBuilding(bX, bZ, subSize, subSize, district);
          }
        }
      }
    }
  }
  createBuilding(x, z, width, depth, district) {
    const height = district.minHeight + Math.random() * (district.maxHeight - district.minHeight);
    const color = district.colorPalette[Math.floor(Math.random() * district.colorPalette.length)];

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mats = [
      new THREE.MeshLambertMaterial({ map: this.buildingTexture }),
      new THREE.MeshLambertMaterial({ map: this.buildingTexture }),
      new THREE.MeshLambertMaterial({ color: 0x222222 }), // roof
      new THREE.MeshLambertMaterial({ color: 0x111111 }), // bottom
      new THREE.MeshLambertMaterial({ map: this.buildingTexture }),
      new THREE.MeshLambertMaterial({ map: this.buildingTexture })
    ];

    const mesh = new THREE.Mesh(geo, mats);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Rooftop AC / Antenna prop
    if (Math.random() > 0.4) {
      const propGeo = new THREE.BoxGeometry(width * 0.35, 2.5, depth * 0.35);
      const propMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      const prop = new THREE.Mesh(propGeo, propMat);
      prop.position.set(x, height + 1.25, z);
      this.scene.add(prop);
    }

    // Register AABB collider
    this.colliders.push({
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      type: 'building'
    });
  }
  buildPalmTrees() {
    const { CITY_SIZE } = WORLD_CONFIG;
    const half = CITY_SIZE / 2;
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    const frondMat = new THREE.MeshLambertMaterial({ color: 0x1b7a2b });

    // Plant along Oceanfront promenade (Western sidewalk)
    for (let z = -half + 20; z <= half - 20; z += 18) {
      const tree = new THREE.Group();
      // Curved trunk
      const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, 7.5, 7);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3.75;
      trunk.rotation.z = 0.08;
      trunk.castShadow = true;
      tree.add(trunk);

      // Fronds (leaves)
      for (let i = 0; i < 6; i++) {
        const frondGeo = new THREE.ConeGeometry(1.6, 3.8, 4);
        const frond = new THREE.Mesh(frondGeo, frondMat);
        frond.position.set(0, 7.4, 0);
        frond.rotation.z = Math.PI / 3;
        frond.rotation.y = (i * Math.PI) / 3;
        tree.add(frond);
      }

      tree.position.set(-half + 16, 0, z);
      this.scene.add(tree);
      this.palmTrees.push(tree);
    }
  }

  buildPickups() {
    // Generate scattered health, ammo, and cash pickups
    const types = ['health', 'ammo', 'cash'];
    const { CITY_SIZE } = WORLD_CONFIG;
    const half = CITY_SIZE / 2 - 30;

    for (let i = 0; i < 15; i++) {
      const type = types[i % types.length];
      const x = (Math.random() * 2 - 1) * half;
      const z = (Math.random() * 2 - 1) * half;
      this.spawnPickup(x, z, type);
    }
  }
  spawnPickup(x, z, type) {
    const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    let color = 0x39ff14; // green health
    if (type === 'ammo') color = 0x00f0ff; // cyan ammo
    if (type === 'cash') color = 0xffcc00; // yellow cash

    const mat = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.35,
      specular: 0xffffff
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.7, z);
    this.scene.add(mesh);

    this.pickups.push({ mesh, type, x, z, active: true, basePos: new THREE.Vector3(x, 0.7, z) });
  }

  checkCollision(x, z, radius) {
    for (const c of this.colliders) {
      if (
        x + radius > c.minX &&
        x - radius < c.maxX &&
        z + radius > c.minZ &&
        z - radius < c.maxZ
      ) {
        return c;
      }
    }
    return null;
  }

  checkPickupCollect(playerPos, radius = 1.6) {
    const collected = [];
    for (const p of this.pickups) {
      if (!p.active) continue;
      const dx = playerPos.x - p.x;
      const dz = playerPos.z - p.z;
      if (Math.hypot(dx, dz) < radius) {
        p.active = false;
        p.mesh.visible = false;
        collected.push(p.type);
        setTimeout(() => {
          p.active = true;
          p.mesh.visible = true;
        }, 30000); // respawn after 30s
      }
    }
    return collected;
  }

  update(dt) {
    this.waterTime += dt;
    if (this.waterMesh) {
      this.waterMesh.position.y = -0.4 + Math.sin(this.waterTime * 1.5) * 0.12;
    }

    // Floating animation for pickups
    for (const p of this.pickups) {
      if (p.active) {
        p.mesh.rotation.y += dt * 1.8;
        p.mesh.position.y = p.basePos.y + Math.sin(this.waterTime * 3 + p.x) * 0.15;
      }
    }
  }
}
