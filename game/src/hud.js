// Neon Tide - High-Definition HUD, Minimap Radar, and UI Menus
// Aesthetic: Coastal Retro-Modern / Synthwave

import { CONFIG } from './config.js';

export class HUDManager {
  constructor() {
    this.container = null;
    this.minimapCanvas = null;
    this.minimapCtx = null;

    // DOM Elements
    this.healthFill = null;
    this.armorFill = null;
    this.cashText = null;
    this.ammoText = null;
    this.wantedStars = null;
    this.missionCard = null;
    this.missionTitle = null;
    this.missionDetail = null;
    this.speedoCard = null;
    this.speedoMph = null;
    this.speedoBar = null;
    this.toastElem = null;

    // Overlays
    this.startScreen = null;
    this.pauseScreen = null;
    this.bustedScreen = null;
    this.missionPassedScreen = null;

    this.toastTimer = 0;
  }

  init(onStartNewGame, onContinueGame, onResumeGame, onSaveGame, onRestartGame, onToggleMute) {
    this.createDomStructure(onStartNewGame, onContinueGame, onResumeGame, onSaveGame, onRestartGame, onToggleMute);
    this.setupMinimap();
  }

  createDomStructure(onStartNew, onContinue, onResume, onSave, onRestart, onMute) {
    // Root HUD overlay container
    const hud = document.createElement('div');
    hud.id = 'hud-layer';
    hud.style.cssText = `
      position: fixed; inset: 0; pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      user-select: none; color: #ffffff;
    `;
    document.body.appendChild(hud);
    this.container = hud;

    // Top-Left: Player Vital Stats (Health, Armor, Cash, Weapon)
    const topLeft = document.createElement('div');
    topLeft.style.cssText = `
      position: absolute; top: 20px; left: 24px;
      display: flex; flex-direction: column; gap: 8px;
      background: rgba(10, 14, 23, 0.75); padding: 12px 18px;
      border-radius: 8px; border-left: 4px solid #00e5ff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5); backdrop-filter: blur(6px);
    `;
    topLeft.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 11px; font-weight: 700; color: #00e676; width: 38px;">HP</span>
        <div style="width: 140px; height: 10px; background: rgba(255,255,255,0.15); border-radius: 5px; overflow: hidden;">
          <div id="hud-hp-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #00e676, #b2ff59); transition: width 0.15s ease;"></div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 11px; font-weight: 700; color: #00e5ff; width: 38px;">ARMOR</span>
        <div style="width: 140px; height: 8px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden;">
          <div id="hud-armor-fill" style="width: 0%; height: 100%; background: #00e5ff; transition: width 0.15s ease;"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
        <span id="hud-cash" style="font-size: 20px; font-weight: 800; color: #ffd600; letter-spacing: 1px;">$350</span>
        <span id="hud-ammo" style="font-size: 14px; font-weight: 700; color: #80d8ff; letter-spacing: 0.5px;">[PISTOL] 45</span>
      </div>
    `;
    hud.appendChild(topLeft);

    this.healthFill = topLeft.querySelector('#hud-hp-fill');
    this.armorFill = topLeft.querySelector('#hud-armor-fill');
    this.cashText = topLeft.querySelector('#hud-cash');
    this.ammoText = topLeft.querySelector('#hud-ammo');

    // Top-Right: Wanted Stars
    const topRight = document.createElement('div');
    topRight.style.cssText = `
      position: absolute; top: 20px; right: 24px;
      display: flex; gap: 6px; background: rgba(10, 14, 23, 0.75);
      padding: 10px 16px; border-radius: 8px; border-right: 4px solid #ff1744;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5); backdrop-filter: blur(6px);
    `;
    topRight.innerHTML = `
      <div id="hud-wanted" style="font-size: 22px; color: #424242; letter-spacing: 3px;">
        <span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span>
      </div>
    `;
    hud.appendChild(topRight);
    this.wantedStars = topRight.querySelector('#hud-wanted');

    // Top-Center: Mission Objective Card
    const missionCard = document.createElement('div');
    missionCard.id = 'hud-mission-card';
    missionCard.style.cssText = `
      position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(10, 14, 23, 0.85); padding: 10px 22px; border-radius: 8px;
      border-bottom: 3px solid #ffd600; text-align: center; max-width: 440px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6); backdrop-filter: blur(6px);
    `;
    missionCard.innerHTML = `
      <div id="hud-mission-title" style="font-size: 11px; font-weight: 800; color: #ffd600; text-transform: uppercase; letter-spacing: 1.5px;">FREE ROAM</div>
      <div id="hud-mission-detail" style="font-size: 13px; font-weight: 600; color: #e0e0e0; margin-top: 3px;">Explore Palma Verde</div>
    `;
    hud.appendChild(missionCard);
    this.missionCard = missionCard;
    this.missionTitle = missionCard.querySelector('#hud-mission-title');
    this.missionDetail = missionCard.querySelector('#hud-mission-detail');

    // Bottom-Left: Minimap Radar Canvas
    const minimapWrapper = document.createElement('div');
    minimapWrapper.style.cssText = `
      position: absolute; bottom: 24px; left: 24px;
      width: 170px; height: 170px; border-radius: 50%;
      border: 3px solid rgba(0, 229, 255, 0.7);
      background: rgba(14, 18, 28, 0.85); overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 229, 255, 0.25);
    `;
    const mCanvas = document.createElement('canvas');
    mCanvas.width = 170;
    mCanvas.height = 170;
    minimapWrapper.appendChild(mCanvas);
    hud.appendChild(minimapWrapper);

    this.minimapCanvas = mCanvas;
    this.minimapCtx = mCanvas.getContext('2d');

    // Bottom-Right: Vehicle Speedometer
    const speedo = document.createElement('div');
    speedo.id = 'hud-speedo';
    speedo.style.cssText = `
      position: absolute; bottom: 24px; right: 24px; display: none;
      background: rgba(10, 14, 23, 0.8); padding: 14px 20px; border-radius: 8px;
      border-right: 4px solid #00e5ff; text-align: right;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5); backdrop-filter: blur(6px);
    `;
    speedo.innerHTML = `
      <div style="font-size: 10px; font-weight: 800; color: #90caf9; letter-spacing: 1px;">SPEED</div>
      <div id="hud-speed-val" style="font-size: 26px; font-weight: 900; color: #ffffff;">0 <span style="font-size: 12px; color: #00e5ff;">MPH</span></div>
      <div style="width: 100px; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin-top: 6px; overflow: hidden;">
        <div id="hud-speed-bar" style="width: 0%; height: 100%; background: #00e5ff;"></div>
      </div>
    `;
    hud.appendChild(speedo);
    this.speedoCard = speedo;
    this.speedoMph = speedo.querySelector('#hud-speed-val');
    this.speedoBar = speedo.querySelector('#hud-speed-bar');

    // Bottom-Center: Controls Hint Banner
    const hints = document.createElement('div');
    hints.style.cssText = `
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
      font-size: 11px; color: rgba(255,255,255,0.6); letter-spacing: 0.5px;
      background: rgba(0,0,0,0.4); padding: 4px 14px; border-radius: 12px;
    `;
    hints.textContent = 'WASD: Drive/Move | Shift: Sprint | E: Enter/Exit | Space: Handbrake | F: Punch | Click: Shoot | P: Pause | M: Mute';
    hud.appendChild(hints);

    // Toast Notification Banner
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: absolute; top: 85px; left: 50%; transform: translateX(-50%);
      background: rgba(0, 229, 255, 0.9); color: #0a0e17; font-weight: 800;
      font-size: 13px; padding: 6px 18px; border-radius: 4px; display: none;
      box-shadow: 0 4px 15px rgba(0, 229, 255, 0.4); text-transform: uppercase;
    `;
    hud.appendChild(toast);
    this.toastElem = toast;

