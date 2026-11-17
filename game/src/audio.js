// Neon Tide - Procedural WebAudio Synthesizer
// 100% Procedural synthesis - Zero external audio files or network requests

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.muted = false;

    // Engine synth state
    this.engineOsc = null;
    this.engineSub = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.isEngineRunning = false;

    // Siren synth state
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenTimer = null;
    this.isSirenRunning = false;

    // Music loop state
    this.musicActive = false;
    this.musicStep = 0;
    this.nextNoteTime = 0;
    this.tempo = 112; // BPM
    this.noiseBuffer = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.masterGain);

      this.createNoiseBuffer();
    } catch (_) {}
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.7, this.ctx?.currentTime || 0);
    }
    return this.muted;
  }

  // --- Sound Effects ---

  playGunshot() {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Noise crack
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.14);
    }

    // Low punch body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playPunch() {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playCrash() {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;

    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.02, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.38);
    }
  }

  playPickup() {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playMissionSuccess() {
    if (!this.ctx || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;
    // Heroic fanfare chords: F -> G -> A
    const chords = [
      { time: 0, freqs: [349.23, 440.0, 523.25], dur: 0.2 },
      { time: 0.22, freqs: [392.0, 493.88, 587.33], dur: 0.2 },
      { time: 0.46, freqs: [440.0, 554.37, 659.25, 880.0], dur: 0.6 },
    ];

    chords.forEach(({ time, freqs, dur }) => {
      const t = now + time;
      freqs.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + dur + 0.05);
      });
    });
  }

  // --- Continuous Vehicle Engine Sound ---

  startEngine() {
    if (!this.ctx || this.isEngineRunning) return;
    this.resume();
    const now = this.ctx.currentTime;

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, now);

    this.engineSub = this.ctx.createOscillator();
    this.engineSub.type = 'triangle';
    this.engineSub.frequency.setValueAtTime(27.5, now);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(280, now);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.18, now);

    this.engineOsc.connect(this.engineFilter);
    this.engineSub.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start(now);
    this.engineSub.start(now);
    this.isEngineRunning = true;
  }

  updateEngine(speedRatio, isAccelerating) {
    if (!this.ctx || !this.isEngineRunning) return;
    const now = this.ctx.currentTime;
    const baseFreq = 50 + speedRatio * 140 + (isAccelerating ? 25 : 0);
    const filterFreq = 220 + speedRatio * 850 + (isAccelerating ? 150 : 0);

    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
  }

  stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      this.engineOsc?.stop();
      this.engineSub?.stop();
      this.engineOsc?.disconnect();
      this.engineSub?.disconnect();
    } catch (_) {}
    this.isEngineRunning = false;
  }

  // --- Police Siren ---

  startSiren() {
    if (!this.ctx || this.isSirenRunning) return;
    this.resume();
    const now = this.ctx.currentTime;

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'sine';
    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.setValueAtTime(0.25, now);

    // LFO to sweep siren pitch between 650Hz and 950Hz
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'triangle';
    lfo.frequency.setValueAtTime(1.8, now); // ~1.8 Hz wail cycle
    lfoGain.gain.setValueAtTime(160, now);

    this.sirenOsc.frequency.setValueAtTime(800, now);
    lfo.connect(lfoGain);
    lfoGain.connect(this.sirenOsc.frequency);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.sfxGain);

    this.sirenOsc.start(now);
    lfo.start(now);
    this.sirenLfo = lfo;
    this.isSirenRunning = true;
  }

  stopSiren() {
    if (!this.isSirenRunning) return;
    try {
      this.sirenOsc?.stop();
      this.sirenLfo?.stop();
      this.sirenOsc?.disconnect();
      this.sirenLfo?.disconnect();
    } catch (_) {}
    this.isSirenRunning = false;
  }

  // --- Procedural Synthwave Music Engine ---

  startMusic() {
    if (!this.ctx || this.musicActive) return;
    this.resume();
    this.musicActive = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduleMusicStep();
  }

  scheduleMusicStep() {
    if (!this.musicActive || !this.ctx) return;
    const secondsPerBeat = 60.0 / this.tempo;
    const stepDuration = secondsPerBeat / 4; // 16th notes

    while (this.nextNoteTime < this.ctx.currentTime + 0.3) {
      this.playSynthwaveNote(this.musicStep % 32, this.nextNoteTime, stepDuration);
      this.nextNoteTime += stepDuration;
      this.musicStep++;
    }

    requestAnimationFrame(() => this.scheduleMusicStep());
  }

  playSynthwaveNote(step, time, duration) {
    if (this.muted) return;

    // Bassline note pattern in A minor (A1, C2, D2, F2, G2)
    const bassline = [
      55, 55, 110, 55,  55, 55, 110, 55,
      65.4, 65.4, 130.8, 65.4,  73.4, 73.4, 146.8, 73.4,
      55, 55, 110, 55,  55, 55, 110, 55,
      87.3, 87.3, 174.6, 87.3,  98.0, 98.0, 196.0, 98.0,
    ];

    // Bass synth
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    const bassFilter = this.ctx.createBiquadFilter();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(bassline[step] || 55, time);

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(380, time);
    bassFilter.frequency.exponentialRampToValueAtTime(140, time + duration * 0.9);

    bassGain.gain.setValueAtTime(0.2, time);
    bassGain.gain.exponentialRampToValueAtTime(0.01, time + duration * 0.9);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.musicGain);

    bassOsc.start(time);
    bassOsc.stop(time + duration);

    // Drum beat: Kick on beats 0, 4, 8, 12, 16, 20, 24, 28
    if (step % 4 === 0) {
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.frequency.setValueAtTime(130, time);
      kick.frequency.exponentialRampToValueAtTime(35, time + 0.12);

      kickGain.gain.setValueAtTime(0.4, time);
      kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.14);

      kick.connect(kickGain);
      kickGain.connect(this.musicGain);
      kick.start(time);
      kick.stop(time + 0.15);
    }

    // Hi-hat on offbeats
    if (step % 2 === 1 && this.noiseBuffer) {
      const hat = this.ctx.createBufferSource();
      hat.buffer = this.noiseBuffer;
      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(7000, time);

      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime(0.07, time);
      hatGain.gain.exponentialRampToValueAtTime(0.005, time + 0.05);

      hat.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.musicGain);
      hat.start(time);
      hat.stop(time + 0.06);
    }
  }

  stopMusic() {
    this.musicActive = false;
  }
}
