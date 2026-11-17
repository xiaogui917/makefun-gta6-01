// Neon Tide - Global Game Configuration & Constants
// Fictional setting: Palma Verde

export const CONFIG = {
  TITLE: 'Neon Tide',
  CITY: 'Palma Verde',
  VERSION: '1.0.0',

  // World Grid Layout
  WORLD: {
    GRID_BLOCKS_X: 6,
    GRID_BLOCKS_Z: 6,
    BLOCK_SIZE: 72,      // width & depth of a city block
    ROAD_WIDTH: 18,      // width of road corridor
    SIDEWALK_WIDTH: 3.5, // sidewalk width on each side
    BUILDING_MIN_H: 15,
    BUILDING_MAX_H: 80,
    OCEAN_X: -260,       // western boundary starts ocean
    BEACH_WIDTH: 45,
    TOTAL_WIDTH: 600,
    TOTAL_DEPTH: 600,
    GRAVITY: 9.81,
    SEA_LEVEL: -0.2,
  },

  // Districts of Palma Verde
  DISTRICTS: {
    BEACH: { name: 'Ocean Vista', color: '#00e5ff', zMin: -300, zMax: 300, xMin: -300, xMax: -120 },
    DOWNTOWN: { name: 'Downtown Palms', color: '#ff007f', zMin: -150, zMax: 150, xMin: -120, xMax: 150 },
    HARBOR: { name: 'Port Lorenzo', color: '#ffb300', zMin: -300, zMax: 300, xMin: 150, xMax: 300 },
    RESIDENTIAL: { name: 'Palma Heights', color: '#76ff03', zMin: -300, zMax: -150, xMin: -120, xMax: 150 },
  },

  // Player Physics & Combat
  PLAYER: {
    WALK_SPEED: 4.8,
    RUN_SPEED: 9.5,
    TURN_SPEED: 12.0,
    MAX_HEALTH: 100,
    MAX_ARMOR: 100,
    PUNCH_DAMAGE: 28,
    PUNCH_RANGE: 2.3,
    PUNCH_COOLDOWN: 0.35,
    PISTOL_DAMAGE: 38,
    PISTOL_RANGE: 70,
    PISTOL_COOLDOWN: 0.22,
    START_AMMO: 45,
    MAX_AMMO: 150,
    START_CASH: 350,
    VEHICLE_ENTER_DIST: 3.8,
    RESPAWN_POS: { x: 20, y: 0.5, z: 20 }, // Central Hospital
  },

  // Vehicle Presets
  VEHICLES: {
    SPORT: {
      type: 'sport',
      name: 'Vipera GT',
      topSpeed: 42,
      accel: 28,
      reverseSpeed: 14,
      brake: 36,
      handbrakeDrift: 2.8,
      steerSpeed: 2.1,
      health: 190,
      mass: 1200,
      colors: [0xff1744, 0x00e676, 0xffea00, 0x2979ff],
    },
    SEDAN: {
      type: 'sedan',
      name: 'Stallion 400',
      topSpeed: 30,
      accel: 18,
      reverseSpeed: 10,
      brake: 26,
      handbrakeDrift: 1.8,
      steerSpeed: 1.6,
      health: 240,
      mass: 1550,
      colors: [0x37474f, 0x1565c0, 0x2e7d32, 0x4527a0],
    },
    POLICE: {
      type: 'police',
      name: 'Palma PD Interceptor',
      topSpeed: 36,
      accel: 24,
      reverseSpeed: 12,
      brake: 32,
      handbrakeDrift: 2.0,
      steerSpeed: 1.9,
      health: 280,
      mass: 1700,
      colors: [0x111111],
    },
    TAXI: {
      type: 'taxi',
      name: 'Sun Cab',
      topSpeed: 27,
      accel: 16,
      reverseSpeed: 9,
      brake: 24,
      handbrakeDrift: 1.6,
      steerSpeed: 1.5,
      health: 210,
      mass: 1500,
      colors: [0xffb300],
    },
    VAN: {
      type: 'van',
      name: 'Hauler Cargo',
      topSpeed: 22,
      accel: 12,
      reverseSpeed: 8,
      brake: 20,
      handbrakeDrift: 1.2,
      steerSpeed: 1.2,
      health: 350,
      mass: 2200,
      colors: [0x607d8b, 0x78909c, 0x455a64],
    },
  },

  // Pedestrians
  PEDESTRIANS: {
    COUNT: 24,
    WALK_SPEED: 1.8,
    RUN_SPEED: 4.8,
    MAX_HEALTH: 45,
    FLEE_DISTANCE: 25,
    CASH_DROP: { min: 20, max: 80 },
  },

  // Traffic
  TRAFFIC: {
    COUNT: 14,
    FOLLOW_DISTANCE: 12,
    CRUISE_SPEED: 14,
    LANE_OFFSET: 4.0,
  },

  // Wanted System & Police
  WANTED: {
    MAX_STARS: 5,
    EVASION_TIME: 14, // seconds out of sight to lose wanted level
    SIGHT_DISTANCE: 45,
    DISCHARGE_CRIME: 1,
    THEFT_CRIME: 1,
    HIT_PED_CRIME: 2,
    RAM_POLICE_CRIME: 2,
    KILL_OFFICER_CRIME: 3,
    HOSPITAL_FEE: 150,
    BUSTED_FEE: 200,
    OFFICER_SPEED: 5.5,
    OFFICER_HEALTH: 75,
    OFFICER_DAMAGE: 15,
  },

  // Story Missions in Palma Verde
  MISSIONS: [
    {
      id: 'm1_first_wheels',
      title: 'First Wheels',
      client: 'Lorenzo',
      reward: 500,
      intro: 'Welcome to Palma Verde, Dante. You cannot get around on foot in this town. Head to Club Neon downtown, hotwire the red Vipera GT, and deliver it in one piece to my harbor workshop.',
      targetVehicle: 'sport',
      startPoint: { x: -30, z: -40 },
      dropPoint: { x: 210, z: 90 },
      tolerance: 8,
    },
    {
      id: 'm2_bay_courier',
      title: 'Bay Courier',
      client: 'Lorenzo',
      reward: 1200,
      intro: 'Urgent cargo needs to reach the Marina Pier before customs closes the gate. Take the coastal highway along Ocean Boulevard and punch through all 3 checkpoints before the clock runs out!',
      timeLimit: 90,
      checkpoints: [
        { x: -160, z: 120 },
        { x: -210, z: -30 },
        { x: -170, z: -180 },
      ],
      tolerance: 10,
    },
    {
      id: 'm3_heat_run',
      title: 'Heat Run',
      client: 'Lorenzo',
      reward: 3000,
      intro: 'A rival syndicate tipped off the Palma Verde PD! The harbor is surrounded by patrol units. You are at 3-Star Wanted Level from the jump. Shake the tail, lose the police, and make it to the safehouse hideout!',
      forcedWanted: 3,
      safehousePoint: { x: 60, z: -200 },
      tolerance: 8,
    },
  ],

  // Pickups
  PICKUPS: {
    RESPAWN_TIME: 30,
    TYPES: {
      HEALTH: { type: 'health', value: 40, color: 0x00e676 },
      AMMO: { type: 'ammo', value: 30, color: 0x2979ff },
      CASH: { type: 'cash', value: 250, color: 0xffd600 },
    },
  },
};
