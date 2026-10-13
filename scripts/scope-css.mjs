// Confines a whole stylesheet to one element so the village can share a page
// with a host site without either restyling the other.
const GLOBAL_SELECTOR = /^(:root|:host|html|body)(?![\w-])/;

/** `html.classic-view body` -> `.x.classic-view`, `.btn` -> `.x .btn`. */
export function scopeSelector(selector, scope) {
  const trimmed = selector.trim();
  if (trimmed.startsWith(scope)) return trimmed;
  const global = GLOBAL_SELECTOR.exec(trimmed);
  if (global) {
    // `html.foo body .bar` -> `.x.foo .bar`: html and body both become the scope.
    const rest = trimmed
      .slice(global[0].length)
      .replace(/^((?:[.:[][^\s]*)?)\s*body(?![\w-])/, '$1');
    return scope + rest;
  }
  return `${scope} ${trimmed}`;
}

/** PostCSS plugin; viewport units become container units of the scope. */
export function scopeCss(scope) {
  const seen = new WeakSet();
  return {
    postcssPlugin: 'village-scope-css',
    Rule(rule) {
      if (seen.has(rule)) return;
      seen.add(rule);
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      rule.selectors = [...new Set(rule.selectors.map((s) => scopeSelector(s, scope)))];
    },
    Declaration(decl) {
      decl.value = decl.value
        .replace(/(\d*\.?\d+)[dsl]?vh\b/g, '$1cqh')
        .replace(/(\d*\.?\d+)[dsl]?vw\b/g, '$1cqw');
    },
  };
}
scopeCss.postcss = true;
