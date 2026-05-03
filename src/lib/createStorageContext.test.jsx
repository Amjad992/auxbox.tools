import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, act, renderHook } from '@testing-library/react';
import { createStorageContext } from './createStorageContext';

function makeContext({ getDefault } = {}) {
  return createStorageContext({
    version: '1.0.0',
    entries: [
      {
        name: 'foo',
        key: 'test_foo',
        validate: (d) => d && typeof d.value === 'number',
        getDefault,
      },
    ],
  });
}

function wrap(Provider) {
  // eslint-disable-next-line react/prop-types
  return function Wrapper({ children }) {
    return <Provider>{children}</Provider>;
  };
}

describe('createStorageContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('exposes load/save/clear wrappers per entry name', () => {
    const { Provider, useStorage } = makeContext();
    const { result } = renderHook(() => useStorage(), {
      wrapper: wrap(Provider),
    });
    expect(typeof result.current.loadFoo).toBe('function');
    expect(typeof result.current.saveFoo).toBe('function');
    expect(typeof result.current.clearFoo).toBe('function');
    expect(result.current.hasSavedData.foo).toBe(false);
    expect(result.current.storageErrors.foo).toBeNull();
  });

  it('throws when useStorage is called outside its Provider', () => {
    const { useStorage } = makeContext();
    expect(() => renderHook(() => useStorage())).toThrow(
      /must be used within its StorageProvider/
    );
  });

  it('save then load round-trips and flips hasSavedData', () => {
    const { Provider, useStorage } = makeContext();
    const { result } = renderHook(() => useStorage(), {
      wrapper: wrap(Provider),
    });

    act(() => {
      result.current.saveFoo({ value: 42 });
    });
    expect(result.current.hasSavedData.foo).toBe(true);

    let loaded;
    act(() => {
      loaded = result.current.loadFoo();
    });
    expect(loaded).toEqual({ value: 42 });
  });

  it('save returning getDefault clears storage instead of writing', () => {
    const defaults = { value: 0 };
    const { Provider, useStorage } = makeContext({
      getDefault: () => defaults,
    });
    const { result } = renderHook(() => useStorage(), {
      wrapper: wrap(Provider),
    });

    act(() => {
      result.current.saveFoo(defaults);
    });

    expect(window.localStorage.getItem('test_foo')).toBeNull();
    expect(result.current.hasSavedData.foo).toBe(false);
  });

  it('load surfaces a storage error when stored data fails the validator', () => {
    window.localStorage.setItem(
      'test_foo',
      JSON.stringify({ version: '1.0.0', timestamp: 0, data: { wrong: true } })
    );

    const { Provider, useStorage } = makeContext();
    const { result } = renderHook(() => useStorage(), {
      wrapper: wrap(Provider),
    });

    let r;
    act(() => {
      r = result.current.loadFoo();
    });
    expect(r).toBeNull();
    expect(result.current.storageErrors.foo).toMatch(/Failed to load/);
    expect(result.current.hasSavedData.foo).toBe(false);
  });

  it('clear removes saved state and resets flags', () => {
    const { Provider, useStorage } = makeContext();
    const { result } = renderHook(() => useStorage(), {
      wrapper: wrap(Provider),
    });

    act(() => {
      result.current.saveFoo({ value: 1 });
    });
    expect(result.current.hasSavedData.foo).toBe(true);

    act(() => {
      result.current.clearFoo();
    });
    expect(result.current.hasSavedData.foo).toBe(false);
    expect(window.localStorage.getItem('test_foo')).toBeNull();
  });

  it('save surfaces a storage error when underlying setItem throws', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceeded');
    };

    try {
      const { Provider, useStorage } = makeContext();
      const { result } = renderHook(() => useStorage(), {
        wrapper: wrap(Provider),
      });

      act(() => {
        const ok = result.current.saveFoo({ value: 1 });
        expect(ok).toBe(false);
      });
      expect(result.current.storageErrors.foo).toMatch(/Quota|Failed to save/);
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it('renders children inside the Provider', () => {
    const { Provider } = makeContext();
    const { getByText } = render(
      <Provider>
        <span>hello</span>
      </Provider>
    );
    expect(getByText('hello')).toBeInTheDocument();
  });
});
