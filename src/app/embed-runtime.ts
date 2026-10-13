/**
 * Standalone (its own deployment, the default) or embedded in a host page
 * through `mount()` (src/embed.ts), e.g. TG Labs at /apps/village.
 *
 * Embedded, files from `public/` come from the village's deployment rather
 * than the host page's base URL, and view-mode classes go on the village's
 * root element instead of the host's <html>.
 */
interface EmbedRuntime {
  assetBase: string;
  root: HTMLElement | null;
}

const runtime: EmbedRuntime = { assetBase: '', root: null };

export function configureEmbed(assetBase: string, root: HTMLElement | null): void {
  runtime.assetBase = assetBase && !assetBase.endsWith('/') ? `${assetBase}/` : assetBase;
  runtime.root = root;
}

/** URL of a file shipped in `public/`, wherever the village is served from. */
export function assetUrl(path: string): string {
  return /^(https?:|data:|blob:|\/)/.test(path) ? path : `${runtime.assetBase}${path}`;
}

/** Element that carries the view-mode classes (`classic-view`, `reduce-motion`…). */
export function classRoot(): HTMLElement {
  return runtime.root ?? document.documentElement;
}
