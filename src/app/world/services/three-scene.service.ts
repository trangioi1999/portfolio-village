import { Injectable } from '@angular/core';
import {
  ACESFilmicToneMapping,
  Camera,
  Vector2,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  PCFShadowMap,
  SRGBColorSpace,
  Scene,
  Timer,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RenderQuality } from '../../services/world-state.service';

/** Painterly colour grade: saturation, warm highlights, soft vignette (linear space). */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSaturation: { value: 1.22 },
    uWarmth: { value: 0.06 },
    uVignette: { value: 0.32 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uSaturation;
    uniform float uWarmth;
    uniform float uVignette;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = mix(vec3(l), c.rgb, uSaturation);
      c.rgb += vec3(uWarmth, uWarmth * 0.45, -uWarmth * 0.35) * smoothstep(0.2, 1.2, l);
      float d = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - uVignette * smoothstep(0.45, 0.95, d);
      gl_FragColor = c;
    }
  `,
};
import { FOG_COLOR } from '../objects/sky';
import { Updater } from '../utils/types';

/**
 * Owns the renderer, scene, lights and the animation loop.
 * Provided per world component so everything is torn down with it.
 */
@Injectable()
export class ThreeSceneService {
  readonly scene = new Scene();
  renderer!: WebGLRenderer;
  sun!: DirectionalLight;

  private readonly timer = new Timer();
  private readonly updaters = new Set<Updater>();
  private renderFn: (() => void) | null = null;
  private paused = false;
  private maxPixelRatio = 2;
  private frameTimes: number[] = [];
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private renderPass: RenderPass | null = null;
  private adaptiveDone = false;

  init(canvas: HTMLCanvasElement, quality: RenderQuality): void {
    this.maxPixelRatio = quality === 'high' ? 2 : 1.5;
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: quality === 'high' || window.devicePixelRatio < 2,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.maxPixelRatio));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;

    this.scene.background = new Color(FOG_COLOR);
    this.scene.fog = new Fog(FOG_COLOR, 150, 520);

    const hemi = new HemisphereLight('#e6f4ff', '#8fb05a', 1.35);
    this.scene.add(hemi);

    this.sun = new DirectionalLight('#ffe7c2', 2.9);
    this.sun.position.set(-30, 44, 26);
    this.sun.castShadow = true;
    const size = quality === 'high' ? 2048 : 1024;
    this.sun.shadow.mapSize.set(size, size);
    const cam = this.sun.shadow.camera;
    cam.left = -36;
    cam.right = 36;
    cam.top = 36;
    cam.bottom = -36;
    cam.near = 1;
    cam.far = 120;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.timer.connect(document);
  }

  /** Bloom + colour grade on capable devices; plain rendering elsewhere. */
  setupPost(camera: Camera, quality: RenderQuality): void {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, camera);
    this.composer.addPass(this.renderPass);
    if (quality === 'high') {
      const size = this.renderer.getSize(new Vector2());
      this.bloom = new UnrealBloomPass(new Vector2(size.x / 2, size.y / 2), 0.38, 0.45, 2.2);
      this.composer.addPass(this.bloom);
    }
    this.composer.addPass(new ShaderPass(GradeShader));
    this.composer.addPass(new OutputPass());
  }

  render(camera: Camera): void {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, camera);
  }

  onTick(fn: Updater): () => void {
    this.updaters.add(fn);
    return () => this.updaters.delete(fn);
  }

  start(render: () => void): void {
    this.renderFn = render;
    this.renderer.setAnimationLoop((time) => this.frame(time));
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    this.composer?.setPixelRatio(this.renderer.getPixelRatio());
    this.composer?.setSize(width, height);
  }

  private frame(time: number): void {
    this.timer.update(time);
    if (this.paused) return;
    const dt = Math.min(this.timer.getDelta(), 0.1);
    const elapsed = this.timer.getElapsed();
    for (const fn of this.updaters) fn(dt, elapsed);
    this.renderFn?.();
    this.adapt(dt);
  }

  /** Lower the pixel ratio (then shadows) if the first seconds run slowly. */
  private adapt(dt: number): void {
    if (this.adaptiveDone) return;
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    if (avg <= 1 / 40) {
      this.adaptiveDone = true;
      return;
    }
    const ratio = this.renderer.getPixelRatio();
    if (ratio > 1) {
      // setPixelRatio resizes the drawing buffer internally.
      this.renderer.setPixelRatio(Math.max(1, ratio - 0.5));
      this.composer?.setPixelRatio(this.renderer.getPixelRatio());
    } else if (this.bloom) {
      this.composer?.removePass(this.bloom);
      this.bloom.dispose();
      this.bloom = null;
    } else if (this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.enabled = false;
      this.scene.traverse((o) => {
        const mesh = o as Mesh;
        if (mesh.isMesh && !Array.isArray(mesh.material)) mesh.material.needsUpdate = true;
      });
      this.adaptiveDone = true;
    } else {
      this.adaptiveDone = true;
    }
  }

  dispose(): void {
    this.renderer?.setAnimationLoop(null);
    this.bloom?.dispose();
    this.composer?.dispose();
    this.timer.dispose();
    this.updaters.clear();
    this.renderer?.dispose();
  }
}
