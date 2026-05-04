import {describe, it, expect} from 'vitest';
import {renderMarkdown} from './markdown';

describe('renderMarkdown — GFM rendering', () => {
  it('returns an empty string for empty / non-string input', () => {
    expect(renderMarkdown('')).toBe('');
    expect(renderMarkdown(null)).toBe('');
    expect(renderMarkdown(undefined)).toBe('');
  });

  it('renders headings', () => {
    const html = renderMarkdown('# Hello\n## World');
    expect(html).toMatch(/<h1[^>]*>Hello<\/h1>/);
    expect(html).toMatch(/<h2[^>]*>World<\/h2>/);
  });

  it('renders unordered and ordered lists', () => {
    const ul = renderMarkdown('- one\n- two\n- three');
    expect(ul).toMatch(/<ul>/);
    expect(ul).toMatch(/<li>one<\/li>/);

    const ol = renderMarkdown('1. first\n2. second');
    expect(ol).toMatch(/<ol[^>]*>/);
    expect(ol).toMatch(/<li>first<\/li>/);
  });

  it('renders GFM tables', () => {
    const md = '| h1 | h2 |\n|----|----|\n| a  | b  |';
    const html = renderMarkdown(md);
    expect(html).toMatch(/<table>/);
    expect(html).toMatch(/<th>h1<\/th>/);
    expect(html).toMatch(/<td>a<\/td>/);
  });

  it('renders GFM task lists with checkbox inputs', () => {
    const html = renderMarkdown('- [x] done\n- [ ] todo');
    // marked emits <input type="checkbox" disabled ...>; DOMPurify keeps it.
    expect(html).toMatch(/<input[^>]+type="checkbox"/);
    expect(html).toMatch(/checked/);
  });

  it('renders fenced code blocks with a language- class', () => {
    const html = renderMarkdown('```js\nconst x = 1;\n```');
    expect(html).toMatch(/<pre>/);
    expect(html).toMatch(/<code class="language-js">/);
    expect(html).toMatch(/const x = 1;/);
  });

  it('renders blockquotes', () => {
    const html = renderMarkdown('> quoted');
    expect(html).toMatch(/<blockquote>/);
    expect(html).toMatch(/quoted/);
  });

  it('renders inline links and images', () => {
    const linkHtml = renderMarkdown('[example](https://example.com)');
    expect(linkHtml).toMatch(/<a [^>]*href="https:\/\/example\.com"/);

    const imgHtml = renderMarkdown('![alt text](https://example.com/x.png)');
    expect(imgHtml).toMatch(/<img [^>]*src="https:\/\/example\.com\/x\.png"/);
    expect(imgHtml).toMatch(/alt="alt text"/);
  });
});

describe('renderMarkdown — sanitization (XSS)', () => {
  it('strips raw <script> tags', () => {
    const html = renderMarkdown('<script>alert(1)</script>');
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toContain('alert(1)');
  });

  it('strips inline event handlers (onerror)', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toMatch(/onerror/i);
    expect(html).not.toContain('alert(1)');
  });

  it('neuters javascript: URLs in links', () => {
    const html = renderMarkdown('[click](javascript:alert(1))');
    // DOMPurify removes the dangerous href attribute (or the whole anchor).
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toContain('alert(1)');
  });

  it('strips <iframe> tags', () => {
    const html = renderMarkdown('<iframe src="https://evil.example"></iframe>');
    expect(html).not.toMatch(/<iframe/i);
  });

  it('strips <style> tags', () => {
    const html = renderMarkdown('<style>body{display:none}</style>hello');
    expect(html).not.toMatch(/<style/i);
    expect(html).toContain('hello');
  });
});
