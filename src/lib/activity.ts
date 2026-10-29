import { browser } from '$app/environment';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'] as const;

export type ActivityState = {
  /** Whether the user is currently considered active */
  readonly isActive: boolean;
  /** Subscribe to activity state changes */
  subscribe: (fn: (isActive: boolean) => void) => () => void;
  /** Cleanup all listeners */
  destroy: () => void;
};

export type ActivityOptions = {
  /** Time in milliseconds before user is considered idle (default: 2 minutes) */
  idleTimeoutMs?: number;
  /** Whether to also consider tab visibility (default: true) */
  trackVisibility?: boolean;
};

/**
 * Creates a global user activity detector that tracks mouse, keyboard, scroll, and touch events.
 * User is considered idle after no activity for the specified timeout.
 * When trackVisibility is true (default), hidden tabs are always considered inactive.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createActivityDetector } from '$lib/activity';
 *
 *   const activity = createActivityDetector({ idleTimeoutMs: 60_000 });
 *   let isActive = $state(activity.isActive);
 *
 *   $effect(() => {
 *     const unsubscribe = activity.subscribe((active) => (isActive = active));
 *     return () => {
 *       unsubscribe();
 *       activity.destroy();
 *     };
 *   });
 * </script>
 *
 * {#if isActive}
 *   <p>User is active</p>
 * {:else}
 *   <p>User is idle</p>
 * {/if}
 * ```
 */
export function createActivityDetector(options: ActivityOptions = {}): ActivityState {
  const { idleTimeoutMs = 2 * 60 * 1000, trackVisibility = true } = options;

  if (!browser) {
    return {
      get isActive() {
        return true;
      },
      subscribe: () => () => {},
      destroy: () => {}
    };
  }

  let isActive = true;
  let isTabVisible = document.visibilityState === 'visible';
  let isWindowFocused = document.hasFocus();
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<(isActive: boolean) => void>();

  function isVisible() {
    return isTabVisible && isWindowFocused;
  }

  function notify() {
    const active = trackVisibility ? isActive && isVisible() : isActive;
    listeners.forEach((fn) => fn(active));
  }

  function setActive(active: boolean) {
    if (isActive !== active) {
      isActive = active;
      notify();
    }
  }

  function resetIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    setActive(true);
    idleTimer = setTimeout(() => {
      setActive(false);
    }, idleTimeoutMs);
  }

  function handleVisibilityChange() {
    const wasVisible = isVisible();
    isTabVisible = document.visibilityState === 'visible';

    if (isVisible() && !wasVisible) {
      // Became visible - reset idle timer and notify
      resetIdleTimer();
      notify();
    } else if (!isVisible() && wasVisible) {
      // Became hidden - notify listeners
      notify();
    }
  }

  function handleWindowFocus() {
    const wasVisible = isVisible();
    isWindowFocused = true;

    if (isVisible() && !wasVisible) {
      resetIdleTimer();
      notify();
    }
  }

  function handleWindowBlur() {
    const wasVisible = isVisible();
    isWindowFocused = false;

    if (!isVisible() && wasVisible) {
      notify();
    }
  }

  // Register activity event listeners
  for (const event of ACTIVITY_EVENTS) {
    document.addEventListener(event, resetIdleTimer, { passive: true });
  }

  if (trackVisibility) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
  }

  // Start idle timer
  resetIdleTimer();

  return {
    get isActive() {
      return trackVisibility ? isActive && isVisible() : isActive;
    },
    subscribe(fn: (isActive: boolean) => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    destroy() {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, resetIdleTimer);
      }
      if (trackVisibility) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('blur', handleWindowBlur);
      }
      listeners.clear();
    }
  };
}

// Singleton instance for shared global activity tracking
let globalActivityDetector: ActivityState | null = null;

/**
 * Gets or creates a shared global activity detector singleton.
 * Use this when multiple components need to share the same activity state.
 *
 * @example
 * ```svelte
 * <script>
 *   import { getGlobalActivityDetector } from '$lib/activity';
 *
 *   const activity = getGlobalActivityDetector();
 *   let isActive = $state(activity.isActive);
 *
 *   $effect(() => {
 *     return activity.subscribe((active) => (isActive = active));
 *   });
 * </script>
 * ```
 */
export function getGlobalActivityDetector(options: ActivityOptions = {}): ActivityState {
  if (!globalActivityDetector) {
    globalActivityDetector = createActivityDetector(options);
  }
  return globalActivityDetector;
}
