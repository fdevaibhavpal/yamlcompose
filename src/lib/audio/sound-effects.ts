"use client";

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getDestination(): AudioNode | null {
  const ctx = getContext();
  if (!ctx || !masterGain) return null;
  return masterGain;
}

interface Tone {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  /** Glide to this frequency over the tone's duration. */
  slideTo?: number;
  /** Lowpass cutoff; softens harsh square/saw edges. */
  filter?: number;
}

function playTones(tones: Tone[]) {
  const ctx = getContext();
  const dest = getDestination();
  if (!ctx || !dest) return;
  const now = ctx.currentTime;

  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = tone.type ?? "sine";
    osc.frequency.value = tone.freq;

    const peak = tone.gain ?? 0.12;
    const startAt = now + tone.start;
    const endAt = startAt + tone.duration;

    if (tone.slideTo != null) {
      osc.frequency.setValueAtTime(tone.freq, startAt);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, tone.slideTo),
        endAt
      );
    }

    gainNode.gain.setValueAtTime(0, startAt);
    gainNode.gain.linearRampToValueAtTime(peak, startAt + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    let node: AudioNode = osc;
    if (tone.filter != null) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = tone.filter;
      osc.connect(lp);
      node = lp;
    }

    node.connect(gainNode);
    gainNode.connect(dest);

    osc.start(startAt);
    osc.stop(endAt + 0.02);
  }
}

/** Short filtered noise burst — gives clicks a tactile "thock" transient. */
function playNoise(opts: {
  duration: number;
  gain?: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
  start?: number;
}) {
  const ctx = getContext();
  const dest = getDestination();
  if (!ctx || !dest) return;

  const duration = opts.duration;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = opts.filterType ?? "bandpass";
  filter.frequency.value = opts.filterFreq ?? 2200;
  filter.Q.value = 1.2;

  const gainNode = ctx.createGain();
  const startAt = ctx.currentTime + (opts.start ?? 0);
  const peak = opts.gain ?? 0.05;
  gainNode.gain.setValueAtTime(peak, startAt);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  src.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(dest);
  src.start(startAt);
  src.stop(startAt + duration + 0.02);
}

/* ---------------------------------------------------------------- *
 * 1. NAVIGATION — deep, soft "whoosh" for moving between places.
 *    Low sine sweeping upward: reads as travel, not as a button.
 * ---------------------------------------------------------------- */
export function playNavigationSound() {
  playTones([
    { freq: 180, slideTo: 420, start: 0, duration: 0.26, type: "sine", gain: 0.1 },
    { freq: 360, slideTo: 840, start: 0.02, duration: 0.2, type: "sine", gain: 0.035 },
  ]);
  playNoise({ duration: 0.22, gain: 0.018, filterFreq: 900, filterType: "lowpass" });
}

/* ---------------------------------------------------------------- *
 * 2. TABS — "round"/hollow marimba-like pluck. Pure sine with a
 *    soft octave body, no edge. Pitch shifts by tab index so moving
 *    across the tab row sounds like a scale.
 * ---------------------------------------------------------------- */
const TAB_SCALE = [523.25, 587.33, 659.25, 783.99, 880.0];

export function playTabSound(index = 0) {
  const base = TAB_SCALE[index % TAB_SCALE.length];
  playTones([
    { freq: base, start: 0, duration: 0.22, type: "sine", gain: 0.11 },
    { freq: base * 2, start: 0, duration: 0.1, type: "sine", gain: 0.03 },
    { freq: base * 0.5, start: 0, duration: 0.26, type: "sine", gain: 0.04 },
  ]);
}

/* ---------------------------------------------------------------- *
 * 3. UI CLICK — crisp mechanical "thock" for neutral buttons
 *    (copy, clear, close, dropdown open).
 * ---------------------------------------------------------------- */
export function playClickSound() {
  playNoise({ duration: 0.035, gain: 0.05, filterFreq: 2600 });
  playTones([
    { freq: 880, slideTo: 440, start: 0, duration: 0.045, type: "triangle", gain: 0.05, filter: 3000 },
  ]);
}

/* ---------------------------------------------------------------- *
 * 4. SELECT — picking an item from a menu/list. Two-step rising
 *    blip, brighter than a plain click so a choice feels committed.
 * ---------------------------------------------------------------- */
export function playSelectSound() {
  playTones([
    { freq: 640, start: 0, duration: 0.05, type: "triangle", gain: 0.06, filter: 4000 },
    { freq: 960, start: 0.045, duration: 0.09, type: "triangle", gain: 0.06, filter: 4000 },
  ]);
}

/* ---------------------------------------------------------------- *
 * 5. TOGGLE — square-wave detent, up for on / down for off.
 * ---------------------------------------------------------------- */
export function playToggleOnSound() {
  playNoise({ duration: 0.02, gain: 0.025, filterFreq: 3000 });
  playTones([
    { freq: 520, slideTo: 780, start: 0, duration: 0.07, type: "square", gain: 0.045, filter: 2600 },
  ]);
}

