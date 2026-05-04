// Shared markdown rendering pipeline. Used by Markdown Preview today;
// Markdown -> PDF will consume the same helper next.
//
// Two non-negotiables:
//   1. Output is always run through DOMPurify before being returned.
//      Markdown can carry raw HTML; rendering unsanitized is an XSS hole.
//   2. The DOMPurify allowlist is left at defaults. Don't customise without
//      a documented reason — the safest default is the maintained one.

import {marked} from 'marked';
import DOMPurify from 'dompurify';

const MARKED_DEFAULTS = {
  gfm: true,
  breaks: false,
  // langPrefix lets future syntax-highlight CSS hook into fenced code.
  langPrefix: 'language-',
};

/**
 * Render a markdown source string to a sanitized HTML string.
 *
 * @param {string} src - Markdown source.
 * @param {object} [options] - Optional overrides forwarded to `marked.parse`.
 * @returns {string} Sanitized HTML.
 *
 * @remarks Browser-only. Uses `DOMPurify.sanitize` which requires a DOM.
 * Server-side callers (RSC, route handlers, build-time) must polyfill via
 * `jsdom` before calling this. The current consumer is a `'use client'`
 * page, so this is fine; future consumers should check.
 */
export function renderMarkdown(src, options) {
  if (typeof src !== 'string' || src.length === 0) return '';
  const html = marked.parse(src, {...MARKED_DEFAULTS, ...(options || {})});
  return DOMPurify.sanitize(html);
}
