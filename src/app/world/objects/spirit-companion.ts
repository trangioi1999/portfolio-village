import {
  AdditiveBlending,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
} from 'three';
import gsap from 'gsap';
import { Companion } from '../../models/portfolio.model';
import { outline, toon } from '../utils/materials';
import { animeEyeTexture } from '../utils/textures';
import { BuildContext } from '../utils/types';

/** A small floating spirit animal. Wanders near its home, or follows the avatar. */
export class SpiritCompanion {
  readonly root = new Group();
  private readonly body = new Group();
  private readonly tail = new Group();
  private readonly target = new Vector3();
  private readonly home = new Vector3();
  private wanderTimer = 0;
  private readonly phase = Math.random() * Math.PI * 2;

  constructor(
    readonly data: Companion,
    private readonly ctx: BuildContext,
    glow: Texture,
  ) {
    this.root.name = `spirit-${data.id}`;
    this.root.userData['owner'] = `spirit:${data.id}`;
    this.build(glow);
  }

  private part(
    parent: Object3D,
    geometry: BufferGeometry,
    color: string,
    pos: [number, number, number],
    line = 0.022,
  ): Mesh {
    const mesh = new Mesh(geometry, toon(color, color, 0.18));
    mesh.position.set(...pos);
    mesh.castShadow = true;
    if (line) mesh.add(new Mesh(geometry, outline('#2a1d1a', line)));
    parent.add(mesh);
    return mesh;
  }

