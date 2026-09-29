import { Injectable, signal } from '@angular/core';
import { Camera, Object3D, Plane, Raycaster, Vector2, Vector3 } from 'three';

const CLICK_TOLERANCE_PX = 9;
const GROUND = new Plane(new Vector3(0, 1, 0), 0);

/**
 * Pointer interaction with the 3D scene: hover detection (raycast once per frame at most)
 * and click/tap detection that ignores drags used for panning/orbiting.
 * Objects are identified through `userData.owner` on any ancestor.
 */
@Injectable()
export class InteractionService {
  /** Owner id under the pointer, e.g. `building:career`, `avatar`, `spirit:bit`. */
  readonly hovered = signal<string | null>(null);
  onSelect: (owner: string) => void = () => undefined;
  /** Click/tap on empty ground (world x/z). */
  onGround: (x: number, z: number) => void = () => undefined;

  private readonly raycaster = new Raycaster();
  private readonly hit = new Vector3();
  private readonly ndc = new Vector2();
  private dom!: HTMLElement;
  private camera!: Camera;
  private targets: Object3D[] = [];
  private dirty = false;
  private inside = false;
  private down: { x: number; y: number; time: number } | null = null;
  private readonly listeners: [string, EventListener][] = [];

  init(dom: HTMLElement, camera: Camera, targets: Object3D[]): void {
    this.dom = dom;
    this.camera = camera;
    this.targets = targets;
    this.listen('pointermove', (e) => this.onMove(e as PointerEvent));
    this.listen('pointerdown', (e) => this.onDown(e as PointerEvent));
    this.listen('pointerup', (e) => this.onUp(e as PointerEvent));
    this.listen('pointerleave', () => {
      this.inside = false;
      this.setHovered(null);
    });
  }

  /** Call once per frame. */
  update(): void {
    if (!this.dirty || !this.inside) return;
    this.dirty = false;
    this.setHovered(this.pick());
  }

  private listen(type: string, fn: EventListener): void {
    this.dom.addEventListener(type, fn);
    this.listeners.push([type, fn]);
  }

  private setNdc(e: PointerEvent): void {
    const rect = this.dom.getBoundingClientRect();
    this.ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  private onMove(e: PointerEvent): void {
    if (e.pointerType === 'touch') return;
    this.inside = true;
    this.setNdc(e);
    this.dirty = true;
  }

  private onDown(e: PointerEvent): void {
    this.down = { x: e.clientX, y: e.clientY, time: performance.now() };
  }

  private onUp(e: PointerEvent): void {
    const d = this.down;
    this.down = null;
    if (!d || e.button > 0) return;
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (moved > CLICK_TOLERANCE_PX || performance.now() - d.time > 900) return;
    this.setNdc(e);
    const owner = this.pick();
    if (owner) {
      this.onSelect(owner);
      return;
    }
    // Nothing clickable under the pointer: report where the ray meets the (flat) ground.
    const ground = this.raycaster.ray.intersectPlane(GROUND, this.hit);
    if (ground) this.onGround(ground.x, ground.z);
  }

  private pick(): string | null {
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.targets, true);
    for (const hit of hits) {
      for (let o: Object3D | null = hit.object; o; o = o.parent) {
        const owner = o.userData['owner'] as string | undefined;
        if (owner) return owner;
      }
    }
    return null;
  }

  private setHovered(owner: string | null): void {
    if (owner === this.hovered()) return;
    this.hovered.set(owner);
    this.dom.style.cursor = owner ? 'pointer' : '';
  }

  dispose(): void {
    for (const [type, fn] of this.listeners) this.dom?.removeEventListener(type, fn);
    this.listeners.length = 0;
  }
}
