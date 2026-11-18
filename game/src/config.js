// Configuration and constants for Neon Tide: Palma Verde
export const CITY_SIZE = 600;
export const BLOCK_COUNT = 6;
export const BLOCK_SIZE = 72;
export const ROAD_WIDTH = 18;
export const SIDEWALK_WIDTH = 3.5;
export const TOTAL_SPAN = BLOCK_COUNT * (BLOCK_SIZE + ROAD_WIDTH); // ~540m
export const HALF_SPAN = TOTAL_SPAN / 2;

export const OCEAN_X = -HALF_SPAN - 40;
export const BEACH_X = -HALF_SPAN;

export const DISTRICTS = {
  DOWNTOWN: { name: 'Downtown Core', minX: 0, maxX: HALF_SPAN, minZ: -HALF_SPAN, maxZ: 0, minHeight: 40, maxHeight: 85 },
  BEACHFRONT: { name: 'Oceanfront Boulevard', minX: -HALF_SPAN, maxX: 0, minZ: -HALF_SPAN, maxZ: 0, minHeight: 20, maxHeight: 45 },
  PORT: { name: 'Puerto Industrial', minX: 0, maxX: HALF_SPAN, minZ: 0, maxZ: HALF_SPAN, minHeight: 14, maxHeight: 30 },
  RESIDENTIAL: { name: 'Palma Palms Estates', minX: -HALF_SPAN, maxX: 0, minZ: 0, maxZ: HALF_SPAN, minHeight: 15, maxHeight: 35 },
};

export const PLAYER_CONFIG = {
  maxHealth: 100,
  walkSpeed: 4.8,
  runSpeed: 9.6,
  turnSpeed: 2.8,
  punchDamage: 25,
  gunDamage: 45,
  punchRange: 2.5,
  gunRange: 55,
  startAmmo: 60,
  startCash: 250,
  hospitalFee: 200,
};
export const WANTED_CONFIG = {
  maxStars: 5,
  decayCooldown: 14.0, // seconds out of line of sight
  sightRadius: 60,
  crimes: {
    stealVehicle: 1,
    hitPedestrian: 2,
    shootWeapon: 1,
    hitPoliceCar: 2,
    attackPolice: 3,
  },
  spawnIntervals: [999, 12, 8, 5, 3.5, 2.5],
  maxCops: [0, 2, 4, 6, 8, 12],
};

export const VEHICLE_TYPES = {
  SPORTS: {
    id: 'SPORTS',
    name: 'Neon GT Turbo',
    maxSpeed: 28.0,
    accel: 22.0,
    brake: 28.0,
    turnSpeed: 2.7,
    bodyColor: 0xff0055,
    length: 4.4,
    width: 2.0,
    height: 1.25,
    weight: 1200,
  },
  SEDAN: {
    id: 'SEDAN',
    name: 'Palma Cruiser Sedan',
    maxSpeed: 21.0,
    accel: 15.0,
    brake: 22.0,
    turnSpeed: 2.2,
    bodyColor: 0x2266bb,
    length: 4.6,
    width: 2.0,
    height: 1.45,
    weight: 1500,
  },
  POLICE: {
    id: 'POLICE',
    name: 'PVPD Interceptor',
    maxSpeed: 26.0,
    accel: 20.0,
    brake: 26.0,
    turnSpeed: 2.5,
    bodyColor: 0x111318,
    length: 4.7,
    width: 2.05,
    height: 1.48,
    weight: 1650,
  },
  TAXI: {
    id: 'TAXI',
    name: 'Sun Cab',
    maxSpeed: 20.0,
    accel: 14.0,
    brake: 22.0,
    turnSpeed: 2.2,
    bodyColor: 0xf5b700,
    length: 4.6,
    width: 2.0,
    height: 1.48,
    weight: 1550,
  },
  VAN: {
    id: 'VAN',
    name: 'Cargo Box Hauler',
    maxSpeed: 16.5,
    accel: 11.0,
    brake: 18.0,
    turnSpeed: 1.8,
    bodyColor: 0x667788,
    length: 5.2,
    width: 2.2,
    height: 2.2,
    weight: 2400,
  },
};
export const PICKUP_CONFIG = {
  health: { amount: 40, color: 0x33ff66, radius: 1.8, label: 'First Aid Pack' },
  ammo: { amount: 30, color: 0xffaa00, radius: 1.8, label: 'Munitions Crate' },
  cash: { amount: 250, color: 0x00f0ff, radius: 1.8, label: 'Cash Stash' },
};

export const MISSIONS_DATA = [
  {
    id: 'mission_1',
    name: 'First Wheels',
    subtitle: 'Acquisition',
    desc: 'Steal the Neon GT parked outside the Grand Coral Hotel and deliver it to Leo’s Chop Shop in Puerto Industrial.',
    reward: 500,
    targetType: 'vehicle_delivery',
    targetVehicleType: 'SPORTS',
    spawnPos: { x: -140, z: -120 },
    dropoffPos: { x: 160, z: 140 },
    timeLimit: 0,
  },
  {
    id: 'mission_2',
    name: 'Bay Courier',
    subtitle: 'Urgent Transit',
    desc: 'Retrieve encrypted drives from the Downtown Tech Hub and race them across the city to Oceanfront before the 90-second courier window shuts.',
    reward: 1200,
    targetType: 'timed_delivery',
    pickupPos: { x: 150, z: -150 },
    dropoffPos: { x: -180, z: 80 },
    timeLimit: 90,
  },
  {
    id: 'mission_3',
    name: 'Heat Run',
    subtitle: 'Tactical Escape',
    desc: 'A syndicate tip triggered a 3-star citywide lockdown. Shake the tactical pursuit and reach the Neon Safehouse on North Beach alive.',
    reward: 3000,
    targetType: 'survive_wanted',
    requiredWanted: 3,
    safehousePos: { x: -180, z: -190 },
    timeLimit: 0,
  },
];
