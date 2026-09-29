import gsap from 'gsap';
import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Box3,
  BufferGeometry,
  CapsuleGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { Point } from '../layout';
import { outline, toon } from '../utils/materials';
import { animeEyeTexture, mouthTexture } from '../utils/textures';
import { BuildContext } from '../utils/types';
import { approach } from '../utils/wind';

const COLORS = {
  skin: '#fde3cc',
  hair: '#2a1f24',
  robe: '#f7f2e8',
  trim: '#27304d',
  belt: '#1f1f29',
  gold: '#f2c14e',
  boots: '#6b4226',
  pants: '#2b3350',
  satchel: '#9a6a3f',
  tassel: '#d65a4a',
};
const LINE = 0.028;
const HEAD_R = 0.95;
const AVATAR_SCALE = 1.12;

/** `target` shifted by whole turns so it is within half a turn of `from`. */
function nearestAngle(from: number, target: number): number {
  const turn = Math.PI * 2;
  let delta = (target - from) % turn;
  if (delta > Math.PI) delta -= turn;
  if (delta < -Math.PI) delta += turn;
  return from + delta;
}

/**
 * Original chibi developer avatar — ~2.5 heads tall, cel-shaded with ink outlines.
 * White robe-hoodie with navy trim, black belt with a gold buckle, satchel and a red tassel.
 * A GLB model can replace the procedural rig via {@link Avatar.useModel}.
 */
export class Avatar {
  readonly root = new Group();
  private readonly rig = new Group();
  private readonly body = new Group();
  private readonly head = new Group();
  private readonly leftLeg = new Group();
  private readonly rightLeg = new Group();
  private readonly leftArm = new Group();
  private readonly rightArm = new Group();
  private readonly tassel = new Group();
  private readonly hairTuft = new Group();
  private readonly eyes: Mesh[] = [];
  private walking = false;
  private running = false;
  /** 0 standing … 1 full stride; eases so steps blend in and out. */
  private stride = 0;
  private gait = 0;
  private waving = 0;
  private nextBlink = 2;
  private nextGlance = 3;
  private glance = 0;
  private tween: gsap.core.Timeline | null = null;
  private mixer: AnimationMixer | null = null;
  private idleAction: AnimationAction | null = null;
  private walkAction: AnimationAction | null = null;
  onWalkingChange: (walking: boolean) => void = () => undefined;

  constructor(private readonly ctx: BuildContext) {
    this.root.name = 'avatar';
    this.root.userData['owner'] = 'avatar';
    this.root.add(this.rig);
    this.build();
    this.root.scale.setScalar(AVATAR_SCALE);
  }

  /* ------------------------------------------------------------------ */

  private part(
    parent: Object3D,
    geometry: BufferGeometry,
    color: string,
    position: [number, number, number],
    line = LINE,
  ): Mesh {
    const mesh = new Mesh(geometry, toon(color));
    mesh.position.set(...position);
    mesh.castShadow = true;
    if (line > 0) {
      const hull = new Mesh(geometry, outline('#2a1d1a', line));
      hull.castShadow = false;
      mesh.add(hull);
    }
    parent.add(mesh);
    return mesh;
  }