    // Build Screen Modals (Start, Pause, Busted, Mission Passed)
    this.buildModals(onStartNew, onContinue, onResume, onSave, onRestart, onMute);
  }

  buildModals(onStartNew, onContinue, onResume, onSave, onRestart, onMute) {
    // 1. Start / Title Screen
    const start = document.createElement('div');
    start.id = 'screen-start';
    start.style.cssText = `
      position: fixed; inset: 0; background: radial-gradient(circle at center, rgba(12,20,36,0.30) 0%, rgba(6,12,24,0.55) 100%);
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      z-index: 100; pointer-events: auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    start.innerHTML = `
      <div style="font-size: 58px; font-weight: 900; letter-spacing: 8px; background: linear-gradient(135deg, #ff007f, #00e5ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 30px rgba(255,0,127,0.5);">
        NEON TIDE
      </div>
      <div style="font-size: 16px; font-weight: 700; color: #ffd600; letter-spacing: 4px; margin-top: 6px; text-transform: uppercase;">
        Palma Verde Stories
      </div>
      <div style="max-width: 480px; text-align: center; color: #b0bec5; font-size: 14px; line-height: 1.6; margin: 24px 0;">
        Welcome to Palma Verde. Fresh off the boat, Dante Rios must navigate the sun-drenched coastal highways, hotwire fast cars, evade relentless PVPD cruisers, and take over the city.
      </div>
      <div style="display: flex; gap: 16px;">
        <button id="btn-new-game" style="padding: 12px 32px; font-size: 15px; font-weight: 800; background: #00e5ff; color: #0a0e17; border: none; border-radius: 6px; cursor: pointer; letter-spacing: 1px; transition: transform 0.1s;">NEW GAME</button>
        <button id="btn-continue-game" style="padding: 12px 32px; font-size: 15px; font-weight: 800; background: transparent; color: #ffd600; border: 2px solid #ffd600; border-radius: 6px; cursor: pointer; letter-spacing: 1px; opacity: 0.5;">CONTINUE</button>
      </div>
      <div style="margin-top: 36px; font-size: 12px; color: #78909c;">
        Controls: WASD Move/Steer | Mouse Orbit | Shift Sprint | E Enter/Exit Car | F Punch | Click Shoot | P Pause
      </div>
    `;
    document.body.appendChild(start);
    this.startScreen = start;

    start.querySelector('#btn-new-game').onclick = () => {
      start.style.display = 'none';
      if (onStartNew) onStartNew();
    };

    const continueBtn = start.querySelector('#btn-continue-game');
    if (localStorage.getItem('neontide_save')) {
      continueBtn.style.opacity = '1.0';
      continueBtn.onclick = () => {
        start.style.display = 'none';
        if (onContinue) onContinue();
      };
    }

    // 2. Pause Screen
    const pause = document.createElement('div');
    pause.id = 'screen-pause';
    pause.style.cssText = `
      position: fixed; inset: 0; background: rgba(5, 8, 15, 0.85); backdrop-filter: blur(8px);
      display: none; flex-direction: column; justify-content: center; align-items: center;
      z-index: 100; pointer-events: auto;
    `;
    pause.innerHTML = `
      <div style="font-size: 42px; font-weight: 900; color: #ffffff; letter-spacing: 6px; margin-bottom: 24px;">PAUSED</div>
      <div style="display: flex; flex-direction: column; gap: 12px; width: 220px;">
        <button id="btn-resume" style="padding: 12px; font-size: 14px; font-weight: 700; background: #00e5ff; color: #0a0e17; border: none; border-radius: 6px; cursor: pointer;">RESUME</button>
        <button id="btn-save" style="padding: 12px; font-size: 14px; font-weight: 700; background: #ffd600; color: #0a0e17; border: none; border-radius: 6px; cursor: pointer;">SAVE GAME</button>
        <button id="btn-mute" style="padding: 12px; font-size: 14px; font-weight: 700; background: #37474f; color: #ffffff; border: none; border-radius: 6px; cursor: pointer;">TOGGLE SOUND (M)</button>
        <button id="btn-restart" style="padding: 12px; font-size: 14px; font-weight: 700; background: #ff1744; color: #ffffff; border: none; border-radius: 6px; cursor: pointer;">RESTART</button>
      </div>
    `;
    document.body.appendChild(pause);
    this.pauseScreen = pause;

    pause.querySelector('#btn-resume').onclick = () => {
      pause.style.display = 'none';
      if (onResume) onResume();
    };
    pause.querySelector('#btn-save').onclick = () => {
      if (onSave) onSave();
      this.showToast('Game Saved to Local Storage');
    };
    pause.querySelector('#btn-mute').onclick = () => {
      if (onMute) onMute();
    };
    pause.querySelector('#btn-restart').onclick = () => {
      pause.style.display = 'none';
      if (onRestart) onRestart();
    };

    // 3. Busted / Wasted Screen
    const busted = document.createElement('div');
    busted.id = 'screen-busted';
    busted.style.cssText = `
      position: fixed; inset: 0; background: rgba(180, 0, 30, 0.45); backdrop-filter: blur(4px);
      display: none; flex-direction: column; justify-content: center; align-items: center;
      z-index: 100; pointer-events: auto;
    `;
    busted.innerHTML = `
      <div id="busted-title" style="font-size: 64px; font-weight: 900; letter-spacing: 8px; color: #ff1744; text-shadow: 0 0 40px rgba(255,23,68,0.8);">
        BUSTED
      </div>
      <div id="busted-detail" style="font-size: 16px; font-weight: 700; color: #ffffff; margin-top: 10px;">
        Hospitalized at Central Hospital. Medical Fee: $150
      </div>
      <button id="btn-respawn" style="margin-top: 24px; padding: 12px 32px; font-size: 15px; font-weight: 800; background: #ffffff; color: #b71c1c; border: none; border-radius: 6px; cursor: pointer;">
        RESPAWN
      </button>
    `;
    document.body.appendChild(busted);
    this.bustedScreen = busted;

    // 4. Mission Passed Splash Overlay
    const passed = document.createElement('div');
    passed.id = 'screen-passed';
    passed.style.cssText = `
      position: fixed; inset: 0; background: rgba(0, 229, 255, 0.2); pointer-events: none;
      display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 90;
    `;
    passed.innerHTML = `
      <div style="font-size: 52px; font-weight: 900; color: #ffd600; letter-spacing: 6px; text-shadow: 0 0 35px rgba(255,214,0,0.8);">
        MISSION PASSED!
      </div>
      <div id="passed-reward" style="font-size: 24px; font-weight: 800; color: #00e676; margin-top: 10px;">
        +$500 CASH
      </div>
    `;
    document.body.appendChild(passed);
    this.missionPassedScreen = passed;
  }

  setupMinimap() {
    // 2D Minimap radar setup
  }

  showToast(text) {
    this.toastElem.textContent = text;
    this.toastElem.style.display = 'block';
    this.toastTimer = 3.0;
  }

  showBusted(isWasted, fee, onRespawn) {
    const title = isWasted ? 'WASTED' : 'BUSTED';
    const detail = isWasted
      ? `Revived at Palma Verde Hospital. Medical Fee: -$${fee}`
      : `Bailed out of PVPD Station. Bail Fine: -$${fee}`;

    this.bustedScreen.querySelector('#busted-title').textContent = title;
    this.bustedScreen.querySelector('#busted-detail').textContent = detail;
    this.bustedScreen.style.display = 'flex';

    this.bustedScreen.querySelector('#btn-respawn').onclick = () => {
      this.bustedScreen.style.display = 'none';
      if (onRespawn) onRespawn();
    };
  }

  showMissionPassed(mission) {
    const passed = this.missionPassedScreen;
    passed.querySelector('#passed-reward').textContent = `+ $${mission.reward} CASH REWARD`;
    passed.style.display = 'flex';
    setTimeout(() => {
      passed.style.display = 'none';
    }, 3200);
  }

  update(dt, player, police, missions, world, vehicles) {
    // Toast timer
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.toastElem.style.display = 'none';
      }
    }

    // Health & Armor
    this.healthFill.style.width = `${Math.max(0, player.health)}%`;
    this.armorFill.style.width = `${Math.max(0, player.armor)}%`;
    this.cashText.textContent = `$${player.cash}`;
    this.ammoText.textContent = `[PISTOL] ${player.ammo}`;

    // Wanted Stars
    const stars = this.wantedStars.querySelectorAll('.star');
    const level = police.wantedLevel;
    const isBlinking = police.isSearching && Math.floor(Date.now() / 250) % 2 === 0;

    stars.forEach((star, idx) => {
      if (idx < level) {
        star.style.color = isBlinking ? '#ffffff' : '#ffd600';
        star.style.textShadow = '0 0 10px rgba(255, 214, 0, 0.8)';
      } else {
        star.style.color = '#424242';
        star.style.textShadow = 'none';
      }
    });

    // Mission Card
    const obj = missions.getCurrentObjectiveText(player);
    this.missionTitle.textContent = obj.title;
    this.missionDetail.textContent = obj.detail;

    // Speedometer
    if (player.inVehicle && player.currentVehicle) {
      this.speedoCard.style.display = 'block';
      const mph = Math.round(Math.abs(player.currentVehicle.speed) * 2.237);
      this.speedoMph.innerHTML = `${mph} <span style="font-size: 12px; color: #00e5ff;">MPH</span>`;
      const ratio = Math.min(100, (mph / 90) * 100);
      this.speedoBar.style.width = `${ratio}%`;
    } else {
      this.speedoCard.style.display = 'none';
    }

    // Draw Minimap Radar
    this.drawMinimap(player, police, missions, world, vehicles);
  }

  drawMinimap(player, police, missions, world, vehicles) {
    const ctx = this.minimapCtx;
    const W = this.minimapCanvas.width;
    const H = this.minimapCanvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const scale = 0.45; // meters to radar pixels

    ctx.clearRect(0, 0, W, H);

    // Save and rotate radar so player forward is UP
    ctx.save();
    ctx.translate(cx, cy);
    const heading = player.inVehicle && player.currentVehicle ? player.currentVehicle.rotation : player.rotation;
    ctx.rotate(heading);

    const px = player.position.x;
    const pz = player.position.z;

    // Draw City Roads
    ctx.fillStyle = '#2c3440';
    for (const vx of world.roads.vertical) {
      const rx = (vx - px) * scale;
      ctx.fillRect(rx - 4, -400, 8, 800);
    }
    for (const hz of world.roads.horizontal) {
      const rz = (hz - pz) * scale;
      ctx.fillRect(-400, rz - 4, 800, 8);
    }

    // Draw Ocean on West
    const oceanEdge = (CONFIG.WORLD.OCEAN_X - px) * scale;
    ctx.fillStyle = '#0277bd';
    ctx.fillRect(oceanEdge - 200, -400, 200, 800);

    // Draw Mission Objective Waypoint
    const wp = missions.getWaypointCoords();
    if (wp) {
      const wx = (wp.x - px) * scale;
      const wz = (wp.z - pz) * scale;
      ctx.fillStyle = '#ffd600';
      ctx.beginPath();
      ctx.arc(wx, wz, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Traffic & Parked Cars
    ctx.fillStyle = '#90a4ae';
    for (const v of vehicles.vehicles) {
      if (v === player.currentVehicle) continue;
      const vx = (v.position.x - px) * scale;
      const vz = (v.position.z - pz) * scale;
      if (Math.hypot(vx, vz) < cx - 4) {
        ctx.fillRect(vx - 2, vz - 2, 4, 4);
      }
    }

    // Draw Police Cruisers (Flashing Red/Blue dots)
    for (const c of police.copCruisers) {
      const cxPos = (c.position.x - px) * scale;
      const czPos = (c.position.z - pz) * scale;
      ctx.fillStyle = Math.floor(Date.now() / 150) % 2 === 0 ? '#ff1744' : '#2979ff';
      ctx.beginPath();
      ctx.arc(cxPos, czPos, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Draw Player Arrow at Radar Center (Always pointing up)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Compass North Indicator
    ctx.save();
    const northAngle = -heading;
    const nx = cx + Math.sin(northAngle) * (cx - 14);
    const ny = cy - Math.cos(northAngle) * (cy - 14);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny);
    ctx.restore();
  }
}
