import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { ViewInsets, WorldStateService } from '../services/world-state.service';

let uid = 0;

/**
 * Reports how much of the screen an overlay covers on one side, so the 3D camera can keep
 * the village centred in the visible area (e.g. left of an open panel, above the board).
 */
@Directive({ selector: '[appViewInset]' })
export class ViewInset {
  readonly appViewInset = input.required<keyof ViewInsets>();

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const state = inject(WorldStateService);
    const key = `inset-${++uid}`;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || getComputedStyle(el).position !== 'fixed') {
        state.setInsets(key, null);
        return;
      }
      const side = this.appViewInset();
      const value = {
        top: rect.bottom,
        bottom: window.innerHeight - rect.top,
        left: rect.right,
        right: window.innerWidth - rect.left,
      }[side];
      state.setInsets(key, { [side]: Math.max(0, value) });
    };

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    afterNextRender(() => {
      observer?.observe(el);
      measure();
    });
    window.addEventListener('resize', measure);
    inject(DestroyRef).onDestroy(() => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      state.setInsets(key, null);
    });
  }
}
