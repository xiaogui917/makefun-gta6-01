// Neon Tide - Procedural 3D City & World Builder
// Fictional metropolis: Palma Verde

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // AABB bounding boxes of solid structures
    this.pickups = [];   // Collectible items in world
    this.palmTrees = [];
    this.waterPlane = null;
    this.materials = new Map();
    this.textures = new Map();

    // Road grid network for traffic and minimap navigation
    this.roads = {
      horizontal: [], // east-west roads (Z coordinates)
      vertical: [],   // north-south roads (X coordinates)
    };
  }

  build() {
    this.createMaterials();
    this.setupLighting();
    this.buildTerrainAndOcean();
    this.buildRoadNetwork();
    this.buildDistrictsAndBuildings();
    this.buildPalmTrees();
    this.buildStreetProps();
    this.spawnPickups();
  }

  createMaterials() {
    // Procedural window texture using canvas - daytime architectural tinted glass
    const windowCanvas = document.createElement('canvas');
    windowCanvas.width = 128;
    windowCanvas.height = 128;
    const ctx = windowCanvas.getContext('2d');
    ctx.fillStyle = '#627082';
    ctx.fillRect(0, 0, 128, 128);

    // Grid of lit and reflective windows
    for (let y = 8; y < 128; y += 16) {
      for (let x = 8; x < 128; x += 16) {
        const rand = Math.random();
        if (rand > 0.4) {
          ctx.fillStyle = rand > 0.85 ? '#00e5ff' : rand > 0.7 ? '#ff007f' : rand > 0.4 ? '#fff176' : '#e0f7fa';
        } else {
          ctx.fillStyle = '#4c586a';
        }
        ctx.fillRect(x, y, 10, 10);
      }
    }
    const windowTex = new THREE.CanvasTexture(windowCanvas);
    windowTex.wrapS = THREE.RepeatWrapping;
    windowTex.wrapT = THREE.RepeatWrapping;
    this.textures.set('windows', windowTex);

    // Procedural road asphalt texture - daytime sunny asphalt
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 64;
    roadCanvas.height = 64;
    const rctx = roadCanvas.getContext('2d');
    rctx.fillStyle = '#5c646e';
    rctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 400; i++) {
      const g = Math.floor(85 + Math.random() * 30);
      rctx.fillStyle = `rgb(${g},${g},${g})`;
      rctx.fillRect(Math.random() * 64, Math.random() * 64, 1.5, 1.5);
    }
    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    this.textures.set('asphalt', roadTex);

    // Common materials - brightened for daytime Palma Verde
    this.materials.set('road', new THREE.MeshLambertMaterial({ map: roadTex, color: 0x828994 }));
    this.materials.set('sidewalk', new THREE.MeshLambertMaterial({ color: 0xe6e8ec }));
    this.materials.set('sand', new THREE.MeshLambertMaterial({ color: 0xf8e4b8 }));
    this.materials.set('water', new THREE.MeshLambertMaterial({ color: 0x22b2ee, transparent: true, opacity: 0.85 }));
    this.materials.set('grass', new THREE.MeshLambertMaterial({ color: 0x52b74a }));
    this.materials.set('palmTrunk', new THREE.MeshLambertMaterial({ color: 0x6d4c41 }));
    this.materials.set('palmLeaf', new THREE.MeshLambertMaterial({ color: 0x388e3c, side: THREE.DoubleSide }));
    this.materials.set('curb', new THREE.MeshLambertMaterial({ color: 0xc0c8cf }));
    this.materials.set('metal', new THREE.MeshStandardMaterial({ color: 0x90a4ae, roughness: 0.4, metalness: 0.6 }));
    this.materials.set('neonBlue', new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    this.materials.set('neonPink', new THREE.MeshBasicMaterial({ color: 0xff007f }));
    this.materials.set('neonGold', new THREE.MeshBasicMaterial({ color: 0xffd600 }));
  }

  setupLighting() {
    // Bright tropical blue daytime sky
    this.scene.background = new THREE.Color(0x7ec8f8);

    // Tropical daylight hemisphere light (sky blue + soft ground bounce)
    const hemiLight = new THREE.HemisphereLight(0xe8f5ff, 0x8a9ba8, 1.35);
    this.scene.add(hemiLight);

    // Ambient light fill to prevent pitch black shadowed areas
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);

    // Radiant tropical high sun
    const sunLight = new THREE.DirectionalLight(0xfff8eb, 2.2);
    sunLight.position.set(120, 240, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 600;
    const d = 280;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // Soft tropical coastal fog matching daytime sky
    this.scene.fog = new THREE.FogExp2(0x9fd8f6, 0.0016);
  }

  buildTerrainAndOcean() {
    const W = CONFIG.WORLD.TOTAL_WIDTH;
    const D = CONFIG.WORLD.TOTAL_DEPTH;

    // Ground bedrock
    const groundGeo = new THREE.PlaneGeometry(W, D);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMesh = new THREE.Mesh(groundGeo, this.materials.get('road'));
    groundMesh.position.y = -0.05;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Sandy coastal beach on west (X from -320 to -215)
    const beachW = 120;
    const beachGeo = new THREE.PlaneGeometry(beachW, D);
    beachGeo.rotateX(-Math.PI / 2);
    const beachMesh = new THREE.Mesh(beachGeo, this.materials.get('sand'));
    beachMesh.position.set(-275, 0.02, 0);
    beachMesh.receiveShadow = true;
    this.scene.add(beachMesh);

    // Tropical ocean
    const waterW = 350;
    const waterGeo = new THREE.PlaneGeometry(waterW, D * 1.5);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMesh = new THREE.Mesh(waterGeo, this.materials.get('water'));
    waterMesh.position.set(-480, CONFIG.WORLD.SEA_LEVEL, 0);
    this.scene.add(waterMesh);
    this.waterPlane = waterMesh;
  }

  buildRoadNetwork() {
    const { GRID_BLOCKS_X, GRID_BLOCKS_Z, BLOCK_SIZE, ROAD_WIDTH } = CONFIG.WORLD;
    const pitch = BLOCK_SIZE + ROAD_WIDTH; // 90m

    // Compute road centerline coordinates
    for (let i = 0; i <= GRID_BLOCKS_X; i++) {
      const x = -((GRID_BLOCKS_X * pitch) / 2) + i * pitch;
      this.roads.vertical.push(x);
    }
    for (let j = 0; j <= GRID_BLOCKS_Z; j++) {
      const z = -((GRID_BLOCKS_Z * pitch) / 2) + j * pitch;
      this.roads.horizontal.push(z);
    }

    // Asphalt road surface strips
    const roadMat = this.materials.get('road');
    const roadH = 0.05;

    // North-South vertical road corridors
    for (const x of this.roads.vertical) {
      const geo = new THREE.PlaneGeometry(ROAD_WIDTH, CONFIG.WORLD.TOTAL_DEPTH);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.position.set(x, roadH, 0);
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Yellow lane dividers down road
      this.createRoadMarkings(x, 0, ROAD_WIDTH, CONFIG.WORLD.TOTAL_DEPTH, true);
    }

    // East-West horizontal road corridors
    for (const z of this.roads.horizontal) {
      const geo = new THREE.PlaneGeometry(CONFIG.WORLD.TOTAL_WIDTH, ROAD_WIDTH);
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.position.set(0, roadH + 0.01, z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      this.createRoadMarkings(0, z, CONFIG.WORLD.TOTAL_WIDTH, ROAD_WIDTH, false);
    }
  }

  createRoadMarkings(cx, cz, width, depth, isVertical) {
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffea00 }); // golden yellow road stripe
    const dashCount = isVertical ? Math.floor(depth / 8) : Math.floor(width / 8);

    for (let i = -dashCount / 2; i < dashCount / 2; i++) {
      if (Math.abs(i) % 2 === 0) continue; // dash gap
      const dashGeo = new THREE.PlaneGeometry(isVertical ? 0.35 : 3.5, isVertical ? 3.5 : 0.35);
      dashGeo.rotateX(-Math.PI / 2);
      const dashMesh = new THREE.Mesh(dashGeo, lineMat);
      if (isVertical) {
        dashMesh.position.set(cx, 0.07, cz + i * 8);
      } else {
        dashMesh.position.set(cx + i * 8, 0.07, cz);
      }
      this.scene.add(dashMesh);
    }
  }

  buildDistrictsAndBuildings() {
    const { GRID_BLOCKS_X, GRID_BLOCKS_Z, BLOCK_SIZE, ROAD_WIDTH, SIDEWALK_WIDTH } = CONFIG.WORLD;
    const pitch = BLOCK_SIZE + ROAD_WIDTH;

    for (let gx = 0; gx < GRID_BLOCKS_X; gx++) {
      const blockCenterX = -((GRID_BLOCKS_X * pitch) / 2) + gx * pitch + pitch / 2;

      for (let gz = 0; gz < GRID_BLOCKS_Z; gz++) {
        const blockCenterZ = -((GRID_BLOCKS_Z * pitch) / 2) + gz * pitch + pitch / 2;

        // Sidewalk platform for the block
        const sidewalkGeo = new THREE.BoxGeometry(BLOCK_SIZE, 0.3, BLOCK_SIZE);
        const sidewalkMesh = new THREE.Mesh(sidewalkGeo, this.materials.get('sidewalk'));
        sidewalkMesh.position.set(blockCenterX, 0.15, blockCenterZ);
        sidewalkMesh.receiveShadow = true;
        this.scene.add(sidewalkMesh);

        // Populate block with buildings based on district
        this.populateBlock(blockCenterX, blockCenterZ, BLOCK_SIZE - SIDEWALK_WIDTH * 2);
      }
    }
  }

  populateBlock(bx, bz, innerSize) {
    // Determine district characteristics
    const isDowntown = Math.abs(bx) < 130 && Math.abs(bz) < 140;
    const isBeachFront = bx < -140;
    const isHarbor = bx > 140;

    const subdivisions = isDowntown ? (Math.random() > 0.4 ? 2 : 1) : 2;
    const subSize = innerSize / subdivisions;

    for (let sx = 0; sx < subdivisions; sx++) {
      for (let sz = 0; sz < subdivisions; sz++) {
        const posX = bx - innerSize / 2 + subSize / 2 + sx * subSize;
        const posZ = bz - innerSize / 2 + subSize / 2 + sz * subSize;

        // Leave occasional plaza or parking lot open
        if (!isDowntown && Math.random() < 0.2) {
          this.buildPlazaOrParking(posX, posZ, subSize);
          continue;
        }

        let height = 20;
        let color = 0xeeeeee;
        let style = 'standard';

        if (isDowntown) {
          height = 45 + Math.random() * 45; // 45m - 90m highrises
          color = [0x546e7a, 0x5c6bc0, 0x42a5f5, 0x607d8b, 0x4f83cc][Math.floor(Math.random() * 5)];
          style = 'highrise';
        } else if (isBeachFront) {
          height = 18 + Math.random() * 26; // Art-deco pastel beach hotels
          color = [0xff80ab, 0x80d8ff, 0xa7ffeb, 0xffd180, 0xea80fc][Math.floor(Math.random() * 5)];
          style = 'artdeco';
        } else if (isHarbor) {
          height = 14 + Math.random() * 18; // Industrial warehouses & containers
          color = [0x78909c, 0x90a4ae, 0xd32f2f, 0xf57c00, 0x1976d2][Math.floor(Math.random() * 5)];
          style = 'industrial';
        } else {
          height = 16 + Math.random() * 24; // Suburbs & commercial
          color = [0xe0d7cf, 0xced6dc, 0xb8c5cc, 0xffe2cc][Math.floor(Math.random() * 4)];
          style = 'commercial';
        }

        this.buildBuilding(posX, posZ, subSize - 3, height, color, style);
      }
    }
  }

  buildBuilding(x, z, size, height, baseColor, style) {
    const geo = new THREE.BoxGeometry(size, height, size);
    const winTex = this.textures.get('windows');

    const materials = [
      new THREE.MeshLambertMaterial({ map: winTex, color: baseColor }),
      new THREE.MeshLambertMaterial({ map: winTex, color: baseColor }),
      new THREE.MeshLambertMaterial({ color: 0x78909c }), // roof
      new THREE.MeshLambertMaterial({ color: 0x546e7a }), // base
      new THREE.MeshLambertMaterial({ map: winTex, color: baseColor }),
      new THREE.MeshLambertMaterial({ map: winTex, color: baseColor }),
    ];

    const building = new THREE.Mesh(geo, materials);
    building.position.set(x, height / 2 + 0.3, z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);

    // Register collider for physics
    this.colliders.push({
      minX: x - size / 2,
      maxX: x + size / 2,
      minZ: z - size / 2,
      maxZ: z + size / 2,
      height: height,
    });

    // Rooftop decoration & neon crown
    if (style === 'highrise' || style === 'artdeco') {
      const crownColor = style === 'artdeco' ? 0xff007f : 0x00e5ff;
      const crownGeo = new THREE.BoxGeometry(size * 0.9, 1.2, size * 0.9);
      const crownMat = new THREE.MeshBasicMaterial({ color: crownColor });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(x, height + 0.9, z);
      this.scene.add(crown);

      // Spire / Antenna
      if (Math.random() > 0.4) {
        const spireGeo = new THREE.CylinderGeometry(0.2, 0.6, 12, 6);
        const spire = new THREE.Mesh(spireGeo, this.materials.get('metal'));
        spire.position.set(x, height + 6 + 0.9, z);
        this.scene.add(spire);

        // Red beacon on top
        const beaconGeo = new THREE.SphereGeometry(0.4, 6, 6);
        const beacon = new THREE.Mesh(beaconGeo, new THREE.MeshBasicMaterial({ color: 0xff1744 }));
        beacon.position.set(x, height + 12.5, z);
        this.scene.add(beacon);
      }
    }
  }

  buildPlazaOrParking(x, z, size) {
    // Green grass or open parking asphalt
    const isGrass = Math.random() > 0.5;
    const parkGeo = new THREE.BoxGeometry(size - 2, 0.35, size - 2);
    const parkMesh = new THREE.Mesh(parkGeo, isGrass ? this.materials.get('grass') : this.materials.get('road'));
    parkMesh.position.set(x, 0.18, z);
    this.scene.add(parkMesh);

    // Add palm tree in plaza center
    if (isGrass) {
      this.createPalmTree(x, z);
    }
  }

  buildPalmTrees() {
    // Line palm trees along the coastal boulevard (X ~ -200)
    for (let z = -260; z <= 260; z += 18) {
      this.createPalmTree(-214, z);
      this.createPalmTree(-228, z + 6);
    }

    // Occasional palms on central sidewalks
    for (let x = -130; x <= 130; x += 45) {
      for (let z = -200; z <= 200; z += 90) {
        if (Math.random() > 0.4) {
          this.createPalmTree(x + 10, z + 10);
        }
      }
    }
  }

  createPalmTree(x, z) {
    const group = new THREE.Group();

    // Curved slender trunk
    const trunkH = 8.5 + Math.random() * 2.5;
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, trunkH, 7);
    const trunk = new THREE.Mesh(trunkGeo, this.materials.get('palmTrunk'));
    trunk.position.y = trunkH / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = true;
    group.add(trunk);

    // Palm fronds crown
    const frondCount = 7;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const frondGeo = new THREE.ConeGeometry(0.9, 4.5, 4);
      frondGeo.rotateX(Math.PI / 2.8);
      const frond = new THREE.Mesh(frondGeo, this.materials.get('palmLeaf'));
      frond.position.set(0, trunkH, 0);
      frond.rotation.y = angle;
      group.add(frond);
    }

    group.position.set(x, 0.3, z);
    this.scene.add(group);
    this.palmTrees.push(group);
  }

  buildStreetProps() {
    // Place street lamps at block corners
    const { GRID_BLOCKS_X, GRID_BLOCKS_Z, BLOCK_SIZE, ROAD_WIDTH } = CONFIG.WORLD;
    const pitch = BLOCK_SIZE + ROAD_WIDTH;

    for (let gx = 0; gx <= GRID_BLOCKS_X; gx++) {
      const x = -((GRID_BLOCKS_X * pitch) / 2) + gx * pitch;
      for (let gz = 0; gz <= GRID_BLOCKS_Z; gz++) {
        const z = -((GRID_BLOCKS_Z * pitch) / 2) + gz * pitch;
        this.createStreetLamp(x + ROAD_WIDTH / 2 + 1.2, z + ROAD_WIDTH / 2 + 1.2);
      }
    }
  }

  createStreetLamp(x, z) {
    const lamp = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 6.5, 6);
    const pole = new THREE.Mesh(poleGeo, this.materials.get('metal'));
    pole.position.y = 3.25;
    lamp.add(pole);

    const headGeo = new THREE.BoxGeometry(0.6, 0.3, 1.2);
    const head = new THREE.Mesh(headGeo, this.materials.get('metal'));
    head.position.set(0, 6.5, 0.4);
    lamp.add(head);

    const bulbGeo = new THREE.SphereGeometry(0.2, 6, 6);
    const bulb = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: 0xffea00 }));
    bulb.position.set(0, 6.35, 0.6);
    lamp.add(bulb);

    lamp.position.set(x, 0.3, z);
    this.scene.add(lamp);
  }

  spawnPickups() {
    const spots = [
      { x: -160, z: -80, type: 'HEALTH' },
      { x: 30, z: 45, type: 'HEALTH' },
      { x: -50, z: 120, type: 'AMMO' },
      { x: 180, z: -120, type: 'AMMO' },
      { x: -190, z: 50, type: 'CASH' },
      { x: 70, z: -150, type: 'CASH' },
    ];

    for (const spot of spots) {
      const pickupDef = CONFIG.PICKUPS.TYPES[spot.type];
      const group = new THREE.Group();

      let mesh;
      if (spot.type === 'HEALTH') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshBasicMaterial({ color: pickupDef.color }));
      } else if (spot.type === 'AMMO') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.7), new THREE.MeshBasicMaterial({ color: pickupDef.color }));
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.3), new THREE.MeshBasicMaterial({ color: pickupDef.color }));
      }

      group.add(mesh);
      group.position.set(spot.x, 1.2, spot.z);
      this.scene.add(group);

      this.pickups.push({
        group,
        type: spot.type,
        value: pickupDef.value,
        active: true,
        x: spot.x,
        z: spot.z,
        respawnTimer: 0,
      });
    }
  }

  update(dt, elapsed) {
    // Water ripple subtle animation
    if (this.waterPlane) {
      this.waterPlane.position.y = CONFIG.WORLD.SEA_LEVEL + Math.sin(elapsed * 1.5) * 0.08;
    }

    // Spin and bob pickups
    for (const p of this.pickups) {
      if (!p.active) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.active = true;
          p.group.visible = true;
        }
        continue;
      }
      p.group.rotation.y += dt * 2.2;
      p.group.position.y = 1.2 + Math.sin(elapsed * 3 + p.x) * 0.2;
    }
  }

  checkCollision(x, z, radius = 0.8) {
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
}
