// Neon Tide - Procedural WebAudio Sound & Synthwave Music Generator

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenTimer = null;

    this.musicTimer = null;
    this.musicStep = 0;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.6;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.28;
      this.musicGain.connect(this.masterGain);

      this.initEngineAudio();
      this.startMusicLoop();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.6, this.ctx.currentTime);
    }
    return this.muted;
  }
  initEngineAudio() {
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 45;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    try {
      this.engineOsc.start();
    } catch (_) {}
  }

  setEnginePitchAndVolume(speedNorm, isInsideVehicle) {
    if (!this.engineOsc || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (isInsideVehicle) {
      const freq = 45 + Math.min(speedNorm, 1.4) * 110;
      this.engineOsc.frequency.setTargetAtTime(freq, now, 0.08);
      this.engineGain.gain.setTargetAtTime(0.25, now, 0.08);
    } else {
      this.engineGain.gain.setTargetAtTime(0, now, 0.1);
    }
  }

  setSirenState(active) {
    if (!this.ctx) return;
    if (active && !this.sirenOsc) {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'triangle';
      this.sirenOsc.frequency.value = 750;

      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0.2;

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.sfxGain);
      this.sirenOsc.start();

      let toggle = false;
      this.sirenTimer = setInterval(() => {
        if (!this.sirenOsc || !this.ctx) return;
        toggle = !toggle;
        this.sirenOsc.frequency.setValueAtTime(toggle ? 900 : 650, this.ctx.currentTime);
      }, 450);
    } else if (!active && this.sirenOsc) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
      try { this.sirenOsc.stop(); } catch (_) {}
      this.sirenOsc.disconnect();
      this.sirenGain.disconnect();
      this.sirenOsc = null;
      this.sirenGain = null;
    }
  }
  playGunshot() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  playPunch() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playPickup() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const t = now + idx * 0.06;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  playMissionComplete() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chords = [
      [261.63, 329.63, 392.00],
      [293.66, 369.99, 440.00],
      [349.23, 440.00, 523.25],
      [392.00, 493.88, 587.33]
    ];
    chords.forEach((chord, i) => {
      const t = now + i * 0.22;
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.4);
      });
    });
  }
  startMusicLoop() {
    if (!this.ctx || this.musicTimer) return;
    const bassNotes = [110, 110, 130.81, 146.83, 110, 110, 98, 87.31];
    const padChords = [
      [220, 261.63, 329.63],
      [220, 261.63, 329.63],
      [174.61, 220, 261.63],
      [196, 246.94, 293.66]
    ];

    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const note = bassNotes[this.musicStep % bassNotes.length];

      // Bass plucks
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'sawtooth';
      bOsc.frequency.setValueAtTime(note / 2, now);

      bGain.gain.setValueAtTime(0.22, now);
      bGain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);

      const bFilter = this.ctx.createBiquadFilter();
      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(350, now);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(this.musicGain);

      bOsc.start(now);
      bOsc.stop(now + 0.22);

      // Pad synth every 4 beats
      if (this.musicStep % 4 === 0) {
        const chord = padChords[Math.floor((this.musicStep / 4) % padChords.length)];
        chord.forEach(freq => {
          const pOsc = this.ctx.createOscillator();
          const pGain = this.ctx.createGain();
          pOsc.type = 'triangle';
          pOsc.frequency.value = freq;

          pGain.gain.setValueAtTime(0.08, now);
          pGain.gain.exponentialRampToValueAtTime(0.005, now + 0.95);

          pOsc.connect(pGain);
          pGain.connect(this.musicGain);

          pOsc.start(now);
          pOsc.stop(now + 0.95);
        });
      }

      this.musicStep++;
    }, 260);
  }
}
