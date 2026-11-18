// Procedural WebAudio System for Neon Tide
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenLfo = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicGain = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopEngine();
      this.stopSiren();
      if (this.musicGain) this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      if (this.musicGain) this.musicGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    }
    return this.muted;
  }

  createNoiseBuffer(duration = 0.3) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
  playGunshot() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Noise crack
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.18);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(1.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);

    // Low punch thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.15);
    oscGain.gain.setValueAtTime(0.4, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }
  playPunch() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  playCrash() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.35);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }
  playPickup() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);
      gain.gain.setValueAtTime(0.18, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.15);
    });
  }

  playMissionComplete() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const chords = [
      { f: [261.63, 329.63, 392.0], delay: 0 },
      { f: [349.23, 440.0, 523.25], delay: 0.2 },
      { f: [392.0, 493.88, 587.33], delay: 0.4 },
      { f: [523.25, 659.25, 783.99, 1046.5], delay: 0.65 },
    ];

    chords.forEach((c) => {
      c.f.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + c.delay);
        gain.gain.setValueAtTime(0.12, t + c.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + c.delay + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + c.delay);
        osc.stop(t + c.delay + 0.5);
      });
    });
  }
  updateEngine(speedRatio) {
    if (this.muted) {
      this.stopEngine();
      return;
    }
    this.ensureContext();
    if (!this.ctx) return;

    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(50, this.ctx.currentTime);
      this.engineGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
    }

    const t = this.ctx.currentTime;
    const targetFreq = 45 + Math.min(Math.abs(speedRatio), 1.5) * 160;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.08);
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {}
      this.engineOsc = null;
      this.engineGain = null;
    }
  }
  setSiren(active) {
    if (this.muted || !active) {
      this.stopSiren();
      return;
    }
    this.ensureContext();
    if (!this.ctx) return;

    if (!this.sirenOsc) {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenLfo = this.ctx.createOscillator();

      const lfoGain = this.ctx.createGain();
      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(750, this.ctx.currentTime);

      this.sirenLfo.frequency.setValueAtTime(1.8, this.ctx.currentTime); // 1.8 Hz cycle
      lfoGain.gain.setValueAtTime(200, this.ctx.currentTime); // +/- 200 Hz

      this.sirenLfo.connect(lfoGain);
      lfoGain.connect(this.sirenOsc.frequency);

      this.sirenGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);

      this.sirenOsc.start();
      this.sirenLfo.start();
    }
  }

  stopSiren() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenLfo.stop();
        this.sirenOsc.disconnect();
        this.sirenLfo.disconnect();
      } catch {}
      this.sirenOsc = null;
      this.sirenGain = null;
      this.sirenLfo = null;
    }
  }

  startMusic() {
    this.ensureContext();
    if (!this.ctx || this.musicTimer) return;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.muted ? 0 : 0.08, this.ctx.currentTime);
    this.musicGain.connect(this.ctx.destination);

    const bassNotes = [110, 110, 130.81, 146.83, 98, 98, 110, 123.47];
    const synthNotes = [440, 523.25, 659.25, 587.33, 392, 440, 493.88, 523.25];

    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const step = this.musicStep % 8;
      this.musicStep++;

      // Synth Bass pulse
      const bassOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassNotes[step], t);
      bGain.gain.setValueAtTime(0.12, t);
      bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      bassOsc.connect(bGain);
      bGain.connect(this.musicGain);
      bassOsc.start(t);
      bassOsc.stop(t + 0.24);

      // Light arpeggio lead on alternate beats
      if (step % 2 === 0) {
        const leadOsc = this.ctx.createOscillator();
        const lGain = this.ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(synthNotes[(step + 2) % 8], t);
        lGain.gain.setValueAtTime(0.08, t);
        lGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        leadOsc.connect(lGain);
        lGain.connect(this.musicGain);
        leadOsc.start(t);
        leadOsc.stop(t + 0.36);
      }
    }, 240); // 125 BPM 16th/8th feel
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