export function playToggleOffSound() {
  playNoise({ duration: 0.02, gain: 0.025, filterFreq: 1800 });
  playTones([
    { freq: 520, slideTo: 320, start: 0, duration: 0.07, type: "square", gain: 0.045, filter: 2000 },
  ]);
}

/* ---------------------------------------------------------------- *
 * 6. VISUALIZE — the data-visualization action. Bright major
 *    arpeggio that resolves upward: "your diagram is ready".
 * ---------------------------------------------------------------- */
export function playVisualizeSound() {
  playTones([
    { freq: 523.25, start: 0, duration: 0.11, type: "sine", gain: 0.1 },
    { freq: 659.25, start: 0.07, duration: 0.11, type: "sine", gain: 0.1 },
    { freq: 783.99, start: 0.14, duration: 0.2, type: "sine", gain: 0.1 },
    { freq: 1046.5, start: 0.21, duration: 0.3, type: "sine", gain: 0.07 },
  ]);
}

/* ---------------------------------------------------------------- *
 * 7. NODE TAP — light tick when a graph node is selected.
 * ---------------------------------------------------------------- */
export function playNodeSound() {
  playTones([
    { freq: 1180, start: 0, duration: 0.05, type: "sine", gain: 0.055 },
    { freq: 1760, start: 0.01, duration: 0.03, type: "sine", gain: 0.02 },
  ]);
}

/* ---------------------------------------------------------------- *
 * 8. LAUNCH — rocket ignition. Rising triangle fifth + a swelling
 *    noise bed, matched to the launch overlay's first moment.
 * ---------------------------------------------------------------- */
export function playLaunchSound() {
  playTones([
    { freq: 196, slideTo: 392, start: 0, duration: 0.5, type: "triangle", gain: 0.08 },
    { freq: 392, start: 0.12, duration: 0.14, type: "triangle", gain: 0.07 },
    { freq: 523.25, start: 0.24, duration: 0.14, type: "triangle", gain: 0.07 },
    { freq: 783.99, start: 0.36, duration: 0.32, type: "triangle", gain: 0.08 },
  ]);
  playNoise({ duration: 0.5, gain: 0.03, filterFreq: 700, filterType: "lowpass" });
}

/* ---------------------------------------------------------------- *
 * 9. ERROR — dull descending minor second.
 * ---------------------------------------------------------------- */
export function playErrorSound() {
  playTones([
    { freq: 233.08, start: 0, duration: 0.13, type: "sawtooth", gain: 0.05, filter: 900 },
    { freq: 174.61, start: 0.11, duration: 0.22, type: "sawtooth", gain: 0.05, filter: 700 },
  ]);
}

/* ---------------------------------------------------------------- *
 * 10. SUCCESS — warm resolved third, for completion moments.
 * ---------------------------------------------------------------- */
export function playSuccessSound() {
  playTones([
    { freq: 659.25, start: 0, duration: 0.12, type: "sine", gain: 0.09 },
    { freq: 987.77, start: 0.09, duration: 0.26, type: "sine", gain: 0.08 },
  ]);
}

/* ---------------------------------------------------------------- *
 * LOADING LOOP — a continuous bed for the launch overlay: a low
 * pulsing drone that rises in pitch with progress, plus a tick on
 * each pipeline step. Returns a stop() handle.
 * ---------------------------------------------------------------- */
export interface LoadingLoop {
  setProgress: (pct: number) => void;
  tick: () => void;
  stop: () => void;
}

export function startLoadingLoop(): LoadingLoop {
  const ctx = getContext();
  const dest = getDestination();
  if (!ctx || !dest) {
    return { setProgress: () => {}, tick: () => {}, stop: () => {} };
  }

  const now = ctx.currentTime;

  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0, now);
  bus.gain.linearRampToValueAtTime(1, now + 0.4);
  bus.connect(dest);

  // Low drone — the "engine" that climbs as progress advances.
  const drone = ctx.createOscillator();
  drone.type = "sawtooth";
  drone.frequency.setValueAtTime(110, now);

  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.setValueAtTime(420, now);
  droneFilter.Q.value = 6;

  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.035;

  drone.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(bus);
  drone.start(now);

  // Shimmer — a soft sine a fifth above, keeps the bed from feeling dead.
  const shimmer = ctx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(330, now);
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.012;
  shimmer.connect(shimmerGain);
  shimmerGain.connect(bus);
  shimmer.start(now);

  // Tremolo on the whole bed — the pulsing "working" feel.
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 5.2;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.5;
  const trem = ctx.createGain();
  trem.gain.value = 0.5;
  lfo.connect(lfoDepth);
  lfoDepth.connect(trem.gain);
  droneGain.disconnect();
  droneGain.connect(trem);
  trem.connect(bus);
  lfo.start(now);

  let stopped = false;

  return {
    setProgress(pct: number) {
      if (stopped || !audioCtx) return;
      const t = audioCtx.currentTime;
      const ratio = Math.min(1, Math.max(0, pct / 100));
      drone.frequency.linearRampToValueAtTime(110 + ratio * 90, t + 0.15);
      shimmer.frequency.linearRampToValueAtTime(330 + ratio * 270, t + 0.15);
      droneFilter.frequency.linearRampToValueAtTime(420 + ratio * 1400, t + 0.15);
      lfo.frequency.linearRampToValueAtTime(5.2 + ratio * 4, t + 0.15);
    },
    tick() {
      if (stopped) return;
      playTones([
        { freq: 1320, start: 0, duration: 0.04, type: "sine", gain: 0.04 },
        { freq: 1980, start: 0.008, duration: 0.03, type: "sine", gain: 0.016 },
      ]);
    },
    stop() {
      if (stopped || !audioCtx) return;
      stopped = true;
      const t = audioCtx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      drone.stop(t + 0.35);
      shimmer.stop(t + 0.35);
      lfo.stop(t + 0.35);
    },
  };
}

