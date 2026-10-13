// Builds the embeddable village (src/embed.ts) and publishes it next to the
// standalone app, so one deployment serves both:
//
//   dist/portfolio-village/browser/              standalone app
//   dist/portfolio-village/browser/embed/mount.js  module for host pages
//
// Run after `ng build` (npm run build does both).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import postcss from 'postcss';
import { scopeCss } from './scope-css.mjs';

const root = resolve(import.meta.dirname, '..');
const built = join(root, 'dist', 'embed', 'browser');
const target = join(root, 'dist', 'portfolio-village', 'browser', 'embed');

if (!existsSync(join(root, 'dist', 'portfolio-village', 'browser', 'index.html'))) {
  console.error('Build the standalone app first: npx ng build');
  process.exit(1);
}

execFileSync(
  process.execPath,
  [
    join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js'),
    'build',
    '--configuration',
    'embed',
  ],
  {
    cwd: root,
    stdio: 'inherit',
  },
);

const cssFile = join(built, 'village.css');
const { css } = await postcss([scopeCss('.village-root')]).process(readFileSync(cssFile, 'utf8'), {
  from: cssFile,
});
writeFileSync(cssFile, css);
// A stable entry name; main.js keeps Angular's chunk graph untouched.
writeFileSync(join(built, 'mount.js'), "export { mount } from './main.js';\n");

rmSync(target, { recursive: true, force: true });
cpSync(built, target, { recursive: true });
console.log(`Embed module ready: ${join(target, 'mount.js')}`);
