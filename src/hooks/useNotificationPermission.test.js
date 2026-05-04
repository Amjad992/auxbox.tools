import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {useNotificationPermission} from './useNotificationPermission';

// jsdom does not define `Notification` by default. We toggle it on/off per
// test to cover the supported / unsupported branches.

function defineNotification(stub) {
  Object.defineProperty(globalThis, 'Notification', {
    value: stub,
    configurable: true,
    writable: true,
  });
}

function deleteNotification() {
  if ('Notification' in globalThis) {
    delete globalThis.Notification;
  }
}

describe('useNotificationPermission — unsupported environment', () => {
  beforeEach(() => {
    deleteNotification();
  });

  it("reports supported=false and permission='denied' when API is missing", () => {
    const {result} = renderHook(() => useNotificationPermission());
    expect(result.current.supported).toBe(false);
    expect(result.current.permission).toBe('denied');
  });

  it('request() is a no-op that resolves with the current permission', async () => {
    const {result} = renderHook(() => useNotificationPermission());
    let resolved;
    await act(async () => {
      resolved = await result.current.request();
    });
    expect(resolved).toBe('denied');
    expect(result.current.permission).toBe('denied');
  });
});

describe('useNotificationPermission — supported environment', () => {
  let requestPermissionSpy;

  beforeEach(() => {
    requestPermissionSpy = vi.fn().mockResolvedValue('granted');
    function NotificationStub() {}
    NotificationStub.permission = 'default';
    NotificationStub.requestPermission = requestPermissionSpy;
    defineNotification(NotificationStub);
  });

  afterEach(() => {
    deleteNotification();
  });

  it("reports supported=true and reflects Notification.permission ('default')", () => {
    const {result} = renderHook(() => useNotificationPermission());
    expect(result.current.supported).toBe(true);
    expect(result.current.permission).toBe('default');
  });

  it('request() calls Notification.requestPermission and updates state on grant', async () => {
    const {result} = renderHook(() => useNotificationPermission());
    let resolved;
    await act(async () => {
      resolved = await result.current.request();
    });
    expect(requestPermissionSpy).toHaveBeenCalledTimes(1);
    expect(resolved).toBe('granted');
    expect(result.current.permission).toBe('granted');
  });

  it('request() reflects a denied result from the prompt', async () => {
    requestPermissionSpy.mockResolvedValueOnce('denied');
    const {result} = renderHook(() => useNotificationPermission());
    await act(async () => {
      await result.current.request();
    });
    expect(result.current.permission).toBe('denied');
  });

  it('falls back to current permission if requestPermission throws', async () => {
    requestPermissionSpy.mockRejectedValueOnce(new Error('user dismissed'));
    globalThis.Notification.permission = 'denied';
    const {result} = renderHook(() => useNotificationPermission());
    await act(async () => {
      await result.current.request();
    });
    expect(result.current.permission).toBe('denied');
  });

  it('initial permission already-granted is reflected on mount', () => {
    globalThis.Notification.permission = 'granted';
    const {result} = renderHook(() => useNotificationPermission());
    expect(result.current.permission).toBe('granted');
  });
});
