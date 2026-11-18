// Neon Tide - Entry submission builder for make.fun gta6-01
// Copies game/ assets, scripts, and screenshots to the designated output folder,
// then compiles the sealed dossier.json summary for evaluation.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const baseDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Ensure target output directories exist
mkdirSync(outputDir, { recursive: true });

// Copy static game distribution files
const gameSrc = join(baseDir, 'game');
const gameDst = join(outputDir, 'game');
cpSync(gameSrc, gameDst, { recursive: true });

// Copy promotional screenshots if present
const screenshotsDst = join(outputDir, 'screenshots');
mkdirSync(screenshotsDst, { recursive: true });
const screenshotsSrc = join(baseDir, 'screenshots');
if (existsSync(screenshotsSrc)) {
  cpSync(screenshotsSrc, screenshotsDst, { recursive: true });
}
// Build and write the dossier manifest with strict competitive gate caps
const dossierPath = join(outputDir, 'dossier.json');
const dossierData = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000
});

writeFileSync(dossierPath, dossierData);
