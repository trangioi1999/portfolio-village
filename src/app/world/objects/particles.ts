import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { BUILDING_MAP } from '../../data/buildings.data';
import { SKILL_GROUPS } from '../../data/skills.data';
import { PLAZA_RADIUS, rimRadius } from '../layout';
import { BuildContext, VillageObject } from '../utils/types';

/* ------------------------------------------------------------------ */
/* Glowing motes (fireflies / pollen / magic sparkles)                 */
/* ------------------------------------------------------------------ */

function sparkleMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: window.devicePixelRatio } },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aSize;
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uScale;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * 0.9 + aPhase * 6.28) * 0.45;
        p.x += sin(uTime * 0.5 + aPhase * 12.0) * 0.35;
        p.z += cos(uTime * 0.6 + aPhase * 9.0) * 0.35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        vAlpha = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 2.4 + aPhase * 20.0), 2.0);
        vColor = aColor;
        gl_PointSize = aSize * uScale * (220.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor * 1.6, a * vAlpha);
      }
    `,
  });
}

function sparkles(ctx: BuildContext): { points: Points; material: ShaderMaterial } {
  const { rng } = ctx;
  const count = ctx.quality === 'high' ? 220 : 90;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const c = new Color();
  const garden = BUILDING_MAP.garden.position;
  const shrine = BUILDING_MAP.contact.position;
  for (let i = 0; i < count; i++) {
    const zone = rng.next();
    let x: number;
    let z: number;
    let y: number;
    if (zone < 0.3) {
      // Around the skills crystals, tinted by skill colours.
      x = garden[0] + rng.range(-6, 6);
      z = garden[1] + rng.range(-5, 5);
      y = rng.range(0.5, 4);
      c.set(rng.pick(SKILL_GROUPS).color);
    } else if (zone < 0.45) {
      x = shrine[0] + rng.range(-5, 5);
      z = shrine[1] + rng.range(-4, 5);
      y = rng.range(0.5, 4);
      c.set('#ffe3a0');
    } else if (zone < 0.6) {
      const a = rng.next() * Math.PI * 2;
      const r = rng.range(1, PLAZA_RADIUS);
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = rng.range(1, 5);
      c.set('#fff4c2');
    } else {
      // Pollen floating across the whole island.
      const a = rng.next() * Math.PI * 2;
      const r = Math.sqrt(rng.next()) * (rimRadius(a) - 1);
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = rng.range(0.6, 7);
      c.set(rng.pick(['#fffbe0', '#d8ffb8', '#ffe6f2']));
    }
    positions.set([x, y, z], i * 3);
    colors.set([c.r, c.g, c.b], i * 3);
    phases[i] = rng.next();
    sizes[i] = rng.range(0.6, 1.4);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(positions, 3));
  g.setAttribute('aPhase', new BufferAttribute(phases, 1));
  g.setAttribute('aSize', new BufferAttribute(sizes, 1));
  g.setAttribute('aColor', new BufferAttribute(colors, 3));
  const material = sparkleMaterial();
  const points = new Points(g, material);
  points.frustumCulled = false;
  return { points, material };
}

/* ------------------------------------------------------------------ */
/* Falling sakura petals                                               */
/* ------------------------------------------------------------------ */

interface Petal {
  pos: Vector3;
  vel: Vector3;
  spin: Vector3;
  rot: Vector3;
  origin: Vector3;
}

function petals(ctx: BuildContext): VillageObject {
  const { rng } = ctx;
  const count = ctx.quality === 'high' ? 90 : 40;
  const geometry = new PlaneGeometry(0.2, 0.14);
  const material = new MeshBasicMaterial({
    color: '#ffc2d4',
    side: DoubleSide,
    transparent: true,
    opacity: 0.95,
  });
  const mesh = new InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.frustumCulled = false;
  const academy = BUILDING_MAP.academy.position;
  const list: Petal[] = [];
  const spawn = (p: Petal, anywhere: boolean) => {
    const nearAcademy = rng.next() < 0.6;
    const cx = nearAcademy ? academy[0] : 0;
    const cz = nearAcademy ? academy[1] : 0;
    const spread = nearAcademy ? 11 : 26;
    p.origin.set(
      cx + rng.range(-spread, spread),
      rng.range(5, 10),
      cz + rng.range(-spread, spread),
    );
    p.pos.copy(p.origin);
    if (anywhere) p.pos.y = rng.range(0.2, 10);
    p.vel.set(rng.range(0.3, 0.8), -rng.range(0.35, 0.7), rng.range(-0.2, 0.3));
    p.spin.set(rng.range(-2, 2), rng.range(-2, 2), rng.range(-2, 2));
  };
  for (let i = 0; i < count; i++) {
    const p: Petal = {
      pos: new Vector3(),
      vel: new Vector3(),
      spin: new Vector3(),
      rot: new Vector3(),
      origin: new Vector3(),
    };
    spawn(p, true);
    list.push(p);
  }
  const dummy = new Object3D();
  return {
    root: mesh,
    update: (dt, t) => {
      if (ctx.reducedMotion()) return;
      list.forEach((p, i) => {
        p.pos.addScaledVector(p.vel, dt);
        p.pos.x += Math.sin(t * 1.3 + i) * dt * 0.5;
        p.rot.addScaledVector(p.spin, dt);
        if (p.pos.y < 0.05) spawn(p, false);
        dummy.position.copy(p.pos);
        dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Butterflies                                                          */
/* ------------------------------------------------------------------ */

function butterflies(ctx: BuildContext): VillageObject {
  const root = new Group();
  const { rng } = ctx;
  const colors = ['#ffd24d', '#ff8fb1', '#8fd0ff', '#ffffff', '#c9a2ff', '#ffa94d'];
  const wingGeo = new PlaneGeometry(0.28, 0.22);
  wingGeo.translate(0.14, 0, 0);
  const flock: {
    obj: Group;
    l: Mesh;
    r: Mesh;
    center: Vector3;
    radius: number;
    speed: number;
    phase: number;
  }[] = [];
  for (let i = 0; i < (ctx.quality === 'high' ? 10 : 5); i++) {
    const obj = new Group();
    const m = new MeshBasicMaterial({ color: colors[i % colors.length], side: DoubleSide });
    const l = new Mesh(wingGeo, m);
    const r = new Mesh(wingGeo, m);
    r.rotation.y = Math.PI;
    obj.add(l, r);
    const a = rng.next() * Math.PI * 2;
    const d = rng.range(9, 22);
    flock.push({
      obj,
      l,
      r,
      center: new Vector3(Math.cos(a) * d, rng.range(0.8, 2.2), Math.sin(a) * d),
      radius: rng.range(1, 3),
      speed: rng.range(0.4, 0.9),
      phase: rng.next() * 6,
    });
    root.add(obj);
  }
  return {
    root,
    update: (_dt, t) => {
      const still = ctx.reducedMotion();
      for (const b of flock) {
        const a = (still ? 0 : t) * b.speed + b.phase;
        b.obj.position.set(
          b.center.x + Math.cos(a) * b.radius,
          b.center.y + Math.sin(a * 2.3) * 0.4,
          b.center.z + Math.sin(a * 1.3) * b.radius,
        );
        b.obj.rotation.y = -a + Math.PI / 2;
        const flap = still ? 0.4 : Math.sin(t * 18 + b.phase) * 0.9;
        b.l.rotation.z = flap;
        b.r.rotation.z = -flap;
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Click burst                                                          */
/* ------------------------------------------------------------------ */

export class SparkleBurst {
  readonly root: Points;
  private readonly positions: Float32Array;
  private readonly velocities: Float32Array;
  private readonly life: Float32Array;
  private readonly colors: Float32Array;
  private readonly material: ShaderMaterial;
  private cursor = 0;
  private static readonly COUNT = 120;

  constructor() {
    const n = SparkleBurst.COUNT;
    this.positions = new Float32Array(n * 3).fill(-999);
    this.velocities = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.colors = new Float32Array(n * 3);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(this.positions, 3).setUsage(DynamicDrawUsage));
    g.setAttribute('aColor', new BufferAttribute(this.colors, 3).setUsage(DynamicDrawUsage));
    g.setAttribute('aLife', new BufferAttribute(this.life, 1).setUsage(DynamicDrawUsage));
    this.material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uScale: { value: window.devicePixelRatio } },
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aLife;
        uniform float uScale;
        varying vec3 vColor;
        varying float vLife;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          vColor = aColor;
          vLife = aLife;
          gl_PointSize = (0.4 + aLife) * 1.8 * uScale * (220.0 / -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vLife;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float star = smoothstep(0.5, 0.0, d) + smoothstep(0.08, 0.0, min(abs(gl_PointCoord.x - 0.5), abs(gl_PointCoord.y - 0.5))) * smoothstep(0.5, 0.1, d);
          gl_FragColor = vec4(vColor * 2.0, star * vLife);
        }
      `,
    });
    this.root = new Points(g, this.material);
    this.root.frustumCulled = false;
  }

  emit(at: Vector3, color: string, amount = 28): void {
    const c = new Color(color);
    for (let k = 0; k < amount; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % SparkleBurst.COUNT;
      const a = Math.random() * Math.PI * 2;
      const up = Math.random();
      const speed = 2 + Math.random() * 4;
      this.positions.set([at.x, at.y, at.z], i * 3);
      this.velocities.set(
        [Math.cos(a) * speed * (1 - up * 0.5), 2 + up * 5, Math.sin(a) * speed * (1 - up * 0.5)],
        i * 3,
      );
      this.colors.set([c.r, c.g, c.b], i * 3);
      this.life[i] = 1;
    }
  }

  update(dt: number): void {
    let alive = false;
    for (let i = 0; i < SparkleBurst.COUNT; i++) {
      if (this.life[i] <= 0) continue;
      alive = true;
      this.life[i] = Math.max(0, this.life[i] - dt * 1.3);
      this.velocities[i * 3 + 1] -= dt * 7;
      for (let k = 0; k < 3; k++) this.positions[i * 3 + k] += this.velocities[i * 3 + k] * dt;
    }
    if (!alive) return;
    const g = this.root.geometry;
    g.getAttribute('position').needsUpdate = true;
    g.getAttribute('aLife').needsUpdate = true;
    g.getAttribute('aColor').needsUpdate = true;
  }
}

/** Ambient life: glowing motes, drifting petals and butterflies. */
export function createAmbientParticles(ctx: BuildContext): VillageObject {
  const root = new Group();
  const glow = sparkles(ctx);
  const petal = petals(ctx);
  const flies = butterflies(ctx);
  root.add(glow.points, petal.root, flies.root);
  return {
    root,
    update: (dt, t) => {
      if (!ctx.reducedMotion()) glow.material.uniforms['uTime'].value = t;
      petal.update?.(dt, t);
      flies.update?.(dt, t);
    },
  };
}
