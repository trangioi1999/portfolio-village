import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter } from 'rxjs';
import { BUILDING_MAP } from '../data/buildings.data';
import { BuildingId } from '../models/building.model';

export type WorldStatus = 'loading' | 'ready' | 'unsupported' | 'error';
export type ViewMode = 'world' | 'classic';
export type MotionPreference = 'system' | 'reduced' | 'full';
export type RenderQuality = 'high' | 'low';

/** Screen-space areas (px) covered by HTML overlays; the camera centres the village in the rest. */
export interface ViewInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const STORAGE_KEY = 'gioi-village:prefs';

export interface SoundMix {
  music: boolean;
  ambience: boolean;
  effects: boolean;
  volume: number;
}

interface StoredPrefs {
  viewMode?: ViewMode;
  motion?: MotionPreference;
  sound?: boolean;
  mix?: SoundMix;
}

const ENTERED_KEY = 'gioi-village:entered';

function readSession(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function readPrefs(): StoredPrefs {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as StoredPrefs;
  } catch {
    return {};
  }
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function media(query: string) {
  const value = signal(false);
  if (typeof window.matchMedia === 'function') {
    const mq = window.matchMedia(query);
    value.set(mq.matches);
    mq.addEventListener?.('change', (e) => value.set(e.matches));
  }
  return value.asReadonly();
}

/**
 * Shared, framework-level state for the village. Deliberately free of Three.js imports so
 * the heavy 3D chunk can stay lazily loaded while UI components still react to it.
 */
@Injectable({ providedIn: 'root' })
export class WorldStateService {
  private readonly router = inject(Router);
  private readonly stored = readPrefs();

  readonly webglSupported = detectWebGL();
  readonly isMobile = media('(max-width: 1023px)');
  readonly isCoarsePointer = media('(pointer: coarse)');
  private readonly systemReducedMotion = media('(prefers-reduced-motion: reduce)');

  /** Building matching the current route. `plaza` = home. */
  readonly activeBuilding = signal<BuildingId>('plaza');
  readonly hoveredBuilding = signal<BuildingId | null>(null);
  readonly panelOpen = computed(() => this.activeBuilding() !== 'plaza');

  readonly status = signal<WorldStatus>(this.webglSupported ? 'loading' : 'unsupported');
  readonly progress = signal(0);

  readonly viewMode = signal<ViewMode>(
    this.webglSupported ? (this.stored.viewMode ?? 'world') : 'classic',
  );
  readonly motionPreference = signal<MotionPreference>(this.stored.motion ?? 'system');
  readonly reducedMotion = computed(() => {
    const pref = this.motionPreference();
    return pref === 'system' ? this.systemReducedMotion() : pref === 'reduced';
  });
  readonly soundEnabled = signal(this.stored.sound ?? false);
  readonly soundMix = signal<SoundMix>({
    music: true,
    ambience: true,
    effects: true,
    volume: 0.7,
    ...this.stored.mix,
  });

  /** Visitor passed the "Enter the village" gate (once per browser session). */
  readonly entered = signal(readSession(ENTERED_KEY));
  readonly isWide = media('(min-width: 1400px)');

  readonly quality = computed<RenderQuality>(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowEnd = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
    return this.isMobile() || this.isCoarsePointer() || lowEnd ? 'low' : 'high';
  });

  private readonly insetSources = signal<Record<string, Partial<ViewInsets>>>({});
  readonly viewInsets = computed<ViewInsets>(() => {
    const result: ViewInsets = { top: 0, right: 0, bottom: 0, left: 0 };
    for (const src of Object.values(this.insetSources())) {
      for (const side of ['top', 'right', 'bottom', 'left'] as const) {
        result[side] = Math.max(result[side], src[side] ?? 0);
      }
    }
    return result;
  });

  /** Fired when a UI control asks the camera to go back to the overview. */
  readonly cameraReset$ = new Subject<void>();

  /** Short-lived message bubble from the avatar or a companion. */
  readonly speech = signal<{ id: string; text: string } | null>(null);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.activeBuilding.set(this.buildingFromRoute()));

    effect(() => {
      const prefs: StoredPrefs = {
        viewMode: this.viewMode(),
        motion: this.motionPreference(),
        sound: this.soundEnabled(),
        mix: this.soundMix(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      } catch {
        /* storage unavailable — preferences simply won't persist */
      }
    });

    effect(() => {
      const root = document.documentElement;
      root.classList.toggle('reduce-motion', this.reducedMotion());
      root.classList.toggle('classic-view', this.viewMode() === 'classic');
    });

    inject(DestroyRef).onDestroy(() => this.cameraReset$.complete());
  }

  /** Navigate to a building's portfolio section. */
  enter(id: BuildingId): void {
    const building = BUILDING_MAP[id];
    void this.router.navigate(['/', ...(building.route ? [building.route] : [])]);
  }

  enterVillage(withSound: boolean): void {
    this.soundEnabled.set(withSound);
    this.entered.set(true);
    try {
      sessionStorage.setItem(ENTERED_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  resetCamera(): void {
    if (this.activeBuilding() !== 'plaza') this.enter('plaza');
    this.cameraReset$.next();
  }

  toggleViewMode(): void {
    if (!this.webglSupported) return;
    this.viewMode.update((m) => (m === 'world' ? 'classic' : 'world'));
  }

  cycleMotion(): void {
    this.motionPreference.update((m) =>
      m === 'system' ? (this.reducedMotion() ? 'full' : 'reduced') : 'system',
    );
  }

  setInsets(source: string, insets: Partial<ViewInsets> | null): void {
    this.insetSources.update((all) => {
      const next = { ...all };
      if (insets) next[source] = insets;
      else delete next[source];
      return next;
    });
  }

  say(id: string, text: string, ms = 3200): void {
    this.speech.set({ id, text });
    setTimeout(() => {
      if (this.speech()?.id === id && this.speech()?.text === text) this.speech.set(null);
    }, ms);
  }

  private buildingFromRoute(): BuildingId {
    let route = this.router.routerState.snapshot.root;
    let building: BuildingId = 'plaza';
    while (route) {
      const data = route.data['building'] as BuildingId | undefined;
      if (data) building = data;
      route = route.firstChild!;
    }
    return building;
  }
}
