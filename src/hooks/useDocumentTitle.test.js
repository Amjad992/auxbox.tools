import {describe, it, expect, beforeEach} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useDocumentTitle} from './useDocumentTitle';

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = 'Original';
  });

  it('sets document.title on mount when given a string', () => {
    renderHook(() => useDocumentTitle('Hello'));
    expect(document.title).toBe('Hello');
  });

  it('does NOT change document.title when given null on mount', () => {
    renderHook(() => useDocumentTitle(null));
    expect(document.title).toBe('Original');
  });

  it('updates the title when the prop changes', () => {
    const {rerender} = renderHook(({t}) => useDocumentTitle(t), {
      initialProps: {t: 'First'},
    });
    expect(document.title).toBe('First');
    rerender({t: 'Second'});
    expect(document.title).toBe('Second');
  });

  it('restores the original title when prop becomes null', () => {
    const {rerender} = renderHook(({t}) => useDocumentTitle(t), {
      initialProps: {t: 'Working'},
    });
    expect(document.title).toBe('Working');
    rerender({t: null});
    expect(document.title).toBe('Original');
  });

  it('restores the original title on unmount', () => {
    const {unmount} = renderHook(() => useDocumentTitle('Temp'));
    expect(document.title).toBe('Temp');
    unmount();
    expect(document.title).toBe('Original');
  });

  it('treats empty string like null (does not override)', () => {
    document.title = 'Original';
    renderHook(() => useDocumentTitle(''));
    expect(document.title).toBe('Original');
  });

  it('re-captures the original only once across rerenders', () => {
    // Mount with title 'A' (original captured = 'Original').
    const {rerender, unmount} = renderHook(({t}) => useDocumentTitle(t), {
      initialProps: {t: 'A'},
    });
    expect(document.title).toBe('A');
    rerender({t: 'B'});
    expect(document.title).toBe('B');
    rerender({t: null});
    // Should restore the captured-on-mount original, not 'A' or 'B'.
    expect(document.title).toBe('Original');
    unmount();
    expect(document.title).toBe('Original');
  });
});