  private build(glowTex: Texture): void {
    const { color, accent, species } = this.data;
    this.root.add(this.body);

    // Chibi proportions: big round head on a small plump body.
    const torso = this.part(this.body, new SphereGeometry(0.3, 20, 16), color, [0, 0.32, 0]);
    torso.scale.set(1, 0.92, 1.05);
    const belly = this.part(
      this.body,
      new SphereGeometry(0.18, 14, 10),
      '#ffffff',
      [0, 0.28, 0.2],
      0,
    );
    belly.scale.set(1, 1, 0.5);
    for (const side of [-1, 1]) {
      this.part(this.body, new SphereGeometry(0.09, 10, 8), color, [side * 0.16, 0.06, 0.1], 0.015);
    }
    const head = this.part(
      this.body,
      new SphereGeometry(0.42, 24, 18),
      color,
      [0, 0.82, 0.04],
      0.026,
    );
    head.scale.set(1.08, 0.95, 1);

    // Anime eyes (dark iris tinted by accent), blush, tiny nose.
    const eyeMat = new MeshBasicMaterial({
      map: animeEyeTexture(accent, '#1a1420'),
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    for (const side of [-1, 1]) {
      const eye = new Mesh(new PlaneGeometry(0.2, 0.25), eyeMat);
      eye.position.set(side * 0.17, 0.8, 0.43);
      eye.rotation.y = side * 0.32;
      this.body.add(eye);
      const blush = new Mesh(
        new PlaneGeometry(0.11, 0.06),
        new MeshBasicMaterial({
          color: '#ff9fb1',
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        }),
      );
      blush.position.set(side * 0.27, 0.68, 0.38);
      blush.rotation.y = side * 0.55;
      this.body.add(blush);
    }
    this.part(this.body, new SphereGeometry(0.03, 8, 6), '#2a1d1a', [0, 0.71, 0.45], 0);

    const ear = (x: number, rotZ: number, r: number, h: number, tint = color) => {
      const e = this.part(this.body, new ConeGeometry(r, h, 8), tint, [x, 1.15, 0.02], 0.02);
      e.rotation.z = rotZ;
      const inner = this.part(
        e,
        new ConeGeometry(r * 0.55, h * 0.6, 8),
        '#ffc9d6',
        [0, -0.02, 0.05],
        0,
      );
      inner.scale.z = 0.5;
    };
    switch (species) {
      case 'fox':
        ear(-0.24, 0.35, 0.16, 0.38);
        ear(0.24, -0.35, 0.16, 0.38);
        this.tail.position.set(0, 0.3, -0.3);
        this.part(
          this.tail,
          new ConeGeometry(0.22, 0.7, 10),
          color,
          [0, 0.3, -0.12],
          0.02,
        ).rotation.x = -0.9;
        this.part(this.tail, new SphereGeometry(0.13, 10, 8), '#ffffff', [0, 0.58, -0.38], 0.018);
        break;
      case 'cat':
        ear(-0.24, 0.3, 0.15, 0.28);
        ear(0.24, -0.3, 0.15, 0.28);
        this.tail.position.set(0, 0.28, -0.3);
        this.part(
          this.tail,
          new CylinderGeometry(0.05, 0.06, 0.62, 8),
          color,
          [0, 0.28, -0.08],
          0.015,
        ).rotation.x = -0.4;
        this.part(this.tail, new SphereGeometry(0.08, 8, 6), accent, [0, 0.58, -0.2], 0.015);
        break;
      case 'bunny':
        for (const side of [-1, 1]) {
          const e = this.part(
            this.body,
            new SphereGeometry(0.1, 12, 10),
            color,
            [side * 0.15, 1.32, 0],
            0.02,
          );
          e.scale.set(0.9, 3.2, 0.7);
          e.rotation.z = -side * 0.18;
        }
        this.tail.position.set(0, 0.28, -0.32);
        this.part(this.tail, new SphereGeometry(0.11, 10, 8), '#ffffff', [0, 0, 0], 0.015);
        break;
      case 'bear':
        for (const side of [-1, 1])
          this.part(
            this.body,
            new SphereGeometry(0.12, 12, 10),
            color,
            [side * 0.3, 1.14, 0],
            0.02,
          );
        this.tail.position.set(0, 0.28, -0.3);
        this.part(this.tail, new SphereGeometry(0.08, 8, 6), color, [0, 0, 0], 0.015);
        break;
      case 'owl':
        ear(-0.26, 0.6, 0.1, 0.24, accent);
        ear(0.26, -0.6, 0.1, 0.24, accent);
        for (const side of [-1, 1]) {
          const wing = this.part(
            this.tail,
            new SphereGeometry(0.16, 12, 10),
            color,
            [side * 0.3, 0.05, 0.28],
            0.018,
          );
          wing.scale.set(0.45, 1, 0.9);
          wing.rotation.z = side * 0.3;
        }
        this.tail.position.set(0, 0.3, -0.3);
        break;
    }
    this.body.add(this.tail);

    const halo = new Sprite(
      new SpriteMaterial({
        map: glowTex,
        color: this.data.accent,
        blending: AdditiveBlending,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    );
    halo.scale.setScalar(2.2);
    halo.position.y = 0.6;
    this.body.add(halo);
    this.root.scale.setScalar(1.35);
  }

  setHome(x: number, z: number): void {
    this.home.set(x, 0, z);
    this.root.position.set(x, 0, z);
    this.target.copy(this.home);
  }

  /** Follow a moving point (used by the avatar's companion). */
  follow(point: Vector3): void {
    this.target.copy(point);
  }

  hop(): void {
    if (this.ctx.reducedMotion()) return;
    gsap.fromTo(
      this.body.rotation,
      { y: 0 },
      { y: Math.PI * 2, duration: 0.7, ease: 'power2.out' },
    );
    gsap.fromTo(
      this.body.position,
      { y: 0 },
      { y: 0.9, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.out' },
    );
  }

  update(dt: number, t: number, wander: boolean): void {
    const still = this.ctx.reducedMotion();
    if (wander) {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 3 + Math.random() * 4;
        const a = Math.random() * Math.PI * 2;
        const r = 0.8 + Math.random() * 2;
        this.target.set(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
      }
    }
    const p = this.root.position;
    const dx = this.target.x - p.x;
    const dz = this.target.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      const step = Math.min(dist, dt * (still ? 20 : wander ? 1.2 : 5));
      p.x += (dx / dist) * step;
      p.z += (dz / dist) * step;
      const yaw = Math.atan2(dx, dz);
      let delta = yaw - this.root.rotation.y;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.root.rotation.y += delta * Math.min(1, dt * 5);
    }
    if (!gsap.isTweening(this.body.position)) {
      this.body.position.y = 0.55 + (still ? 0 : Math.sin(t * 2.2 + this.phase) * 0.14);
    }
    this.tail.rotation.y = still ? 0 : Math.sin(t * 4 + this.phase) * 0.4;
  }

  dispose(): void {
    gsap.killTweensOf(this.body.position);
    gsap.killTweensOf(this.body.rotation);
  }
}
