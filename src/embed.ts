import { APP_BASE_HREF } from '@angular/common';
import { type ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { configureEmbed } from './app/embed-runtime';

/**
 * Embed contract v1 (see tg-labs-mfe/libs/embed-contract):
 *   mount(element, { basePath, assetBase, theme }) -> { update, unmount }
 *
 * The village boots as its own Angular application inside `element`, so it
 * never has to match the host page's framework or Angular version. Its
 * stylesheet (village.css, scoped to .village-root at build time) is loaded
 * from next to this module. The village keeps its own look, so the theme is
 * ignored.
 */
export interface MountOptions {
  basePath: string;
  assetBase: string;
  theme: { mode: 'light' | 'dark'; accent: string };
}

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&family=Patrick+Hand&display=swap';

function stylesheet(href: string): Promise<HTMLLinkElement> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Could not load ${href}`));
    document.head.append(link);
  });
}

export async function mount(element: HTMLElement, options: MountOptions) {
  const container = document.createElement('div');
  container.className = 'village-root';
  // A containing block for the village's fixed overlays, and a size
  // container: the build rewrites 100dvh/100vw to 100cqh/100cqw.
  container.style.cssText =
    'position:relative;height:100%;overflow:hidden;contain:layout paint;container-type:size';
  element.append(container);
  configureEmbed(options.assetBase, container);

  const links: HTMLLinkElement[] = [];
  if (!document.querySelector(`link[href="${FONTS_HREF}"]`)) {
    void stylesheet(FONTS_HREF).then(
      (link) => links.push(link),
      () => undefined,
    );
  }
  links.push(await stylesheet(new URL('village.css', import.meta.url).href));

  const basePath = options.basePath.endsWith('/') ? options.basePath : `${options.basePath}/`;
  let appRef: ApplicationRef | null = await createApplication({
    providers: [
      provideZonelessChangeDetection(),
      { provide: APP_BASE_HREF, useValue: basePath },
      provideRouter(
        routes,
        withComponentInputBinding(),
        withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      ),
    ],
  });
  const host = document.createElement('app-root');
  container.append(host);
  appRef.bootstrap(App, host);

  return {
    unmount() {
      appRef?.destroy();
      appRef = null;
      configureEmbed('', null);
      container.remove();
      links.forEach((link) => link.remove());
    },
  };
}
