// Neon Tide - Competition Entrypack & Dossier Builder
// make.fun gta6-01 bounty submission entrypoint (Node 22 stdlib only)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Resolve current repository root and destination output directory
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Ensure target directory exists
mkdirSync(outputDir, { recursive: true });

// Copy the game directory (static ES modules and vendored engine)
cpSync(join(rootDir, 'game'), join(outputDir, 'game'), { recursive: true });

// Copy the real in-game screenshots
const screenshotsTarget = join(outputDir, 'screenshots');
mkdirSync(screenshotsTarget, { recursive: true });
const screenshotsSource = join(rootDir, 'screenshots');
if (existsSync(screenshotsSource)) {
  cpSync(screenshotsSource, screenshotsTarget, { recursive: true });
}

// Generate deterministic dossier.json using vendored make.fun game library
// Caps adhere strictly to competition gate rules
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