/* ---------------------------------------------------------------- *
 * DEMO VOICES — one distinct timbre per hero-animation phase, so each
 * slide announces itself. Kept quiet; the hero loops continuously.
 * ---------------------------------------------------------------- */

/** Paste — typewriter key tap, fired per line as YAML types in. */
export function playTypeTickSound() {
  playNoise({ duration: 0.018, gain: 0.012, filterFreq: 3200 });
  playTones([
    { freq: 1500, slideTo: 1100, start: 0, duration: 0.022, type: "square", gain: 0.012, filter: 3800 },
  ]);
}

/** Layout — soft woodblock as each node lands on the canvas. */
export function playNodeDropSound(index = 0) {
  const base = 420 + index * 42;
  playTones([
    { freq: base, start: 0, duration: 0.09, type: "sine", gain: 0.035 },
    { freq: base * 2, start: 0, duration: 0.045, type: "sine", gain: 0.012 },
  ]);
}

/** Dependencies — low sonar ping that sweeps, like tracing a wire. */
export function playTraceSound() {
  playTones([
    { freq: 300, slideTo: 620, start: 0, duration: 0.3, type: "sine", gain: 0.05 },
    { freq: 150, start: 0, duration: 0.34, type: "sine", gain: 0.022 },
  ]);
}

/** Inspect — glassy two-note "card opens" chime. */
export function playInspectSound() {
  playTones([
    { freq: 880, start: 0, duration: 0.1, type: "sine", gain: 0.045 },
    { freq: 1318.5, start: 0.06, duration: 0.22, type: "sine", gain: 0.04 },
    { freq: 1760, start: 0.06, duration: 0.22, type: "sine", gain: 0.014 },
  ]);
}

/** Search — airy filtered sweep, like a query running. */
export function playSearchSound() {
  playNoise({ duration: 0.26, gain: 0.02, filterFreq: 2600, filterType: "bandpass" });
  playTones([
    { freq: 700, slideTo: 1500, start: 0, duration: 0.22, type: "triangle", gain: 0.03, filter: 3200 },
  ]);
}

/** Tables — paper-shuffle riffle as rows cascade in. */
export function playTableSound() {
  playNoise({ duration: 0.09, gain: 0.022, filterFreq: 1700, filterType: "bandpass" });
  playTones([
    { freq: 480, start: 0, duration: 0.07, type: "triangle", gain: 0.028, filter: 2200 },
    { freq: 640, start: 0.05, duration: 0.1, type: "triangle", gain: 0.026, filter: 2400 },
  ]);
}

/** Slide change — short airy whoosh under every hero phase transition. */
export function playSlideTransitionSound() {
  playNoise({ duration: 0.2, gain: 0.016, filterFreq: 1300, filterType: "lowpass" });
  playTones([
    { freq: 240, slideTo: 520, start: 0, duration: 0.18, type: "sine", gain: 0.022 },
  ]);
}

/** Modal opens — soft rising swell. */
export function playModalOpenSound() {
  playTones([
    { freq: 330, slideTo: 560, start: 0, duration: 0.16, type: "triangle", gain: 0.05, filter: 2400 },
    { freq: 660, start: 0.08, duration: 0.14, type: "sine", gain: 0.025 },
  ]);
}

/** Modal closes — the same gesture, falling. */
export function playModalCloseSound() {
  playTones([
    { freq: 520, slideTo: 300, start: 0, duration: 0.15, type: "triangle", gain: 0.045, filter: 2000 },
  ]);
}

/** Destructive confirm — heavy descending thud. */
export function playDeleteSound() {
  playNoise({ duration: 0.12, gain: 0.035, filterFreq: 600, filterType: "lowpass" });
  playTones([
    { freq: 190, slideTo: 90, start: 0, duration: 0.26, type: "sawtooth", gain: 0.055, filter: 700 },
  ]);
}

/** Rising chime when the loading bar completes and the app hands off. */
export function playLoadCompleteSound() {
  playTones([
    { freq: 523.25, start: 0, duration: 0.09, type: "sine", gain: 0.08 },
    { freq: 783.99, start: 0.07, duration: 0.09, type: "sine", gain: 0.08 },
    { freq: 1046.5, start: 0.14, duration: 0.4, type: "sine", gain: 0.09 },
    { freq: 1567.98, start: 0.14, duration: 0.4, type: "sine", gain: 0.03 },
  ]);
}
