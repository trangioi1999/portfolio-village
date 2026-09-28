import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  RingGeometry,
  Vector3,
} from 'three';
import { Icon } from '../components/icon/icon';
import { BUILDINGS, BUILDING_MAP, VIEW_AZIMUTH } from '../data/buildings.data';
import { COMPANIONS } from '../data/portfolio.data';
import { Building, BuildingId } from '../models/building.model';
import { AVATAR_MODEL } from '../data/portfolio.data';
import { AudioService } from '../services/audio.service';
import { WorldStateService } from '../services/world-state.service';
import { PLAZA_RADIUS, POND, Point, STREAM_END, arrivalPoint } from './layout';
import { BUILDING_FACTORIES } from './objects/buildings';
import { Avatar } from './objects/character';
import { createNature } from './objects/nature';
import { SparkleBurst, createAmbientParticles } from './objects/particles';
import { createSky } from './objects/sky';
import { SpiritCompanion } from './objects/spirit-companion';
import { createTerrain } from './objects/terrain';
import { AssetLoaderService } from './services/asset-loader.service';
import { CameraService } from './services/camera.service';
import { InteractionService } from './services/interaction.service';
import { ThreeSceneService } from './services/three-scene.service';
import { disposeGeometryCache, disposeObject, mergeStatic } from './utils/geometry';
import { clearMaterialCache } from './utils/materials';
import { createRng } from './utils/random';
import { glowTexture } from './utils/textures';
import { BuildContext, Updater } from './utils/types';

interface BuildingRuntime {
  def: Building;
  group: Group;
  materials: MeshStandardMaterial[];
  ring: Mesh<RingGeometry, MeshBasicMaterial>;
  level: number;
}

const HIGHLIGHT = new Color('#ffb45c');
const AVATAR_HOME: Point = { x: 0, z: 1.4 };
const RING_RADIUS = 5.2;
/** Yield so Angular can render progress and the browser can paint between build steps. */
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0)));

/**
 * The 3D village. Loaded lazily (@defer) so Three.js never blocks the first paint.
 * Portfolio content lives in regular HTML; this component only visualises and navigates.
 */
