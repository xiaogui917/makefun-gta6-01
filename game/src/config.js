// Neon Tide - Global Game Configuration & Numerical Constants

export const WORLD_CONFIG = {
  CITY_SIZE: 600,
  BLOCK_COUNT: 6,
  BLOCK_SIZE: 72,
  ROAD_WIDTH: 18,
  SIDEWALK_WIDTH: 3.5,
  BEACH_WIDTH: 90,
  OCEAN_WIDTH: 220,
  BUILDING_MIN_HEIGHT: 15,
  BUILDING_MAX_HEIGHT: 80,
  DISTRICTS: {
    DOWNTOWN: { name: 'Downtown', minHeight: 45, maxHeight: 80, colorPalette: [0x223344, 0x1a2634, 0x334455, 0x0f172a] },
    BEACHFRONT: { name: 'Oceanfront Promenade', minHeight: 20, maxHeight: 45, colorPalette: [0xee88aa, 0x44ccee, 0xf0e68c, 0xff7799] },
    PORT: { name: 'Port & Industrial', minHeight: 12, maxHeight: 25, colorPalette: [0x555555, 0x6b5b45, 0x475569, 0x334155] },
    RESIDENTIAL: { name: 'Palma Suburbs', minHeight: 16, maxHeight: 35, colorPalette: [0xdfd8c8, 0xb8c5d6, 0xdeb887, 0x90a4ae] }
  }
};

export const PLAYER_CONFIG = {
  WALK_SPEED: 7.0,
  RUN_SPEED: 14.0,
  TURN_SPEED: 8.0,
  MAX_HEALTH: 100,
  START_AMMO: 60,
  PUNCH_DAMAGE: 25,
  PUNCH_RANGE: 2.4,
  GUN_DAMAGE: 45,
  GUN_RANGE: 65,
  ENTER_VEHICLE_RADIUS: 3.6
};
export const VEHICLE_CONFIG = {
  SPORTS: {
    type: 'sports',
    name: 'Verde Turbo GT',
    maxSpeed: 44,
    accel: 30,
    brake: 45,
    turnSpeed: 2.3,
    length: 4.4,
    width: 2.0,
    height: 1.25,
    colors: [0xff0055, 0x00f0ff, 0xffbb00, 0x7928ca, 0xffffff]
  },
  SEDAN: {
    type: 'sedan',
    name: 'Palma Cruiser',
    maxSpeed: 32,
    accel: 20,
    brake: 38,
    turnSpeed: 1.9,
    length: 4.6,
    width: 2.1,
    height: 1.45,
    colors: [0x2563eb, 0x475569, 0x059669, 0xd97706, 0xe2e8f0]
  },
  POLICE: {
    type: 'police',
    name: 'Metro Police Cruiser',
    maxSpeed: 38,
    accel: 26,
    brake: 42,
    turnSpeed: 2.1,
    length: 4.7,
    width: 2.1,
    height: 1.5,
    colors: [0x111111],
    isPolice: true
  },
  TAXI: {
    type: 'taxi',
    name: 'Cab 86',
    maxSpeed: 30,
    accel: 18,
    brake: 36,
    turnSpeed: 1.8,
    length: 4.6,
    width: 2.1,
    height: 1.5,
    colors: [0xf59e0b]
  },
  TRUCK: {
    type: 'truck',
    name: 'Cargo Mule',
    maxSpeed: 23,
    accel: 13,
    brake: 30,
    turnSpeed: 1.4,
    length: 5.6,
    width: 2.4,
    height: 2.2,
    colors: [0x334155, 0x0284c7, 0x64748b]
  }
};
export const WANTED_CONFIG = {
  MAX_STARS: 5,
  COOLDOWN_TIME: 14.0,
  COP_SPAWN_INTERVAL: [999, 12, 8, 5, 3.5, 2.5],
  MAX_COPS: [0, 1, 2, 3, 4, 5],
  CRIMES: {
    STEAL_CAR: 1,
    HIT_PEDESTRIAN: 2,
    FIRE_WEAPON: 1,
    HIT_POLICE_CAR: 2,
    ATTACK_POLICE: 3
  }
};

export const ECONOMY_CONFIG = {
  MISSION_REWARDS: [500, 1200, 3000],
  PICKUP_HEALTH: 40,
  PICKUP_AMMO: 30,
  PICKUP_CASH: 250,
  HOSPITAL_FINE: 250
};

export const CAMERA_CONFIG = {
  FOOT_OFFSET: { x: 0, y: 2.2, z: 4.8 },
  CAR_OFFSET: { x: 0, y: 3.2, z: 8.5 },
  SMOOTH_FACTOR: 0.12,
  FOV: 65
};
