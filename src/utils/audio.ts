// Web Audio API Sound Synthesizer & Relaxing Ambient Background for AlphaBlast

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let bgMusicRunning = false;
let bgMusicMasterGain: GainNode | null = null;
let bgMusicInterval: ReturnType<typeof setInterval> | null = null;
let bgChimeInterval: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ----------------------------------------------------
// LIVELY & RELAXING BACKGROUND MUSIC SYNTHESIZER
// Upbeat, warm Neo-Soul / Island Kalimba groove with gentle rhythm
// ----------------------------------------------------

// Upbeat & relaxing chord progressions (Rhodes & warm acoustic harmonies)
const PROGRESSION = [
  {
    name: 'Cmaj9',
    bass: 65.41, // C2
    chord: [130.81, 196.00, 246.94, 329.63, 392.00], // C3, G3, B3, E4, G4
    melody: [523.25, 659.25, 587.33, 783.99], // C5, E5, D5, G5
  },
  {
    name: 'Am9',
    bass: 55.00, // A1
    chord: [110.00, 164.81, 196.00, 261.63, 329.63], // A2, E3, G3, C4, E4
    melody: [659.25, 587.33, 523.25, 440.00], // E5, D5, C5, A4
  },
  {
    name: 'Dm9',
    bass: 73.42, // D2
    chord: [146.83, 220.00, 261.63, 329.63, 349.23], // D3, A3, C4, E4, F4
    melody: [587.33, 698.46, 659.25, 523.25], // D5, F5, E5, C5
  },
  {
    name: 'G13sus',
    bass: 49.00, // G1
    chord: [98.00, 146.83, 220.00, 261.63, 329.63], // G2, D3, A3, C4, E4
    melody: [783.99, 659.25, 587.33, 493.88], // G5, E5, D5, B4
  },
  {
    name: 'Fmaj9',
    bass: 43.65, // F1
    chord: [174.61, 220.00, 261.63, 329.63, 392.00], // F3, A3, C4, E4, G4
    melody: [698.46, 783.99, 659.25, 523.25], // F5, G5, E5, C5
  },
  {
    name: 'Em7',
    bass: 41.20, // E1
    chord: [164.81, 246.94, 293.66, 329.63, 392.00], // E3, B3, D4, E4, G4
    melody: [659.25, 783.99, 880.00, 659.25], // E5, G5, A5, E5
  },
];

// Master background ambient volume level (clearly audible, lively, bright and relaxing)
const BG_VOLUME = 0.22;

let currentChordStep = 0;
let barBeat = 0;

// Play a warm, bouncy electric piano / Rhodes chord stab
function playRhodesStab(freqs: number[], duration = 1.6, intensity = 1.0): void {
  if (!soundEnabled || !bgMusicRunning) return;
  const ctx = getAudioContext();
  if (!ctx || !bgMusicMasterGain) return;

  const now = ctx.currentTime;

  freqs.forEach((freq, idx) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Blend sine and triangle for warm electric piano tone
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

      // Warm lowpass filter with subtle envelope decay
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(700, now + duration);

      const baseVol = (idx === 0 ? 0.05 : 0.038) * intensity;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(baseVol, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(baseVol * 0.4, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bgMusicMasterGain);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {
      // Audio node scheduling fallback
    }
  });
}

// Play a bouncy, lively marimba / kalimba note
function playMarimbaPluck(freq: number, velocity = 0.06): void {
  if (!soundEnabled || !bgMusicRunning) return;
  const ctx = getAudioContext();
  if (!ctx || !bgMusicMasterGain) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Fast decay woodblock / marimba envelope
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, now);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(velocity, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(bgMusicMasterGain);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // Audio node scheduling fallback
  }
}

// Play a gentle rounded acoustic bass pluck
function playBassNote(freq: number, duration = 0.8): void {
  if (!soundEnabled || !bgMusicRunning) return;
  const ctx = getAudioContext();
  if (!ctx || !bgMusicMasterGain) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(bgMusicMasterGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch {
    // Audio node scheduling fallback
  }
}

// Play subtle lively rhythmic brush / shaker tap
function playGentleShaker(accent = false): void {
  if (!soundEnabled || !bgMusicRunning) return;
  const ctx = getAudioContext();
  if (!ctx || !bgMusicMasterGain) return;

  try {
    const now = ctx.currentTime;
    // Fast noise burst for shaker texture
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, now);

    const gain = ctx.createGain();
    const vol = accent ? 0.018 : 0.009;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(bgMusicMasterGain);

    noise.start(now);
    noise.stop(now + 0.05);
  } catch {
    // Audio node scheduling fallback
  }
}

