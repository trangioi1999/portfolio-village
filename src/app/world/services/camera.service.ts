import { Injectable } from '@angular/core';
import gsap from 'gsap';
import { MOUSE, PerspectiveCamera, TOUCH, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VIEW_AZIMUTH } from '../../data/buildings.data';
import { Building } from '../../models/building.model';
import { ViewInsets } from '../../services/world-state.service';

const OVERVIEW_TARGET = new Vector3(0, 3, -6.5);
const POLAR = 0.98; // ~56° from vertical → slightly elevated isometric feel
const MAX_TARGET_RADIUS = 27;

/**
 * Isometric-style perspective camera with limited orbit, pan and zoom.
 * Keeps the village centred in the area not covered by HTML overlays (view offset).
 */
@Injectable()
export class CameraService {
  camera!: PerspectiveCamera;
  controls!: OrbitControls;

  private width = 1;
  private height = 1;
  private insets: ViewInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  private readonly offset = { x: 0, y: 0 };
  private tween: gsap.core.Timeline | null = null;

  init(dom: HTMLElement, width: number, height: number): void {
    this.camera = new PerspectiveCamera(30, width / height, 1, 1400);
    this.controls = new OrbitControls(this.camera, dom);
    const c = this.controls;
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.screenSpacePanning = false;
    c.minDistance = 14;
    c.maxDistance = 210;
    c.minPolarAngle = 0.45;
    c.maxPolarAngle = 1.2;
    c.minAzimuthAngle = VIEW_AZIMUTH - 1.05;
    c.maxAzimuthAngle = VIEW_AZIMUTH + 1.05;
    c.zoomSpeed = 0.8;
    c.panSpeed = 0.9;
    c.rotateSpeed = 0.5;
    c.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE };
    c.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_ROTATE };
    this.resize(width, height);
    this.overview(true);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.fov = width < height ? 42 : 30;
    this.applyViewOffset();
  }

  setInsets(insets: ViewInsets): void {
    this.insets = insets;
  }

  /**
   * Distance that frames the island across the visible (non-covered) width, like the concept
   * art: the village fills the view and the front rim may tuck under the bottom board.
   */
  private overviewDistance(): number {
    const freeW = Math.max(160, this.width - this.insets.left - this.insets.right);
    const freeH = Math.max(160, this.height - this.insets.top - this.insets.bottom);
    const tan = Math.tan((this.camera.fov * Math.PI) / 360);
    const portrait = freeW < freeH;
    const fitWidth = portrait ? 50 : 60;
    const byWidth = (fitWidth * this.height) / (2 * tan * freeW);
    // Never so close that the tower leaves a short visible area.
    const byHeight = (30 * this.height) / (2 * tan * freeH);
    return Math.min(170, Math.max(byWidth, byHeight));
  }

  overview(instant = false, duration = 1.5): void {
    this.flyTo(OVERVIEW_TARGET, this.overviewDistance(), VIEW_AZIMUTH, instant, duration);
  }

  /** Dramatic starting pose for the intro flight: high above, swung around the island. */
  introPose(): void {
    this.flyTo(new Vector3(0, 0, -6), 190, VIEW_AZIMUTH - 0.9, true, 0, 0.35);
  }

  focus(building: Building, instant = false, duration = 1.5): void {
    const [x, z] = building.position;
    const target = new Vector3(x, building.labelHeight * 0.32, z);
    this.flyTo(target, building.focusDistance, VIEW_AZIMUTH + x * 0.004, instant, duration);
  }

  private flyTo(
    target: Vector3,
    distance: number,
    azimuth: number,
    instant: boolean,
    duration = 1.5,
    polar = POLAR,
  ): void {
    const dir = new Vector3(
      Math.sin(polar) * Math.sin(azimuth),
      Math.cos(polar),
      Math.sin(polar) * Math.cos(azimuth),
    );
    const position = target.clone().addScaledVector(dir, distance);
    this.tween?.kill();
    if (instant) {
      this.controls.target.copy(target);
      this.camera.position.copy(position);
      this.controls.update();
      return;
    }
    this.controls.enabled = false;
    const tl = gsap.timeline({
      defaults: { duration, ease: duration > 2 ? 'power3.inOut' : 'power2.inOut' },
      onUpdate: () => this.camera.lookAt(this.controls.target),
      onComplete: () => {
        this.controls.enabled = true;
        this.controls.update();
      },
    });
    tl.to(this.controls.target, { x: target.x, y: target.y, z: target.z }, 0);
    tl.to(this.camera.position, { x: position.x, y: position.y, z: position.z }, 0);
    this.tween = tl;
  }

  update(dt: number): void {
    if (this.controls.enabled) {
      this.controls.update(dt);
      // Keep panning on the island.
      const t = this.controls.target;
      const r = Math.hypot(t.x, t.z);
      if (r > MAX_TARGET_RADIUS) {
        const k = MAX_TARGET_RADIUS / r;
        const dx = t.x * k - t.x;
        const dz = t.z * k - t.z;
        t.x += dx;
        t.z += dz;
        this.camera.position.x += dx;
        this.camera.position.z += dz;
      }
      t.y = Math.min(Math.max(t.y, 0), 8);
    }
    // Ease the view offset toward the current overlay insets.
    const goalX = (this.insets.left - this.insets.right) / 2;
    const goalY = (this.insets.top - this.insets.bottom) / 2;
    const k = Math.min(1, dt * 5);
    this.offset.x += (goalX - this.offset.x) * k;
    this.offset.y += (goalY - this.offset.y) * k;
    this.applyViewOffset();
  }

  private applyViewOffset(): void {
    // Shift the projection so the scene centre sits in the middle of the free area.
    this.camera.setViewOffset(
      this.width,
      this.height,
      -this.offset.x,
      -this.offset.y,
      this.width,
      this.height,
    );
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.tween?.kill();
    this.controls?.dispose();
  }
}