  /** Place a flat decal (eye, mouth, blush) on the head sphere facing outward. */
  private decal(
    material: Material,
    w: number,
    h: number,
    dir: [number, number, number],
    lift = 1.012,
  ): Mesh {
    const d = new Vector3(...dir).normalize();
    const mesh = new Mesh(new PlaneGeometry(w, h), material);
    mesh.position
      .copy(d)
      .multiplyScalar(HEAD_R * lift)
      .add(new Vector3(0, 0.88, 0));
    mesh.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), d));
    mesh.renderOrder = 2;
    this.head.add(mesh);
    return mesh;
  }

  private build(): void {
    this.rig.add(this.body);

    // Legs + boots (pivot at the hip).
    for (const [leg, x] of [
      [this.leftLeg, -0.19],
      [this.rightLeg, 0.19],
    ] as const) {
      leg.position.set(x, 0.56, 0);
      this.part(leg, new CylinderGeometry(0.12, 0.13, 0.4, 10), COLORS.pants, [0, -0.2, 0]);
      const boot = this.part(leg, new SphereGeometry(0.17, 14, 10), COLORS.boots, [0, -0.46, 0.05]);
      boot.scale.set(1, 0.72, 1.35);
      this.body.add(leg);
    }

    // Robe body (bell-shaped lathe) + trims.
    const profile = [
      [0, 0],
      [0.5, 0],
      [0.47, 0.2],
      [0.41, 0.52],
      [0.34, 0.78],
      [0.2, 0.92],
      [0, 0.95],
    ].map(([x, y]) => new Vector2(x, y));
    this.part(this.body, new LatheGeometry(profile, 24), COLORS.robe, [0, 0.45, 0]);
    this.part(
      this.body,
      new TorusGeometry(0.49, 0.05, 8, 28),
      COLORS.trim,
      [0, 0.47, 0],
      0.015,
    ).rotation.x = Math.PI / 2;
    this.part(
      this.body,
      new TorusGeometry(0.44, 0.065, 8, 28),
      COLORS.belt,
      [0, 0.83, 0],
      0.015,
    ).rotation.x = Math.PI / 2;
    const buckle = this.part(
      this.body,
      new CylinderGeometry(0.09, 0.09, 0.05, 6),
      COLORS.gold,
      [0, 0.83, 0.49],
      0.012,
    );
    buckle.rotation.x = Math.PI / 2;
    // Navy collar (V) and front trim.
    for (const side of [-1, 1]) {
      const lapel = this.part(
        this.body,
        new CapsuleGeometry(0.035, 0.34, 4, 6),
        COLORS.trim,
        [side * 0.1, 1.17, 0.26],
        0,
      );
      lapel.rotation.set(0.35, 0, side * 0.5);
    }
    this.part(
      this.body,
      new TorusGeometry(0.2, 0.05, 8, 18),
      COLORS.trim,
      [0, 1.36, 0],
      0.012,
    ).rotation.x = Math.PI / 2;
    // Red tassel hanging from the belt.
    this.tassel.position.set(-0.3, 0.8, 0.34);
    this.part(this.tassel, new SphereGeometry(0.06, 8, 6), COLORS.gold, [0, 0, 0], 0);
    this.part(
      this.tassel,
      new ConeGeometry(0.07, 0.26, 8),
      COLORS.tassel,
      [0, -0.16, 0],
      0.01,
    ).rotation.x = Math.PI;
    this.body.add(this.tassel);
    // Satchel + strap.
    const bag = this.part(
      this.body,
      new CapsuleGeometry(0.13, 0.12, 4, 8),
      COLORS.satchel,
      [0.46, 0.7, 0.08],
      0.018,
    );
    bag.rotation.z = Math.PI / 2;
    const strap = this.part(
      this.body,
      new CylinderGeometry(0.03, 0.03, 1.05, 6),
      COLORS.satchel,
      [0.05, 1.02, 0.24],
      0,
    );
    strap.rotation.set(0.25, 0, -0.75);

    // Arms (pivot at the shoulder): sleeve, navy cuff, hand.
    for (const [arm, side] of [
      [this.leftArm, -1],
      [this.rightArm, 1],
    ] as const) {
      arm.position.set(side * 0.34, 1.24, 0);
      arm.rotation.z = side * 0.28;
      this.part(arm, new CapsuleGeometry(0.12, 0.26, 4, 10), COLORS.robe, [0, -0.2, 0]);
      this.part(
        arm,
        new TorusGeometry(0.11, 0.035, 6, 14),
        COLORS.trim,
        [0, -0.38, 0],
        0,
      ).rotation.x = Math.PI / 2;
      this.part(arm, new SphereGeometry(0.115, 12, 10), COLORS.skin, [0, -0.47, 0], 0.018);
      this.body.add(arm);
    }

    // Head (pivot at the neck).
    this.head.position.set(0, 1.38, 0);
    this.body.add(this.head);
    this.part(this.head, new SphereGeometry(HEAD_R, 36, 28), COLORS.skin, [0, 0.88, 0], 0.03);
    for (const side of [-1, 1])
      this.part(
        this.head,
        new SphereGeometry(0.16, 10, 8),
        COLORS.skin,
        [side * 0.92, 0.8, 0.02],
        0.02,
      );
    this.buildHair();
    this.buildFace();

    // Soft contact shadow.
    const shadow = new Mesh(
      new CircleGeometry(0.62, 24),
      new MeshBasicMaterial({
        color: '#000000',
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.rig.add(shadow);
  }

  private buildHair(): void {
    const H = COLORS.hair;
    const c = 0.88; // head centre height inside the head group
    const cap = this.part(
      this.head,
      new SphereGeometry(1.02, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.53),
      H,
      [0, c + 0.04, -0.03],
      0.03,
    );
    cap.rotation.x = -0.28;
    const back = this.part(
      this.head,
      new SphereGeometry(0.99, 28, 20),
      H,
      [0, c - 0.06, -0.17],
      0.03,
    );
    back.scale.set(1.02, 0.96, 0.9);

    const spike = (
      pos: [number, number, number],
      len: number,
      r: number,
      rot: [number, number, number],
      parent: Object3D = this.head,
    ) => {
      const m = this.part(parent, new ConeGeometry(r, len, 6), H, pos, 0.022);
      m.rotation.set(...rot);
      return m;
    };

    // Bangs: fan of pointed locks over the forehead.
    const bangs = [-0.95, -0.66, -0.38, -0.12, 0.12, 0.38, 0.66, 0.95];
    bangs.forEach((a, i) => {
      const len = [0.72, 0.6, 0.5, 0.42, 0.46, 0.55, 0.62, 0.74][i];
      const r = 0.86;
      const group = new Group();
      group.position.set(Math.sin(a) * r, c + 0.42, Math.cos(a) * r);
      group.rotation.y = a;
      spike(
        [0, -len / 2 + 0.08, 0.05],
        len,
        0.2,
        [Math.PI + 0.42, 0, (i % 2 ? 1 : -1) * 0.12],
        group,
      );
      this.head.add(group);
    });
    // Long side locks framing the face.
    for (const side of [-1, 1]) {
      spike([side * 0.86, c - 0.3, 0.32], 0.95, 0.19, [Math.PI + 0.12, 0, -side * 0.12]);
    }
    // Spiky back and crown.
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (i - 2) * 0.42;
      spike([Math.sin(a) * 0.8, c - 0.1 + Math.abs(i - 2) * 0.06, Math.cos(a) * 0.8], 0.6, 0.24, [
        -1.15 * Math.cos(a) - 0.3,
        0,
        1.15 * Math.sin(a),
      ]);
    }
    for (const [x, rz] of [
      [-0.35, 0.5],
      [0.05, -0.1],
      [0.4, -0.6],
    ]) {
      spike([x, c + 0.98, -0.25], 0.5, 0.2, [-0.55, 0, rz]);
    }
    // Ahoge (single curled strand on top) — sways on its own.
    this.hairTuft.position.set(0.05, c + 1.02, 0.05);
    const tuft = new Mesh(new TorusGeometry(0.2, 0.045, 6, 12, Math.PI * 1.1), toon(H));
    tuft.rotation.set(0, Math.PI / 2, 0.4);
    tuft.position.y = 0.16;
    this.hairTuft.add(tuft);
    this.head.add(this.hairTuft);
  }

  private buildFace(): void {
    const eyeMat = new MeshBasicMaterial({
      map: animeEyeTexture(),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    for (const side of [-1, 1]) {
      const eye = this.decal(eyeMat, 0.36, 0.45, [side * 0.34, -0.1, 0.94]);
      this.eyes.push(eye);
      // Brows.
      const brow = this.decal(
        new MeshBasicMaterial({ color: '#2a1f24' }),
        0.2,
        0.04,
        [side * 0.34, 0.2, 0.92],
        1.02,
      );
      brow.rotateZ(-side * 0.12);
      // Blush.
      this.decal(
        new MeshBasicMaterial({
          color: '#ff9c9c',
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        }),
        0.2,
        0.11,
        [side * 0.56, -0.34, 0.76],
      );
    }
    this.decal(
      new MeshBasicMaterial({
        map: mouthTexture(),
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      0.19,
      0.13,
      [0, -0.43, 0.9],
    );
  }

  /* ------------------------------------------------------------------ */

  /** Swap the procedural rig for a GLB model (optionally animated with idle/walk clips). */
  useModel(model: Object3D, clips: AnimationClip[]): void {
    this.rig.visible = false;
    const box = new Box3().setFromObject(model);
    const height = box.max.y - box.min.y || 1;
    model.scale.multiplyScalar(3.2 / height);
    model.position.y -= box.min.y * (3.2 / height);
    this.root.add(model);
    if (clips.length) {
      this.mixer = new AnimationMixer(model);
      const find = (name: string) => clips.find((c) => c.name.toLowerCase().includes(name));
      const idle = find('idle') ?? clips[0];
      const walk = find('walk') ?? find('run');
      this.idleAction = this.mixer.clipAction(idle).play();
      this.walkAction = walk ? this.mixer.clipAction(walk) : null;
    }
  }

  /** Walk along waypoints, then face the given yaw (radians); `onArrive` runs at the end. */
  walkTo(points: Point[], finalYaw: number, onArrive?: () => void): void {
    this.tween?.kill();
    const target = points.at(-1)!;
    if (this.ctx.reducedMotion() || !points.length) {
      this.root.position.set(target.x, 0, target.z);
      this.root.rotation.y = finalYaw;
      this.setWalking(false);
      onArrive?.();
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => {
        this.setWalking(false);
        if (onArrive) onArrive();
        else this.hop();
      },
    });
    // Long trips are a jog; short ones a stroll.
    let total = 0;
    let prev = { x: this.root.position.x, z: this.root.position.z };
    for (const p of points) {
      total += Math.hypot(p.x - prev.x, p.z - prev.z);
      prev = p;
    }
    this.running = total > 14;
    const speed = this.running ? 9.5 : 6;
    let from = { x: this.root.position.x, z: this.root.position.z };
    let heading = this.root.rotation.y;
    const moves = points.filter((p, i) => {
      const before = i === 0 ? from : points[i - 1];
      return Math.hypot(p.x - before.x, p.z - before.z) >= 0.05;
    });
    moves.forEach((p, i) => {
      const dist = Math.hypot(p.x - from.x, p.z - from.z);
      heading = nearestAngle(heading, Math.atan2(p.x - from.x, p.z - from.z));
      const last = i === moves.length - 1;
      tl.to(this.root.rotation, { y: heading, duration: 0.25, ease: 'sine.out' });
      tl.to(
        this.root.position,
        // Ease out into the final step so the avatar doesn't stop dead.
        {
          x: p.x,
          z: p.z,
          duration: (dist / speed) * (last ? 1.35 : 1),
          ease: last ? 'sine.out' : 'none',
        },
        '<',
      );
      from = p;
    });
    tl.to(this.root.rotation, {
      y: nearestAngle(heading, finalYaw),
      duration: 0.4,
      ease: 'sine.inOut',
    });
    // Ease into the first steps.
    gsap.fromTo(tl, { timeScale: 0.3 }, { timeScale: 1, duration: 0.45, ease: 'sine.out' });
    this.setWalking(true);
    this.tween = tl;
  }

  /** Is the avatar inside a building (hidden)? */
  get inside(): boolean {
    return !this.root.visible || this.root.scale.x < AVATAR_SCALE * 0.99;
  }

  /**
   * Step through a doorway: walk on to `to` while shrinking away (inside), or pop back out
   * at the current spot.
   */
  setInside(inside: boolean, to?: Point, instant = false): void {
    gsap.killTweensOf(this.root.scale);
    gsap.killTweensOf(this.root.position);
    const scale = inside ? 0.001 : AVATAR_SCALE;
    if (instant || this.ctx.reducedMotion()) {
      if (to) this.root.position.set(to.x, 0, to.z);
      this.root.scale.setScalar(scale);
      this.root.visible = !inside;
      return;
    }
    this.root.visible = true;
    if (to) {
      this.setWalking(true);
      gsap.to(this.root.position, {
        x: to.x,
        z: to.z,
        duration: 0.55,
        ease: 'none',
        onComplete: () => this.setWalking(false),
      });
    }
    gsap.to(this.root.scale, {
      x: scale,
      y: scale,
      z: scale,
      duration: inside ? 0.55 : 0.4,
      ease: inside ? 'power2.in' : 'back.out(1.8)',
      onComplete: () => {
        if (inside) this.root.visible = false;
      },
    });
  }

  /** Friendly wave + hop when clicked. */
  greet(): void {
    this.waving = 1.8;
    this.hop();
  }

  private hop(): void {
    if (this.ctx.reducedMotion()) return;
    gsap.fromTo(
      this.rig.position,
      { y: 0 },
      { y: 0.55, duration: 0.24, yoyo: true, repeat: 1, ease: 'power2.out' },
    );
    gsap.fromTo(
      this.rig.scale,
      { x: 1.08, y: 0.9, z: 1.08 },
      { x: 1, y: 1, z: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' },
    );
  }

  private setWalking(walking: boolean): void {
    if (this.walking === walking) return;
    this.walking = walking;
    this.onWalkingChange(walking);
    if (this.walkAction && this.idleAction) {
      const [from, to] = walking
        ? [this.idleAction, this.walkAction]
        : [this.walkAction, this.idleAction];
      to.reset().play();
      from.crossFadeTo(to, 0.25, false);
    }
  }

  update(dt: number, t: number): void {
    this.mixer?.update(dt);
    if (!this.rig.visible) return;
    const still = this.ctx.reducedMotion();
    const walk = this.walking && !still;
    // Blend the stride in and out instead of snapping between standing and walking.
    this.stride = approach(this.stride, walk ? 1 : 0, 9, dt);
    const run = this.running ? 1 : 0;
    this.gait += dt * (9.5 + run * 4.5) * Math.max(this.stride, 0.15);
    const step = Math.sin(this.gait);
    const swing = step * (0.65 + run * 0.25) * this.stride;
    this.leftLeg.rotation.x = swing;
    this.rightLeg.rotation.x = -swing;
    this.leftArm.rotation.x = -swing * (0.8 + run * 0.3);
    this.rightArm.rotation.x = swing * (0.8 + run * 0.3);
    if (!gsap.isTweening(this.rig.position)) {
      const breathe = still ? 0 : Math.sin(t * 2.2) * 0.03;
      const bounce = Math.abs(step) * (0.08 + run * 0.06);
      this.body.position.y = bounce * this.stride + breathe * (1 - this.stride);
      // Lean into the walk (more when jogging).
      this.rig.rotation.x = this.stride * (0.06 + run * 0.1);
    }
    this.body.rotation.z = step * 0.045 * this.stride;

    // Idle: occasional glance around, gentle head tilt, bouncing ahoge and tassel.
    this.nextGlance -= dt;
    if (this.nextGlance < 0) {
      this.nextGlance = 2.5 + Math.random() * 3;
      this.glance = walk || still ? 0 : (Math.random() - 0.5) * 0.9;
    }
    this.head.rotation.y += (this.glance - this.head.rotation.y) * Math.min(1, dt * 3);
    this.head.rotation.z = still ? 0 : Math.sin(t * 0.9) * 0.07;
    this.hairTuft.rotation.z = still ? 0 : Math.sin(t * 3.1) * 0.25;
    this.tassel.rotation.x = still ? 0 : Math.sin(t * 2.6) * 0.25 + (walk ? 0.4 : 0);

    if (this.waving > 0) {
      this.waving -= dt;
      const raise = 2.7 + Math.sin(t * 14) * 0.35;
      this.rightArm.rotation.z = approach(this.rightArm.rotation.z, raise, 14, dt);
      this.head.rotation.z = 0.15;
    } else {
      this.rightArm.rotation.z = approach(this.rightArm.rotation.z, 0.28, 8, dt);
    }

    this.nextBlink -= dt;
    const blinking = this.nextBlink < 0.12;
    for (const e of this.eyes) e.scale.y = blinking ? 0.12 : 1;
    if (this.nextBlink < 0) this.nextBlink = 2 + Math.random() * 3;
  }

  dispose(): void {
    this.tween?.kill();
    gsap.killTweensOf(this.root.scale);
    gsap.killTweensOf(this.root.position);
    gsap.killTweensOf(this.rig.position);
    gsap.killTweensOf(this.rig.scale);
    this.mixer?.stopAllAction();
  }
}