// Main rhythmic tick function (runs on 8th notes at ~104 BPM, interval 288ms)
function advanceMusicTick(): void {
  if (!soundEnabled || !bgMusicRunning) return;

  const currentPattern = PROGRESSION[currentChordStep % PROGRESSION.length];

  // Beat 0: Downbeat (Bass + Warm Rhodes Chord + Shaker)
  if (barBeat === 0) {
    playBassNote(currentPattern.bass, 1.2);
    playRhodesStab(currentPattern.chord, 1.8, 1.0);
    playGentleShaker(true);
    playMarimbaPluck(currentPattern.melody[0], 0.06);
  }
  // Beat 1: Light off-beat shaker
  else if (barBeat === 1) {
    playGentleShaker(false);
  }
  // Beat 2: Syncopated Rhodes stab + melody note
  else if (barBeat === 2) {
    playGentleShaker(true);
    playMarimbaPluck(currentPattern.melody[1], 0.05);
  }
  // Beat 3: Syncopated chord pulse
  else if (barBeat === 3) {
    playRhodesStab(currentPattern.chord, 1.0, 0.7);
    playGentleShaker(false);
  }
  // Beat 4: Bass walk / second melody note
  else if (barBeat === 4) {
    playBassNote(currentPattern.bass * 1.5, 0.6);
    playMarimbaPluck(currentPattern.melody[2], 0.055);
    playGentleShaker(true);
  }
  // Beat 5: Light shaker
  else if (barBeat === 5) {
    playGentleShaker(false);
  }
  // Beat 6: Playful marimba melodic turnaround
  else if (barBeat === 6) {
    playRhodesStab(currentPattern.chord, 0.9, 0.65);
    playMarimbaPluck(currentPattern.melody[3], 0.06);
    playGentleShaker(true);
  }
  // Beat 7: Pickup to next chord
  else if (barBeat === 7) {
    playGentleShaker(false);
  }

  barBeat = (barBeat + 1) % 8;
  if (barBeat === 0) {
    currentChordStep = (currentChordStep + 1) % PROGRESSION.length;
  }
}

export function startBackgroundMusic(): void {
  if (bgMusicRunning) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  // Create master background gain node set to clearly audible pleasant volume
  if (!bgMusicMasterGain) {
    bgMusicMasterGain = ctx.createGain();
    bgMusicMasterGain.gain.setValueAtTime(soundEnabled ? BG_VOLUME : 0.0001, ctx.currentTime);
    bgMusicMasterGain.connect(ctx.destination);
  } else {
    bgMusicMasterGain.gain.setValueAtTime(soundEnabled ? BG_VOLUME : 0.0001, ctx.currentTime);
  }

  bgMusicRunning = true;

  // Advance first beat immediately
  advanceMusicTick();

  // Run lively 8th-note groove loop at ~104 BPM (288ms per 8th note)
  if (bgMusicInterval) clearInterval(bgMusicInterval);
  bgMusicInterval = setInterval(() => {
    advanceMusicTick();
  }, 288);
}

export function stopBackgroundMusic(): void {
  bgMusicRunning = false;
  barBeat = 0;
  if (bgMusicInterval) {
    clearInterval(bgMusicInterval);
    bgMusicInterval = null;
  }
  if (bgChimeInterval) {
    clearInterval(bgChimeInterval);
    bgChimeInterval = null;
  }
  if (bgMusicMasterGain && audioCtx) {
    bgMusicMasterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  }
}

// Auto-start listener on first user interaction for browser autoplay policy compliance
if (typeof window !== 'undefined') {
  const handleFirstInteraction = () => {
    if (soundEnabled) {
      startBackgroundMusic();
    }
    window.removeEventListener('click', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
    window.removeEventListener('touchstart', handleFirstInteraction);
  };
  window.addEventListener('click', handleFirstInteraction, { passive: true });
  window.addEventListener('keydown', handleFirstInteraction, { passive: true });
  window.addEventListener('touchstart', handleFirstInteraction, { passive: true });

  // Handle page visibility
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (bgMusicMasterGain && audioCtx) {
        bgMusicMasterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      }
    } else {
      if (soundEnabled && bgMusicMasterGain && audioCtx) {
        bgMusicMasterGain.gain.setValueAtTime(BG_VOLUME, audioCtx.currentTime);
      }
    }
  });
}

export function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  if (bgMusicMasterGain && audioCtx) {
    bgMusicMasterGain.gain.setValueAtTime(soundEnabled ? BG_VOLUME : 0.0001, audioCtx.currentTime);
  }
  if (soundEnabled) {
    if (!bgMusicRunning) {
      startBackgroundMusic();
    }
  } else {
    // Muted
  }
  return soundEnabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function playTileSelect(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Crisp, uplifting pop tone
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

export function playLetterPop(index: number = 0, total: number = 5): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Musical pentatonic ascending pops: C5, D5, E5, G5, A5, C6...
  const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5];
  const freq = scale[index % scale.length] || 523.25;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 0.8, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.05);
  osc.frequency.exponentialRampToValueAtTime(freq, now + 0.12);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
}

