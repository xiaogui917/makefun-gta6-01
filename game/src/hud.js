// Neon Tide - HUD, Canvas Minimap Radar, Wanted Stars & Screen Overlays
import { WORLD_CONFIG } from './config.js';

export class HUD {
  constructor() {
    this.missionTitle = document.getElementById('mission-title');
    this.missionDesc = document.getElementById('mission-desc');
    this.missionTimer = document.getElementById('mission-timer');

    this.starEls = document.querySelectorAll('#wanted-box .star');
    this.cashDisplay = document.getElementById('cash-display');
    this.healthBarFill = document.getElementById('health-bar-fill');
    this.ammoDisplay = document.getElementById('ammo-display');

    this.speedoBox = document.getElementById('speedo-box');
    this.speedoVal = document.getElementById('speedo-val');
    this.vehicleName = document.getElementById('vehicle-name');

    this.msgFeed = document.getElementById('msg-feed');
    this.promptBox = document.getElementById('prompt-box');

    this.startOverlay = document.getElementById('start-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.wastedOverlay = document.getElementById('wasted-overlay');
    this.wastedTitle = document.getElementById('wasted-title');
    this.wastedSub = document.getElementById('wasted-sub');

    this.minimapCanvas = document.getElementById('minimap');
    this.mmCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
  }
  update(player, police, vehicleManager, missionManager) {
    // Stats
    if (this.cashDisplay) this.cashDisplay.textContent = `$ ${player.cash.toLocaleString()}`;
    if (this.healthBarFill) {
      const pct = Math.max(0, Math.min(100, player.health));
      this.healthBarFill.style.width = `${pct}%`;
    }
    if (this.ammoDisplay) this.ammoDisplay.textContent = `AMMO: ${player.ammo}`;

    // Speedometer
    if (player.isDriving && player.currentVehicle) {
      this.speedoBox.style.display = 'block';
      this.speedoVal.textContent = player.currentVehicle.getSpeedMPH();
      this.vehicleName.textContent = player.currentVehicle.config.name;
    } else {
      this.speedoBox.style.display = 'none';
    }

    // Wanted stars
    this.updateWantedStars(police.wantedLevel);

    // Minimap
    this.renderMinimap(player, vehicleManager, missionManager);
  }

  updateWantedStars(level) {
    this.starEls.forEach((star, idx) => {
      const starNum = idx + 1;
      if (starNum <= level) {
        star.classList.add('active');
        if (level >= 3) star.classList.add('pulse');
      } else {
        star.classList.remove('active', 'pulse');
      }
    });
  }

  showMission(title, desc, timer = 0) {
    if (this.missionTitle) this.missionTitle.textContent = title;
    if (this.missionDesc) this.missionDesc.textContent = desc;
    this.updateTimer(timer);
  }

  updateTimer(seconds) {
    if (!this.missionTimer) return;
    if (seconds > 0) {
      this.missionTimer.style.display = 'block';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      this.missionTimer.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      this.missionTimer.style.display = 'none';
    }
  }
  postMessage(text) {
    if (!this.msgFeed) return;
    const msg = document.createElement('div');
    msg.className = 'msg-item';
    msg.textContent = text;
    this.msgFeed.appendChild(msg);
    setTimeout(() => {
      if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 4500);
  }

  showPrompt(text) {
    if (!this.promptBox) return;
    if (text) {
      this.promptBox.textContent = text;
      this.promptBox.style.display = 'block';
    } else {
      this.promptBox.style.display = 'none';
    }
  }

  showWasted(isBusted, onComplete) {
    if (!this.wastedOverlay) return;
    this.wastedTitle.textContent = isBusted ? 'BUSTED' : 'WASTED';
    this.wastedTitle.style.color = isBusted ? '#00f0ff' : '#ff1133';
    this.wastedSub.textContent = isBusted ? 'Detained by Palma Verde Metro Police (-$250)' : 'Recovered at Palma Verde General Hospital (-$250)';
    this.wastedOverlay.style.display = 'flex';

    setTimeout(() => {
      this.wastedOverlay.style.display = 'none';
      if (onComplete) onComplete();
    }, 3000);
  }

  togglePause(paused) {
    if (this.pauseOverlay) {
      this.pauseOverlay.style.display = paused ? 'flex' : 'none';
    }
  }
  renderMinimap(player, vehicleManager, missionManager) {
    if (!this.mmCtx) return;
    const ctx = this.mmCtx;
    const w = 170;
    const h = 170;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.55; // pixels per world meter

    ctx.clearRect(0, 0, w, h);

    // Save and rotate canvas to match player heading
    ctx.save();
    ctx.translate(cx, cy);
    const heading = player.isDriving && player.currentVehicle ? player.currentVehicle.rotation : player.rotation;
    ctx.rotate(heading);

    // World relative offset
    const px = player.position.x;
    const pz = player.position.z;

    // Draw ocean on west
    const oceanDist = -WORLD_CONFIG.CITY_SIZE / 2 - px;
    ctx.fillStyle = '#005588';
    ctx.fillRect(oceanDist * scale - 120, -150, 120, 300);

    // Draw city blocks
    const { BLOCK_COUNT, BLOCK_SIZE, ROAD_WIDTH, CITY_SIZE } = WORLD_CONFIG;
    const half = CITY_SIZE / 2;
    ctx.fillStyle = '#1e2430';

    for (let bz = 0; bz < BLOCK_COUNT; bz++) {
      for (let bx = 0; bx < BLOCK_COUNT; bx++) {
        const bxPos = -half + ROAD_WIDTH + bx * (BLOCK_SIZE + ROAD_WIDTH) + BLOCK_SIZE / 2 - px;
        const bzPos = -half + ROAD_WIDTH + bz * (BLOCK_SIZE + ROAD_WIDTH) + BLOCK_SIZE / 2 - pz;
        ctx.fillRect(
          (bxPos - BLOCK_SIZE / 2) * scale,
          (bzPos - BLOCK_SIZE / 2) * scale,
          BLOCK_SIZE * scale,
          BLOCK_SIZE * scale
        );
      }
    }

    // Draw other vehicles
    for (const v of vehicleManager.vehicles) {
      if (v === player.currentVehicle) continue;
      const vx = (v.position.x - px) * scale;
      const vz = (v.position.z - pz) * scale;
      if (Math.hypot(vx, vz) < 80) {
        ctx.fillStyle = v.isPolice ? (Math.random() > 0.5 ? '#ff0033' : '#0044ff') : '#ffffff';
        ctx.fillRect(vx - 2, vz - 2, 4, 4);
      }
    }

    // Draw mission marker
    const target = missionManager.getActiveTarget();
    if (target) {
      const tx = (target.x - px) * scale;
      const tz = (target.z - pz) * scale;
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(tx, tz, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Center player arrow (always facing UP in rotated radar)
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx - 5, cy + 6);
    ctx.lineTo(cx, cy + 3);
    ctx.lineTo(cx + 5, cy + 6);
    ctx.closePath();
    ctx.fill();
  }
}
