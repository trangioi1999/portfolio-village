import assert from 'node:assert/strict';
import { test } from 'node:test';
import postcss from 'postcss';
import { scopeCss, scopeSelector } from './scope-css.mjs';

test('maps document selectors onto the scope element', () => {
  assert.equal(scopeSelector('html', '.v'), '.v');
  assert.equal(scopeSelector('html.classic-view body', '.v'), '.v.classic-view');
  assert.equal(scopeSelector('html.reduce-motion *', '.v'), '.v.reduce-motion *');
  assert.equal(
    scopeSelector('html:not(.motion-full) .animate-float', '.v'),
    '.v:not(.motion-full) .animate-float',
  );
  assert.equal(scopeSelector('.btn', '.v'), '.v .btn');
});

test('rewrites viewport units to container units', async () => {
  const { css } = await postcss([scopeCss('.v')]).process(
    '.h { height: 100dvh; width: calc(100vw - 2rem) }',
    {
      from: undefined,
    },
  );
  assert.equal(css, '.v .h { height: 100cqh; width: calc(100cqw - 2rem) }');
});
