/**
 * Sound System
 *
 * Procedural sound effects using Web Audio API.
 * No external audio files needed - all sounds generated in real-time.
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize or get the audio context
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Resume audio context (required after user interaction)
 */
export function resumeAudio(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

/**
 * Play a "Ton!" tap sound - short percussive hit
 */
export function playTapSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Main hit oscillator
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);

  // Click layer
  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();

  click.type = 'sine';
  click.frequency.setValueAtTime(800, now);
  click.frequency.exponentialRampToValueAtTime(400, now + 0.02);

  clickGain.gain.setValueAtTime(0.2, now);
  clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

  click.connect(clickGain);
  clickGain.connect(ctx.destination);

  click.start(now);
  click.stop(now + 0.05);
}

/**
 * Play collision impact sound - deep thump with resonance
 */
export function playCollisionSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Deep impact
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);

  // Noise burst for texture
  const bufferSize = ctx.sampleRate * 0.1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
  }

  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  noise.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = 500;

  noiseGain.gain.setValueAtTime(0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(now);
}

/**
 * Play victory fanfare - triumphant ascending melody
 */
export function playVictorySound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    const startTime = now + i * 0.12;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
}

/**
 * Play defeat sound - descending somber tone
 */
export function playDefeatSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.7);
}

/**
 * Play game start "Hakkeyoi!" sound
 */
export function playStartSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Drum hit
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);

  // Second beat
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(250, now + 0.15);
  osc2.frequency.exponentialRampToValueAtTime(100, now + 0.25);

  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(0.5, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc2.start(now + 0.15);
  osc2.stop(now + 0.4);
}

/**
 * Play near-fall warning sound
 */
export function playDangerSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(440, now);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.setValueAtTime(0, now + 0.05);
  gain.gain.setValueAtTime(0.15, now + 0.1);
  gain.gain.setValueAtTime(0, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}
