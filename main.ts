// Neon Tide: Palma Verde - Submission Entrypoint for make.fun gta6-01
// Node 22 runtime, standard library only.
// Copies game/ and screenshots/ to MAKEFUN_OUTPUT_DIR and builds dossier.json.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Ensure destination output directory exists
mkdirSync(outputDir, { recursive: true });

// Copy game assets and sources
const gameSrc = join(rootDir, 'game');
const gameDest = join(outputDir, 'game');
cpSync(gameSrc, gameDest, { recursive: true });
// Copy promotional screenshot captures
const screenSrc = join(rootDir, 'screenshots');
const screenDest = join(outputDir, 'screenshots');
mkdirSync(screenDest, { recursive: true });
if (existsSync(screenSrc)) {
  cpSync(screenSrc, screenDest, { recursive: true });
}

// Generate deterministic judge dossier via make.fun vendor library
const dossierData = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: {
    max: 4,
    max_bytes: 262144,
  },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossierData);
