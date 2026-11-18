// HUD and 2D Minimap Canvas for Neon Tide
import { TOTAL_SPAN, HALF_SPAN, BLOCK_SIZE, ROAD_WIDTH, BLOCK_COUNT, BEACH_X } from './config.js';

export class HUD {
  constructor() {
    this.elHud = document.getElementById('hud');
    this.elCash = document.getElementById('stat-cash');
    this.elAmmo = document.getElementById('stat-ammo');
    this.elHealthBar = document.getElementById('health-bar');
    this.elStars = document.getElementById('wanted-stars');
    this.elMissionTitle = document.getElementById('mission-title');
    this.elMissionDesc = document.getElementById('mission-desc');
    this.elMissionTimer = document.getElementById('mission-timer');
    this.elVehHud = document.getElementById('vehicle-hud');
    this.elVehName = document.getElementById('veh-name');
    this.elSpeedo = document.getElementById('speedo-val');
    this.elFeed = document.getElementById('feed');

    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.feedMessages = [];
  }

  show() {
    if (this.elHud) this.elHud.classList.remove('hidden');
  }

  hide() {
    if (this.elHud) this.elHud.classList.add('hidden');
  }

  addFeedMessage(text) {
    if (!this.elFeed) return;
    const msg = document.createElement('div');
    msg.className = 'feed-msg';
    msg.textContent = text;
    this.elFeed.appendChild(msg);
    setTimeout(() => {
      if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 4200);
  }
  updateStats(player, police, missions) {
    // Health bar
    if (this.elHealthBar) {
      const pct = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
      this.elHealthBar.style.width = `${pct}%`;
    }

    // Cash & Ammo
    if (this.elCash) this.elCash.textContent = `$${player.cash}`;
    if (this.elAmmo) this.elAmmo.textContent = `AMMO: ${player.ammo}`;

    // Wanted Stars
    if (this.elStars) {
      const starSpans = this.elStars.querySelectorAll('span');
      starSpans.forEach((s, idx) => {
        if (idx < police.wantedStars) {
          s.className = 'star-active';
        } else {
          s.className = '';
        }
      });
    }

    // Vehicle HUD
    if (this.elVehHud) {
      if (player.inVehicle) {
        this.elVehHud.style.visibility = 'visible';
        if (this.elVehName) this.elVehName.textContent = player.inVehicle.type.name;
        if (this.elSpeedo) this.elSpeedo.textContent = player.inVehicle.getSpeedMph();
      } else {
        this.elVehHud.style.visibility = 'hidden';
      }
    }

    // Mission HUD
    const obj = missions.getCurrentObjective();
    if (this.elMissionTitle) this.elMissionTitle.textContent = obj.title;
    if (this.elMissionDesc) this.elMissionDesc.textContent = obj.desc;
    if (this.elMissionTimer) {
      if (obj.timerText) {
        this.elMissionTimer.classList.remove('hidden');
        this.elMissionTimer.textContent = obj.timerText;
      } else {
        this.elMissionTimer.classList.add('hidden');
      }
    }
  }
  renderMinimap(player, traffic, police, missions) {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = 170;
    const h = 170;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.42; // world meters to map pixels

    ctx.clearRect(0, 0, w, h);

    // Dark radar background
    ctx.fillStyle = '#0b0e17';
    ctx.fillRect(0, 0, w, h);

    const pPos = player.inVehicle ? player.inVehicle.position : player.position;
    const pHeading = player.inVehicle ? player.inVehicle.heading : player.rotationY;

    ctx.save();
    ctx.translate(cx, cy);

    // Draw Ocean (West)
    const oceanScreenX = (BEACH_X - pPos.x) * scale;
    ctx.fillStyle = '#004477';
    ctx.fillRect(-w * 2, -h * 2, oceanScreenX + w * 2, h * 4);

    // Draw Beach line
    ctx.fillStyle = '#c4a46a';
    ctx.fillRect(oceanScreenX, -h * 2, 10 * scale, h * 4);

    // Draw Road Grid
    ctx.fillStyle = '#222838';
    const pitch = BLOCK_SIZE + ROAD_WIDTH;

    for (let i = 0; i <= BLOCK_COUNT; i++) {
      const rx = (-HALF_SPAN + i * pitch - pPos.x) * scale;
      ctx.fillRect(rx - (ROAD_WIDTH * scale) / 2, -h, ROAD_WIDTH * scale, h * 2);
    }
    for (let j = 0; j <= BLOCK_COUNT; j++) {
      const rz = (-HALF_SPAN + j * pitch - pPos.z) * scale;
      ctx.fillRect(-w, rz - (ROAD_WIDTH * scale) / 2, w * 2, ROAD_WIDTH * scale);
    }
    // Traffic Cars (Grey dots)
    ctx.fillStyle = '#8899aa';
    traffic.vehicles.forEach((v) => {
      if (v === player.inVehicle) return;
      const vx = (v.position.x - pPos.x) * scale;
      const vz = (v.position.z - pPos.z) * scale;
      if (Math.abs(vx) < cx && Math.abs(vz) < cy) {
        ctx.fillRect(vx - 2, vz - 2, 4, 4);
      }
    });

    // Police Units (Red/Blue dots)
    police.units.forEach((u) => {
      const pos = u.type === 'CRUISER' ? u.entity.position : u.entity.position;
      const px = (pos.x - pPos.x) * scale;
      const pz = (pos.z - pPos.z) * scale;
      if (Math.abs(px) < cx && Math.abs(pz) < cy) {
        ctx.fillStyle = '#ff2244';
        ctx.beginPath();
        ctx.arc(px, pz, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Mission Target Waypoint (Pulsing Gold)
    if (missions.markerGroup.visible) {
      const mx = (missions.markerGroup.position.x - pPos.x) * scale;
      const mz = (missions.markerGroup.position.z - pPos.z) * scale;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(mx, mz, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Player Arrow in center
    ctx.rotate(-pHeading);
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-5, -6);
    ctx.lineTo(0, -3);
    ctx.lineTo(5, -6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