export function playSwap(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

export function playWordFound(isCategory: boolean, length: number): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const baseFreq = isCategory ? 523.25 : 440; // C5 or A4
  const notes = isCategory
    ? [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2] // Major arpeggio
    : [baseFreq, baseFreq * 1.189, baseFreq * 1.498]; // Triad

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteStart = now + idx * 0.07;

    osc.type = isCategory ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    const volume = Math.min(0.2, 0.08 + length * 0.02);
    gain.gain.setValueAtTime(volume, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + 0.25);
  });
}

export function playBomb(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.45);
}

export function playSpecialCard(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  [600, 800, 1000, 1200, 1400].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const time = now + i * 0.04;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.2, time + 0.1);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.15);
  });
}

export function playBeam(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(1100, now + 0.25);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.32);
}

export function playShining(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Golden sub-bass chime
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(220, now);
  subOsc.frequency.exponentialRampToValueAtTime(440, now + 0.35);
  subGain.gain.setValueAtTime(0.2, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  subOsc.connect(subGain);
  subGain.connect(ctx.destination);
  subOsc.start(now);
  subOsc.stop(now + 0.42);

  // Sparkling celestial arpeggio
  [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093.0].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + idx * 0.04;

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.25);

    gain.gain.setValueAtTime(0.14, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
}

export function playBoardClear(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
  chord.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + i * 0.04;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, startTime);

    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.45);
  });
}

export function playPowerUp(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.exponentialRampToValueAtTime(850, now + 0.15);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.22);
}

export function playWin(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const time = now + i * 0.1;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, time);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.4);
  });
}

export function playRewardRefill(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  [440, 554.37, 659.25, 880].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const time = now + i * 0.08;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.3);
  });
}

/**
 * Continuous high-voltage electric surge when electricity flows across the board
 */
export function playElectricSurge(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. High-frequency crackling oscillator
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(240, now);
  osc1.frequency.linearRampToValueAtTime(860, now + 0.28);
  osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.55);

  gain1.gain.setValueAtTime(0.14, now);
  gain1.gain.linearRampToValueAtTime(0.22, now + 0.2);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  // Bandpass filter to simulate electrical arc resonance
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.Q.setValueAtTime(4.5, now);

  osc1.connect(filter);
  filter.connect(gain1);
  gain1.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.62);

  // 2. White noise burst for spark crackle
  try {
    const bufferSize = ctx.sampleRate * 0.4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(2500, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.4);
  } catch {
    // Fallback if audio buffer fails
  }
}

/**
 * Sharp electric zap when electricity contacts a letter tile
 */
export function playElectricZap(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1600, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.16);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.19);
}

/**
 * Powerful electric knock-off sound when a tile is blasted/knocked off by electricity
 */
export function playElectricKnockoff(index: number = 0, total: number = 5): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Knock impulse tone (descending pitch zap)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const baseFreq = 950 + (index % 5) * 120;
  osc.type = 'square';
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.frequency.exponentialRampToValueAtTime(400, now + 0.22);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}

/**
 * Rapid cascading wooden/crystal tile roll sound when tiles roll in upon pressing GO!
 */
export function playBoardRoll(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const arpeggio = [392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51];

  arpeggio.forEach((freq, idx) => {
    const noteTime = now + idx * 0.045;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 0.9, noteTime);
    osc.frequency.exponentialRampToValueAtTime(freq, noteTime + 0.02);

    gain.gain.setValueAtTime(0.18, noteTime);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.14);
  });
}

/**
 * Fiery inferno sound for full board wipeout (roaring flame blast + crackling embers)
 */
export function playFireInferno(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Low roaring flame explosion (Noise + lowpass sweeping)
  try {
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.35));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.7);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.8);
  } catch {
    // Fallback if buffer creation fails
  }

  // 2. Rising harmonic fire chord
  const fireHarmonics = [130.81, 196.0, 261.63, 392.0, 523.25, 659.25, 783.99];
  fireHarmonics.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + i * 0.035;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f * 0.8, startTime);
    osc.frequency.exponentialRampToValueAtTime(f * 1.5, startTime + 0.25);

    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(f * 1.2, startTime);

    osc.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
}

/**
 * Rapid crackling fire sizzle when a tile letter catches fire and burns
 */
export function playFireSizzle(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(550 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + Math.random() * 600, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch {}
}

/**
 * Heavy metallic stone impact smash for Hammer powerup
 */
export function playHammerSmash(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Deep sub bass impact thump
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(160, now);
  sub.frequency.exponentialRampToValueAtTime(35, now + 0.35);

  subGain.gain.setValueAtTime(0.4, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

  sub.connect(subGain);
  subGain.connect(ctx.destination);
  sub.start(now);
  sub.stop(now + 0.4);

  // 2. Metallic stone crack chime
  const tones = [440, 659, 880, 1174];
  tones.forEach((t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(t, now);
    osc.frequency.exponentialRampToValueAtTime(t * 0.6, now + 0.2);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  });
}

