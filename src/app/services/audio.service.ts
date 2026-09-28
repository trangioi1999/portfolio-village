import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { WorldStateService } from './world-state.service';

export type Sfx =
  | 'click'
  | 'hover'
  | 'open'
  | 'close'
  | 'spirit'
  | 'greet'
  | 'success'
  | 'error'
  | 'toggle'
  | 'sparkle';

/** C-major pentatonic (Hz) — every combination sounds pleasant, perfect for generative music. */
const MELODY = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
/** Soft chord pads: C · Am · F · G (C major I–vi–IV–V). */
const CHORDS = [
  [130.81, 196.0, 329.63],
  [110.0, 164.81, 261.63],
  [87.31, 174.61, 220.0],
  [98.0, 146.83, 246.94],
];
const BEAT = 60 / 76; // 76 BPM

/**
 * Procedural sound for the village, generated with the Web Audio API — zero audio files.
 *
 * - Music: gentle koto / music-box melody over warm pads, with reverb.
 * - Ambience: wind, birds, and running water that gets louder near the waterfall.
 * - Effects: clicks, hovers, panel open/close, companions, footsteps, form feedback.
 *
 * Sound is off until the visitor opts in (browsers also require a user gesture).
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly state = inject(WorldStateService);

  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private ambience!: GainNode;
  private effects!: GainNode;
  private reverb!: ConvolverNode;
  private water!: GainNode;
  private noise!: AudioBuffer;
  private birdTimer: ReturnType<typeof setTimeout> | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private stepTimer: ReturnType<typeof setInterval> | null = null;
  private nextNote = 0;
  private step = 0;
  private melodyIndex = 4;
  private lastHover: Element | null = null;
  private lastHoverAt = 0;
  private waterLevel = 0;

  constructor() {
    effect(() => (this.state.soundEnabled() ? this.start() : this.stop()));
    effect(() => this.applyMix());

    // UI feedback for every button/link, without touching each component.
    const onClick = (e: Event) => {
      const el = (e.target as Element | null)?.closest?.('button, a, summary, [role="tab"]');
      if (el && !el.hasAttribute('data-silent')) this.play('click');
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const el = (e.target as Element | null)?.closest?.('button, a, summary');
      const now = performance.now();
      if (!el || el === this.lastHover || now - this.lastHoverAt < 70) return;
      this.lastHover = el;
      this.lastHoverAt = now;
      this.play('hover');
    };
    // Browsers only allow audio after a gesture: resume on the first one.
    const unlock = () => {
      if (this.state.soundEnabled()) this.start();
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('pointerover', onOver as EventListener, true);
    document.addEventListener('pointerdown', unlock, { once: true, capture: true });
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointerover', onOver as EventListener, true);
      this.stop();
      void this.ctx?.close();
    });
  }

  toggle(): void {
    this.state.soundEnabled.update((v) => !v);
  }

  /** Called when the visitor enters (or leaves) a building. */
  enterBuilding(isPlaza: boolean): void {
    this.play(isPlaza ? 'close' : 'open');
  }

  /** 0 = far from water, 1 = right next to the waterfall. */
  setWaterProximity(value: number): void {
    if (!this.ctx || Math.abs(value - this.waterLevel) < 0.03) return;
    this.waterLevel = value;
    this.water.gain.setTargetAtTime(0.04 + value * 0.32, this.ctx.currentTime, 0.6);
  }

  setWalking(walking: boolean): void {
    if (walking && !this.stepTimer) {
      this.stepTimer = setInterval(() => this.footstep(), 290);
    } else if (!walking && this.stepTimer) {
      clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
  }

  play(name: Sfx, pitch = 1): void {
    const ctx = this.ctx;
    if (
      !ctx ||
      ctx.state !== 'running' ||
      !this.state.soundEnabled() ||
      !this.state.soundMix().effects
    )
      return;
    const t = ctx.currentTime;
    switch (name) {
      case 'hover':
        this.tone(1320, t, 0.05, 0.035, 'sine');
        break;
      case 'click':
        this.tone(620, t, 0.09, 0.16, 'triangle', 380);
        this.burst(t, 0.03, 0.05, 2400);
        break;
      case 'toggle':
        this.tone(880, t, 0.08, 0.12, 'sine');
        this.tone(1320, t + 0.06, 0.1, 0.1, 'sine');
        break;
      case 'open':
        this.sweep(t, 300, 2200, 0.45, 0.12);
        [0, 2, 4].forEach((n, i) =>
          this.pluck(MELODY[n + 3], t + 0.12 + i * 0.09, 0.16, this.effects),
        );
        break;
      case 'close':
        this.sweep(t, 1800, 300, 0.35, 0.08);
        [4, 2].forEach((n, i) => this.pluck(MELODY[n + 1], t + 0.08 + i * 0.1, 0.12, this.effects));
        break;
      case 'spirit':
        this.tone(900 * pitch, t, 0.12, 0.12, 'sine', 1500 * pitch);
        this.tone(1300 * pitch, t + 0.12, 0.14, 0.1, 'sine', 1800 * pitch);
        break;
      case 'greet':
        [0, 2, 4, 7].forEach((n, i) => this.pluck(MELODY[n], t + i * 0.1, 0.2, this.effects));
        break;
      case 'success':
        [0, 2, 4, 5, 7].forEach((n, i) =>
          this.pluck(MELODY[n + 2], t + i * 0.08, 0.18, this.effects),
        );
        break;
      case 'error':
        this.tone(330, t, 0.16, 0.12, 'triangle');
        this.tone(247, t + 0.14, 0.22, 0.12, 'triangle');
        break;
      case 'sparkle':
        for (let i = 0; i < 5; i++)
          this.tone(1800 + Math.random() * 1600, t + i * 0.04, 0.12, 0.04, 'sine');
        break;
    }
  }

  /* ------------------------------------------------------------------ */

  private start(): void {
    try {
      if (!this.ctx) this.build();
      const ctx = this.ctx!;
      void ctx.resume().then(() => {
        this.master.gain.setTargetAtTime(this.state.soundMix().volume, ctx.currentTime, 0.5);
        this.scheduleBird();
        if (!this.musicTimer) {
          this.nextNote = ctx.currentTime + 0.3;
          this.musicTimer = setInterval(() => this.scheduleMusic(), 60);
        }
      });
    } catch {
      this.state.soundEnabled.set(false);
    }
  }

  private stop(): void {
    if (this.birdTimer) clearTimeout(this.birdTimer);
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.setWalking(false);
    this.birdTimer = null;
    this.musicTimer = null;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    setTimeout(() => {
      if (!this.state.soundEnabled()) void this.ctx?.suspend();
    }, 900);
  }

  private applyMix(): void {
    const mix = this.state.soundMix();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(mix.music ? 0.55 : 0, t, 0.3);
    this.ambience.gain.setTargetAtTime(mix.ambience ? 1 : 0, t, 0.3);
    this.effects.gain.setTargetAtTime(mix.effects ? 0.9 : 0, t, 0.1);
    if (this.state.soundEnabled()) this.master.gain.setTargetAtTime(mix.volume, t, 0.2);
  }

  private build(): void {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    this.master.connect(limiter).connect(ctx.destination);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(2.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    this.reverb.connect(wet).connect(this.master);

    this.music = ctx.createGain();
    this.ambience = ctx.createGain();
    this.effects = ctx.createGain();
    for (const bus of [this.music, this.ambience, this.effects]) bus.connect(this.master);
    this.music.connect(this.reverb);
    this.effects.connect(this.reverb);

    // Shared noise buffer (white).
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const white = this.noise.getChannelData(0);
    for (let i = 0; i < white.length; i++) white[i] = Math.random() * 2 - 1;

    // Wind: brown noise, low-passed, slowly breathing.
    const brown = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const b = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < b.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      b[i] = last * 3.2;
    }
    const wind = this.loop(brown);
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 480;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.18;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain).connect(windGain.gain);
    lfo.start();
    wind.connect(windFilter).connect(windGain).connect(this.ambience);

    // Water: band-passed white noise (volume follows the camera).
    const water = this.loop(this.noise);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1100;
    band.Q.value = 0.6;
    const soft = ctx.createBiquadFilter();
    soft.type = 'lowpass';
    soft.frequency.value = 3200;
    this.water = ctx.createGain();
    this.water.gain.value = 0.05;
    water.connect(band).connect(soft).connect(this.water).connect(this.ambience);

    this.applyMix();
  }

  private loop(buffer: AudioBuffer): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.start();
    return src;
  }

  private impulse(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }

  /** Plucked string: koto / music-box flavour. */
  private pluck(freq: number, at: number, gain: number, bus: AudioNode, decay = 1.4): void {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain, at + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0008, at + decay);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4200, at);
    filter.frequency.exponentialRampToValueAtTime(900, at + decay * 0.6);
    for (const [type, mult, level] of [
      ['triangle', 1, 1],
      ['sine', 2, 0.35],
      ['sine', 3.01, 0.12],
    ] as const) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq * mult;
      g.gain.value = level;
      osc.connect(g).connect(filter);
      osc.start(at);
      osc.stop(at + decay + 0.05);
    }
    filter.connect(env).connect(bus);
  }

  private pad(freqs: number[], at: number, dur: number): void {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.05, at + 1.2);
    env.gain.setValueAtTime(0.05, at + dur - 1);
    env.gain.linearRampToValueAtTime(0, at + dur + 0.6);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    for (const f of freqs) {
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        osc.detune.value = detune;
        osc.connect(filter);
        osc.start(at);
        osc.stop(at + dur + 0.7);
      }
    }
    filter.connect(env).connect(this.music);
  }

  private tone(
    freq: number,
    at: number,
    dur: number,
    gain: number,
    type: OscillatorType,
    toFreq?: number,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, at + dur);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain, at + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    osc.connect(env).connect(this.effects);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private burst(
    at: number,
    dur: number,
    gain: number,
    freq: number,
    bus: AudioNode = this.effects,
  ): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, at);
    env.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    src.connect(filter).connect(env).connect(bus);
    src.start(at, Math.random());
    src.stop(at + dur + 0.02);
  }

  private sweep(at: number, from: number, to: number, dur: number, gain: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(from, at);
    filter.frequency.exponentialRampToValueAtTime(to, at + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain, at + dur * 0.4);
    env.gain.linearRampToValueAtTime(0, at + dur);
    src.connect(filter).connect(env).connect(this.effects);
    src.start(at, Math.random());
    src.stop(at + dur + 0.05);
  }

  private footstep(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.state.soundMix().effects) return;
    this.burst(ctx.currentTime, 0.07, 0.07, 500 + Math.random() * 300, this.ambience);
  }

  /** Look-ahead scheduler for the generative music. */
  private scheduleMusic(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextNote < ctx.currentTime + 0.25) {
      const at = this.nextNote;
      const beatInBar = this.step % 8; // eighth notes, 4/4
      const bar = Math.floor(this.step / 8);
      if (beatInBar === 0) {
        const chord = CHORDS[bar % CHORDS.length];
        this.pad(chord, at, BEAT * 4);
        this.pluck(chord[0], at, 0.12, this.music, 2.2);
      }
      // Melody: gentle random walk with rests; phrases breathe every 4 bars.
      const phraseRest = bar % 4 === 3 && beatInBar > 3;
      if (!phraseRest && Math.random() < (beatInBar % 2 === 0 ? 0.62 : 0.28)) {
        this.melodyIndex = Math.max(
          0,
          Math.min(
            MELODY.length - 1,
            this.melodyIndex + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)],
          ),
        );
        this.pluck(MELODY[this.melodyIndex], at, 0.085, this.music, 1.6);
      }
      this.nextNote += BEAT / 2;
      this.step++;
    }
  }

  private scheduleBird(): void {
    if (this.birdTimer) clearTimeout(this.birdTimer);
    this.birdTimer = setTimeout(
      () => {
        if (!this.state.soundEnabled()) return;
        this.bird();
        this.scheduleBird();
      },
      3500 + Math.random() * 6500,
    );
  }

  private bird(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 4);
    const base = 2300 + Math.random() * 1100;
    for (let i = 0; i < notes; i++) {
      const start = t + i * (0.1 + Math.random() * 0.08);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, start);
      osc.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.3), start + 0.07);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.03, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0005, start + 0.1);
      osc.connect(g).connect(this.ambience);
      osc.start(start);
      osc.stop(start + 0.12);
    }
  }
}
