import {describe, it, expect, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useKeyboardShortcuts} from './useKeyboardShortcuts';

function dispatchKey(opts) {
  const event = new KeyboardEvent('keydown', {bubbles: true, cancelable: true, ...opts});
  // KeyboardEvent target defaults to body; override via redefine if needed.
  if (opts.target) {
    Object.defineProperty(event, 'target', {value: opts.target, configurable: true});
  }
  window.dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcuts', () => {
  it('fires the matching handler', () => {
    const h = vi.fn();
    renderHook(() => useKeyboardShortcuts([{key: 'a', handler: h}]));
    dispatchKey({key: 'A'});
    expect(h).toHaveBeenCalledTimes(1);
  });

  it('matches Space via either code or key', () => {
    const h = vi.fn();
    renderHook(() => useKeyboardShortcuts([{key: 'Space', handler: h}]));
    dispatchKey({key: ' ', code: 'Space'});
    expect(h).toHaveBeenCalledTimes(1);
  });

  it('skips when modifiers are pressed by default', () => {
    const h = vi.fn();
    renderHook(() => useKeyboardShortcuts([{key: 'a', handler: h}]));
    dispatchKey({key: 'a', metaKey: true});
    dispatchKey({key: 'a', ctrlKey: true});
    dispatchKey({key: 'a', altKey: true});
    expect(h).not.toHaveBeenCalled();
  });

  it('skips when the target is a form field by default', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const h = vi.fn();
    renderHook(() => useKeyboardShortcuts([{key: 'a', handler: h}]));
    dispatchKey({key: 'a', target: input});
    expect(h).not.toHaveBeenCalled();
    input.remove();
  });

  it('respects the when predicate', () => {
    const h = vi.fn();
    let allowed = false;
    renderHook(() =>
      useKeyboardShortcuts([{key: 'a', handler: h, when: () => allowed}])
    );
    dispatchKey({key: 'a'});
    expect(h).not.toHaveBeenCalled();
    allowed = true;
    dispatchKey({key: 'a'});
    expect(h).toHaveBeenCalledTimes(1);
  });

  it('preventDefault defaults to true', () => {
    const h = vi.fn();
    renderHook(() => useKeyboardShortcuts([{key: 'a', handler: h}]));
    const e = dispatchKey({key: 'a'});
    expect(e.defaultPrevented).toBe(true);
  });

  it('preventDefault: false leaves the event alone', () => {
    const h = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{key: 'a', handler: h, preventDefault: false}])
    );
    const e = dispatchKey({key: 'a'});
    expect(e.defaultPrevented).toBe(false);
  });

  it('reads latest shortcuts without re-subscribing', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const {rerender} = renderHook(
      ({shortcuts}) => useKeyboardShortcuts(shortcuts),
      {initialProps: {shortcuts: [{key: 'a', handler: h1}]}}
    );
    dispatchKey({key: 'a'});
    expect(h1).toHaveBeenCalledTimes(1);
    rerender({shortcuts: [{key: 'a', handler: h2}]});
    dispatchKey({key: 'a'});
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});