@Component({
  selector: 'app-village-world',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  providers: [ThreeSceneService, CameraService, AssetLoaderService, InteractionService],
  host: { class: 'fixed inset-0 z-0 block' },
  styles: `
    .anchor {
      position: absolute;
      left: 0;
      top: 0;
      opacity: 0;
      will-change: transform;
      transition: opacity 200ms;
    }
    .anchor > * {
      transform: translate(-50%, -100%);
    }
    .anchor.below > * {
      transform: translate(-50%, 0.25rem);
    }
  `,
  template: `
    <canvas #canvas class="block h-full w-full touch-none outline-none" aria-hidden="true"></canvas>
    <p class="sr-only">
      An interactive 3D village. Each building is a section of the portfolio — use the Village map
      navigation to visit them.
    </p>
    <div #labels class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      @for (b of labelled; track b.id) {
        <div class="anchor" [attr.data-anchor]="'building:' + b.id">
          <button
            type="button"
            tabindex="-1"
            class="ink-banner pointer-events-auto flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-left whitespace-nowrap transition duration-200"
            [class.!rounded-xl]="hovered() === b.id"
            [class.opacity-60]="active() !== 'plaza' && active() !== b.id && hovered() !== b.id"
            (click)="state.enter(b.id)"
            (pointerenter)="state.hoveredBuilding.set(b.id)"
            (pointerleave)="state.hoveredBuilding.set(null)"
          >
            <span
              class="grid size-6 shrink-0 place-items-center rounded-full bg-sun-400 text-ink-900"
              [class.!size-5]="compact()"
            >
              <app-icon [name]="b.icon" [size]="13" />
            </span>
            <span>
              <span
                class="block font-display leading-tight font-bold"
                [class]="compact() ? 'text-[0.68rem]' : 'text-[0.82rem]'"
                >{{ b.name }}</span
              >
              @if ((hovered() === b.id || active() === b.id || wide()) && !compact()) {
                <span class="block text-[0.68rem] font-semibold text-sun-300/90">{{
                  b.subtitle
                }}</span>
              }
              @if (hovered() === b.id && !compact()) {
                <span
                  class="mt-1 block max-w-52 pb-0.5 text-[0.7rem] leading-snug whitespace-normal text-parchment-100"
                >
                  {{ b.description }}
                  <span class="mt-0.5 block font-bold text-sun-300">Click to enter →</span>
                </span>
              }
            </span>
          </button>
        </div>
      }
      <div class="anchor below" data-anchor="avatar-tag">
        <span class="ink-banner block rounded-full px-3 py-0.5 font-display text-sm font-bold"
          >Giỏi</span
        >
      </div>
      @if (spiritTip(); as tip) {
        <div class="anchor" [attr.data-anchor]="tip.anchor">
          <span class="glass block rounded-xl px-3 py-1.5 text-center text-xs whitespace-nowrap">
            <span class="block font-display text-sm font-bold text-ink-900">{{ tip.name }}</span>
            <span class="font-bold" [style.color]="tip.accent">{{ tip.trait }}</span>
          </span>
        </div>
      }
      @if (state.speech(); as s) {
        <div class="anchor" [attr.data-anchor]="s.id + ':speech'">
          <span
            class="parchment animate-rise block max-w-64 !rounded-2xl px-3.5 py-2 text-center font-hand text-lg leading-snug text-ink-900"
          >
            {{ s.text }}
          </span>
        </div>
      }
    </div>
  `,
})
export class VillageWorld {
  protected readonly state = inject(WorldStateService);
  private readonly three = inject(ThreeSceneService);
  private readonly cameraService = inject(CameraService);
  private readonly assets = inject(AssetLoaderService);
  private readonly interaction = inject(InteractionService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly labelsEl = viewChild.required<ElementRef<HTMLElement>>('labels');

  protected readonly labelled = BUILDINGS.filter((b) => b.id !== 'plaza');
  protected readonly compact = this.state.isMobile;
  protected readonly wide = this.state.isWide;
  protected readonly active = this.state.activeBuilding;
  protected readonly hovered = computed(() => {
    const owner = this.interaction.hovered();
    return owner?.startsWith('building:')
      ? (owner.slice(9) as BuildingId)
      : this.state.hoveredBuilding();
  });
  protected readonly spiritTip = computed(() => {
    const owner = this.interaction.hovered();
    if (!owner?.startsWith('spirit:')) return null;
    const c = COMPANIONS.find((x) => `spirit:${x.id}` === owner);
    return c ? { anchor: `${owner}:tip`, name: c.name, trait: c.trait, accent: c.accent } : null;
  });

  private readonly ready = signal(false);
  private readonly buildings = new Map<BuildingId, BuildingRuntime>();
  private readonly spirits = new Map<string, SpiritCompanion>();
  private avatar: Avatar | null = null;
  private avatarAt: BuildingId = 'plaza';
  private disposed = false;
  private resizeObserver: ResizeObserver | null = null;
  private lastInsetsKey = '';
  private readonly tmp = new Vector3();
  private readonly audio = inject(AudioService);
  private burst: SparkleBurst | null = null;
  private introDone = false;
  private waterTimer = 0;
  private readonly labelBoxes = new Map<HTMLElement, { w: number; h: number }>();
  private avoidTimer = 0;
  private avoidRects: { l: number; r: number; t: number; b: number }[] = [];

  constructor() {
    afterNextRender(() => void this.init());
    inject(DestroyRef).onDestroy(() => this.dispose());

    // Route → camera focus + avatar walk.
    effect(() => {
      const id = this.state.activeBuilding();
      if (!this.ready()) return;
      untracked(() => {
        if (this.introDone) this.goTo(id, false);
      });
    });

    // Intro: once the visitor enters, fly from the sky down to the village.
    effect(() => {
      if (!this.ready() || !this.state.entered() || this.introDone) return;
      untracked(() => {
        this.introDone = true;
        const id = this.state.activeBuilding();
        const instant = this.state.reducedMotion();
        if (id === 'plaza') this.cameraService.overview(instant, 3.4);
        else this.cameraService.focus(BUILDING_MAP[id], instant, 3.4);
        this.placeAvatar(id);
      });
    });

    // Overlays → camera view offset (and refit the overview on the plaza).
    effect(() => {
      const insets = this.state.viewInsets();
      if (!this.ready()) return;
      untracked(() => {
        this.cameraService.setInsets(insets);
        const key = [insets.left, insets.right, insets.top, insets.bottom]
          .map((v) => Math.round(v / 40))
          .join();
        if (key !== this.lastInsetsKey && this.introDone && this.state.activeBuilding() === 'plaza')
          this.cameraService.overview();
        this.lastInsetsKey = key;
      });
    });

    // Full-screen panels on small screens hide the scene — stop rendering meanwhile.
    effect(() => {
      const hidden = this.state.isMobile() && this.state.panelOpen();
      if (this.ready()) this.three.setPaused(hidden);
    });

    // Hover from the 3D scene flows back to the shared state (highlights the nav item too).
    effect(() => {
      const owner = this.interaction.hovered();
      untracked(() => {
        if (owner?.startsWith('building:'))
          this.state.hoveredBuilding.set(owner.slice(9) as BuildingId);
        else if (owner === null && this.state.hoveredBuilding() !== null)
          this.state.hoveredBuilding.set(null);
      });
    });

    this.state.cameraReset$.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.ready()) {
        this.cameraService.overview(this.state.reducedMotion());
        this.audio.play('toggle');
      }
    });
  }

  private async init(): Promise<void> {
    const state = this.state;
    try {
      state.status.set('loading');
      state.progress.set(0.12);
      await Promise.race([
        Promise.all([
          document.fonts.load("48px 'Patrick Hand'"),
          document.fonts.load("800 48px 'Baloo 2'"),
        ]).catch(() => undefined),
        new Promise((r) => setTimeout(r, 1500)),
      ]);

      const canvas = this.canvas().nativeElement;
      const { clientWidth: w, clientHeight: h } = this.host.nativeElement;
      const quality = state.quality();
      this.three.init(canvas, quality);
      this.three.resize(w, h);
      this.cameraService.init(canvas, w, h);
      canvas.addEventListener('webglcontextlost', this.onContextLost);

      const ctx: BuildContext = {
        quality,
        rng: createRng(),
        reducedMotion: () => state.reducedMotion(),
      };
      const scene = this.three.scene;
      const addObject = (root: Object3D, update?: Updater) => {
        scene.add(root);
        if (update) this.three.onTick(update);
      };

      state.progress.set(0.22);
      await nextFrame();
      const sky = createSky(ctx);
      addObject(sky.root, sky.update);

      state.progress.set(0.38);
      await nextFrame();
      const terrain = createTerrain(ctx);
      addObject(terrain.root, terrain.update);

      for (const [i, def] of BUILDINGS.entries()) {
        state.progress.set(0.45 + (i / BUILDINGS.length) * 0.35);
        await nextFrame();
        if (this.disposed) return;
        this.addBuilding(def, ctx);
      }

      state.progress.set(0.85);
      await nextFrame();
      const nature = createNature(ctx);
      addObject(nature.root, nature.update);
      const ambient = createAmbientParticles(ctx);
      addObject(ambient.root, ambient.update);
      this.burst = new SparkleBurst();
      scene.add(this.burst.root);

      state.progress.set(0.93);
      await nextFrame();
      this.addCharacters(ctx);

      this.interaction.init(canvas, this.cameraService.camera, [
        ...[...this.buildings.values()].filter((b) => b.def.id !== 'plaza').map((b) => b.group),
        this.avatar!.root,
        ...[...this.spirits.values()].map((s) => s.root),
      ]);
      this.interaction.onSelect = (owner) => this.select(owner);

      this.three.onTick((dt, t) => this.tick(dt, t));
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.host.nativeElement);

      this.cameraService.setInsets(state.viewInsets());
      if (state.reducedMotion()) {
        this.introDone = true;
        this.goTo(state.activeBuilding(), true);
      } else {
        this.cameraService.introPose();
      }
      state.progress.set(0.97);
      // Compile shaders up front (parallel where supported) to avoid a first-frame hitch.
      await this.three.renderer
        .compileAsync(scene, this.cameraService.camera)
        .catch(() => undefined);
      if (this.disposed) return;
      this.three.setupPost(this.cameraService.camera, quality);
      this.three.start(() => this.three.render(this.cameraService.camera));
      if (this.disposed) return;
      this.ready.set(true);
      state.progress.set(1);
      state.status.set('ready');
    } catch (error) {
      console.error('[village] Failed to build the 3D world, falling back to classic view.', error);
      state.status.set('error');
      state.viewMode.set('classic');
    }
  }

  private addBuilding(def: Building, ctx: BuildContext): void {
    const obj = BUILDING_FACTORIES[def.id](ctx);
    const group = new Group();
    group.name = `building-${def.id}`;
    group.userData['owner'] = `building:${def.id}`;
    group.position.set(def.position[0], 0, def.position[1]);
    group.rotation.y = def.rotation;
    group.add(obj.root);
    mergeStatic(obj.root);
    if (obj.update) this.three.onTick(obj.update);

    // Per-building material clones so highlights don't leak to other buildings.
    const clones = new Map<string, MeshStandardMaterial>();
    group.traverse((o) => {
      const mesh = o as Mesh;
      const m = mesh.material as MeshStandardMaterial | undefined;
      if (!mesh.isMesh || !m?.isMeshStandardMaterial || m.emissive.getHex() !== 0) return;
      let clone = clones.get(m.uuid);
      if (!clone) {
        clone = m.clone();
        clones.set(m.uuid, clone);
      }
      mesh.material = clone;
    });

    const ring = new Mesh(
      new RingGeometry(def.footprint + 0.6, def.footprint + 1.2, 56),
      new MeshBasicMaterial({
        color: '#ffd98a',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(def.position[0], 0.09, def.position[1]);
    ring.visible = false;

    this.three.scene.add(group, ring);
    this.buildings.set(def.id, { def, group, materials: [...clones.values()], ring, level: 0 });

    if (def.modelUrl) {
      this.assets
        .loadModel(def.modelUrl)
        .then((model) => {
          disposeObject(obj.root);
          group.remove(obj.root);
          group.add(model);
        })
        .catch((e) =>
          console.warn(`[village] Could not load ${def.modelUrl}, keeping placeholder.`, e),
        );
    }
  }

  private addCharacters(ctx: BuildContext): void {
    this.avatar = new Avatar(ctx);
    this.avatar.root.position.set(AVATAR_HOME.x, 0, AVATAR_HOME.z);
    this.avatar.root.rotation.y = VIEW_AZIMUTH;
    this.avatar.onWalkingChange = (walking) => this.audio.setWalking(walking);
    this.three.scene.add(this.avatar.root);
    if (AVATAR_MODEL) {
      const avatar = this.avatar;
      this.assets
        .loadGltf(AVATAR_MODEL)
        .then(({ scene, animations }) => avatar.useModel(scene, animations))
        .catch((e) =>
          console.warn('[village] Avatar model failed to load, using the built-in chibi.', e),
        );
    }

    const glow = glowTexture();
    for (const data of COMPANIONS) {
      const spirit = new SpiritCompanion(data, ctx, glow);
      if (data.home === 'avatar') {
        spirit.setHome(AVATAR_HOME.x - 1.4, AVATAR_HOME.z - 0.4);
      } else {
        const b = BUILDING_MAP[data.home];
        const p = arrivalPoint(b.id, 1.6);
        const len = Math.hypot(p.x, p.z) || 1;
        spirit.setHome(p.x + (-p.z / len) * 2.4, p.z + (p.x / len) * 2.4);
      }
      this.spirits.set(data.id, spirit);
      this.three.scene.add(spirit.root);
    }
  }

  private select(owner: string): void {
    const at = new Vector3();
    if (owner.startsWith('building:')) {
      const def = BUILDING_MAP[owner.slice(9) as BuildingId];
      this.burst?.emit(
        at.set(def.position[0], def.labelHeight * 0.55, def.position[1]),
        '#ffd98a',
        40,
      );
      this.audio.play('sparkle');
      this.state.enter(def.id);
    } else if (owner === 'avatar' && this.avatar) {
      this.avatar.greet();
      this.burst?.emit(at.copy(this.avatar.root.position).setY(3.2), '#ffe3a0', 24);
      this.audio.play('greet');
      this.state.say('avatar', "Hi, I'm Giỏi! Welcome to my village 👋");
    } else if (owner.startsWith('spirit:')) {
      const spirit = this.spirits.get(owner.slice(7));
      if (!spirit) return;
      spirit.hop();
      this.burst?.emit(at.copy(spirit.root.position).setY(1.4), spirit.data.accent, 22);
      this.audio.play('spirit', 0.8 + COMPANIONS.indexOf(spirit.data) * 0.12);
      this.state.say(
        owner,
        `${spirit.data.name} (${spirit.data.trait}): “${spirit.data.greeting}”`,
      );
    }
  }

  /** Camera focus + avatar walk for the active building. */
  private goTo(id: BuildingId, instant: boolean): void {
    const def = BUILDING_MAP[id];
    const immediate = instant || this.state.reducedMotion();
    if (id === 'plaza') this.cameraService.overview(immediate);
    else this.cameraService.focus(def, immediate);

    if (!this.avatar || id === this.avatarAt) return;
    const from = this.avatarAt;
    this.avatarAt = id;
    const path = this.avatarPath(from, id);
    const end = path.at(-1)!;
    const yaw =
      id === 'plaza' ? VIEW_AZIMUTH : Math.atan2(def.position[0] - end.x, def.position[1] - end.z);
    if (instant) {
      this.avatar.root.position.set(end.x, 0, end.z);
      this.avatar.root.rotation.y = yaw;
    } else {
      this.avatar.walkTo(path, yaw);
    }
  }

  /** Put the avatar at a building instantly (used after the intro flight). */
  private placeAvatar(id: BuildingId): void {
    if (!this.avatar || id === this.avatarAt) return;
    const path = this.avatarPath(this.avatarAt, id);
    const end = path.at(-1)!;
    const def = BUILDING_MAP[id];
    this.avatarAt = id;
    this.avatar.root.position.set(end.x, 0, end.z);
    this.avatar.root.rotation.y =
      id === 'plaza' ? VIEW_AZIMUTH : Math.atan2(def.position[0] - end.x, def.position[1] - end.z);
  }

  /** Walk around the fountain along the plaza ring, then out to the building. */
  private avatarPath(from: BuildingId, to: BuildingId): Point[] {
    const angleOf = (id: BuildingId) => {
      if (id === 'plaza') return Math.PI / 2;
      const p = arrivalPoint(id);
      return Math.atan2(p.z, p.x);
    };
    const ring = (a: number): Point => ({
      x: Math.cos(a) * RING_RADIUS,
      z: Math.sin(a) * RING_RADIUS,
    });
    const a0 = angleOf(from);
    const a1 = angleOf(to);
    let delta = a1 - a0;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    const steps = Math.max(1, Math.ceil(Math.abs(delta) / 0.45));
    const points: Point[] = [ring(a0)];
    for (let i = 1; i <= steps; i++) points.push(ring(a0 + (delta * i) / steps));
    points.push(to === 'plaza' ? AVATAR_HOME : arrivalPoint(to, 1.3));
    // Buildings far from the plaza: add a midpoint so the avatar follows the path direction.
    if (to !== 'plaza') {
      const end = points.at(-1)!;
      const mid = { x: Math.cos(a1) * (PLAZA_RADIUS + 1), z: Math.sin(a1) * (PLAZA_RADIUS + 1) };
      if (Math.hypot(end.x, end.z) > PLAZA_RADIUS + 2) points.splice(points.length - 1, 0, mid);
    }
    return points;
  }

  private tick(dt: number, t: number): void {
    this.cameraService.update(dt);
    this.interaction.update();

    // Hover / active highlight.
    const hovered = this.hovered();
    const active = this.state.activeBuilding();
    for (const b of this.buildings.values()) {
      if (b.def.id === 'plaza') continue;
      const goal = hovered === b.def.id ? 1 : active === b.def.id ? 0.55 : 0;
      if (Math.abs(goal - b.level) < 0.002 && goal === 0 && !b.ring.visible) continue;
      b.level += (goal - b.level) * Math.min(1, dt * 8);
      for (const m of b.materials) m.emissive.copy(HIGHLIGHT).multiplyScalar(b.level * 0.28);
      b.group.scale.setScalar(1 + (hovered === b.def.id ? b.level * 0.025 : 0));
      b.ring.visible = b.level > 0.01;
      b.ring.material.opacity = b.level * 0.8;
      const pulse = this.state.reducedMotion() ? 1 : 1 + Math.sin(t * 3) * 0.03;
      b.ring.scale.setScalar(pulse);
    }

    // Characters.
    if (this.avatar) {
      this.avatar.update(dt, t);
      const yaw = this.avatar.root.rotation.y;
      const follow = this.tmp
        .set(-1.4, 0, -0.5)
        .applyAxisAngle(new Vector3(0, 1, 0), yaw)
        .add(this.avatar.root.position);
      for (const s of this.spirits.values()) {
        const followsAvatar = s.data.home === 'avatar';
        if (followsAvatar) s.follow(follow);
        s.update(dt, t, !followsAvatar);
      }
    }

    this.burst?.update(dt);

    // Running water gets louder as the camera looks at the pond / waterfalls.
    this.waterTimer -= dt;
    if (this.waterTimer < 0) {
      this.waterTimer = 0.4;
      const t0 = this.cameraService.controls.target;
      const d = Math.min(
        Math.hypot(t0.x - POND.x, t0.z - POND.z),
        Math.hypot(t0.x - STREAM_END.x, t0.z - STREAM_END.z),
      );
      const zoom = this.cameraService.camera.position.distanceTo(t0);
      this.audio.setWaterProximity(
        Math.max(0, Math.min(1, 1 - (d - 6) / 26)) * Math.min(1, 45 / zoom),
      );
    }

    this.updateLabels();
  }

  private anchorPosition(key: string, out: Vector3): boolean {
    if (key.startsWith('building:')) {
      const def = BUILDING_MAP[key.slice(9) as BuildingId];
      out.set(def.position[0], def.labelHeight, def.position[1]);
      return true;
    }
    if (key === 'avatar-tag' && this.avatar) {
      out.copy(this.avatar.root.position);
      return true;
    }
    if (key === 'avatar:speech' && this.avatar) {
      out.copy(this.avatar.root.position).setY(4.5);
      return true;
    }
    if (key.startsWith('spirit:')) {
      const spirit = this.spirits.get(key.split(':')[1]);
      if (!spirit) return false;
      out.copy(spirit.root.position).setY(2.4);
      return true;
    }
    return false;
  }

  private updateLabels(): void {
    const container = this.labelsEl().nativeElement;
    const w = container.clientWidth;
    const h = container.clientHeight;
    const camera = this.cameraService.camera;
    const v = new Vector3();
    const buildingLabels: { el: HTMLElement; x: number; y: number; z: number }[] = [];
    container.querySelectorAll<HTMLElement>('[data-anchor]').forEach((el) => {
      const key = el.dataset['anchor']!;
      if (!this.anchorPosition(key, v)) return;
      v.project(camera);
      const isBuilding = key.startsWith('building:');
      const limit = isBuilding ? 1.8 : 1.2;
      const visible = v.z < 1 && Math.abs(v.x) < limit && Math.abs(v.y) < limit;
      el.style.opacity = visible ? '1' : '0';
      if (!visible) return;
      const x = ((v.x + 1) / 2) * w;
      const y = ((1 - v.y) / 2) * h;
      if (isBuilding) {
        buildingLabels.push({ el, x, y, z: v.z });
        return;
      }
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      el.style.zIndex = String(Math.round((1 - v.z) * 10000) + 20000);
    });

    // Keep building signboards from overlapping: nearer labels win, farther ones move up.
    // HTML cards marked [data-avoid] (e.g. "The Next Chapter") push labels below them.
    buildingLabels.sort((a, b) => a.z - b.z);
    const placed: { l: number; r: number; t: number; b: number }[] = [];
    if (--this.avoidTimer <= 0) {
      this.avoidTimer = 20;
      this.avoidRects = Array.from(document.querySelectorAll('[data-avoid]'), (el) =>
        el.getBoundingClientRect(),
      )
        .filter((r) => r.width > 0)
        .map((r) => ({ l: r.left, r: r.right, t: r.top, b: r.bottom }));
    }
    for (const label of buildingLabels) {
      const box = this.labelSize(label.el);
      // Keep signboards on screen even when their building pokes out of the frame.
      const x = Math.min(w - box.w / 2 - 8, Math.max(box.w / 2 + 8, label.x));
      label.x = x;
      let y = Math.min(h - 8, Math.max(box.h + 8, label.y));
      for (let pass = 0; pass < 4; pass++) {
        const rect = { l: label.x - box.w / 2, r: label.x + box.w / 2, t: y - box.h, b: y };
        const overlaps = (p: { l: number; r: number; t: number; b: number }) =>
          rect.l < p.r && rect.r > p.l && rect.t < p.b && rect.b > p.t;
        const blocked = this.avoidRects.find(overlaps);
        if (blocked) {
          y = blocked.b + box.h + 6;
          continue;
        }
        const hit = placed.find(overlaps);
        if (!hit) break;
        y = hit.t - 4;
      }
      placed.push({ l: label.x - box.w / 2, r: label.x + box.w / 2, t: y - box.h, b: y });
      label.el.style.transform = `translate3d(${label.x}px, ${y}px, 0)`;
      label.el.style.zIndex = String(Math.round((1 - label.z) * 10000));
    }
  }

  /** Cached label size (re-measured every ~30 frames to follow hover expansion). */
  private labelSize(el: HTMLElement): { w: number; h: number } {
    let box = this.labelBoxes.get(el);
    if (!box || Math.random() < 0.05) {
      const child = el.firstElementChild as HTMLElement | null;
      box = { w: child?.offsetWidth ?? 0, h: child?.offsetHeight ?? 0 };
      this.labelBoxes.set(el, box);
    }
    return box;
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.host.nativeElement;
    if (!w || !h) return;
    this.three.resize(w, h);
    this.cameraService.resize(w, h);
  }

  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    this.state.status.set('error');
    this.state.viewMode.set('classic');
  };

  private dispose(): void {
    this.disposed = true;
    this.resizeObserver?.disconnect();
    this.canvas().nativeElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.avatar?.dispose();
    this.spirits.forEach((s) => s.dispose());
    this.interaction.dispose();
    this.cameraService.dispose();
    this.assets.dispose();
    disposeObject(this.three.scene);
    this.three.dispose();
    clearMaterialCache();
    disposeGeometryCache();
    if (this.state.status() === 'ready') this.state.status.set('loading');
    this.state.progress.set(0);
  }
}
