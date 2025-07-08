//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

/**
 * Global performance optimization utilities
 * Provides reusable patterns for memory management and performance improvements
 */

/**
 * Global object pool manager
 * Reduces GC pressure by reusing objects
 */
export class ObjectPool {
  constructor(createFn, resetFn, maxSize = 50) {
    this._pool = [];
    this._createFn = createFn;
    this._resetFn = resetFn;
    this._maxSize = maxSize;
  }

  get() {
    const obj = this._pool.pop();
    return obj || this._createFn();
  }

  return(obj) {
    if (this._pool.length < this._maxSize) {
      if (this._resetFn) {
        this._resetFn(obj);
      }
      this._pool.push(obj);
    }
  }

  clear() {
    this._pool.length = 0;
  }

  get size() {
    return this._pool.length;
  }
}

/**
 * Global animation configuration pool
 */
export const AnimationPool = new ObjectPool(
  () => [{
    target: null,
    translate: { x: 0, y: 0 },
    opacity: 1,
    scale: { x: 1, y: 1 },
    duration: 300,
    curve: 'easeInOut'
  }],
  (config) => {
    config[0].target = null;
    config[0].translate.x = 0;
    config[0].translate.y = 0;
    config[0].opacity = 1;
    config[0].scale.x = 1;
    config[0].scale.y = 1;
    config[0].duration = 300;
    config[0].curve = 'easeInOut';
  }
);

/**
 * Global RAF batching manager
 * Batches DOM updates to reduce layout thrashing
 */
export class RAFBatcher {
  constructor() {
    this._pendingUpdates = new Map();
    this._frameId = null;
  }

  schedule(key, updateFn) {
    this._pendingUpdates.set(key, updateFn);

    if (!this._frameId) {
      this._frameId = requestAnimationFrame(() => {
        this._pendingUpdates.forEach(fn => fn());
        this._pendingUpdates.clear();
        this._frameId = null;
      });
    }
  }

  cancel(key) {
    this._pendingUpdates.delete(key);

    if (this._pendingUpdates.size === 0 && this._frameId) {
      cancelAnimationFrame(this._frameId);
      this._frameId = null;
    }
  }

  cancelAll() {
    this._pendingUpdates.clear();
    if (this._frameId) {
      cancelAnimationFrame(this._frameId);
      this._frameId = null;
    }
  }
}

// Global RAF batcher instance
export const globalRAFBatcher = new RAFBatcher();

/**
 * Timer management utility
 * Provides Set-based timer tracking for easy cleanup
 */
export class TimerManager {
  constructor() {
    this._timers = new Set();
    this._intervals = new Set();
  }

  setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      this._timers.delete(timerId);
      callback();
    }, delay);
    this._timers.add(timerId);
    return timerId;
  }

  setInterval(callback, interval) {
    const intervalId = setInterval(callback, interval);
    this._intervals.add(intervalId);
    return intervalId;
  }

  clearTimeout(timerId) {
    clearTimeout(timerId);
    this._timers.delete(timerId);
  }

  clearInterval(intervalId) {
    clearInterval(intervalId);
    this._intervals.delete(intervalId);
  }

  clearAll() {
    this._timers.forEach(id => clearTimeout(id));
    this._intervals.forEach(id => clearInterval(id));
    this._timers.clear();
    this._intervals.clear();
  }

  get activeTimers() {
    return this._timers.size + this._intervals.size;
  }
}

/**
 * Debounce utility with AbortController support
 */
export function createDebouncer(delay = 300) {
  let timeoutId = null;
  let abortController = null;

  return {
    debounce(fn) {
      // Cancel previous execution
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (abortController) {
        abortController.abort();
      }

      // Create new abort controller
      abortController = new AbortController();
      const signal = abortController.signal;

      return new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          if (!signal.aborted) {
            try {
              const result = fn();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }
        }, delay);
      });
    },

    cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    }
  };
}

/**
 * Cache utility with size limits and TTL
 */
export class Cache {
  constructor(maxSize = 100, ttl = 300000) { // 5 minutes default TTL
    this._cache = new Map();
    this._maxSize = maxSize;
    this._ttl = ttl;
  }

  get(key) {
    const entry = this._cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() - entry.timestamp > this._ttl) {
      this._cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key, value) {
    // Remove oldest entries if at max size
    if (this._cache.size >= this._maxSize) {
      const firstKey = this._cache.keys().next().value;
      this._cache.delete(firstKey);
    }

    this._cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    return this._cache.delete(key);
  }

  clear() {
    this._cache.clear();
  }

  get size() {
    return this._cache.size;
  }
}

/**
 * WeakRef manager for preventing circular references
 */
export class WeakRefManager {
  constructor() {
    this._refs = new Set();
  }

  createRef(target) {
    const ref = new WeakRef(target);
    this._refs.add(ref);
    return ref;
  }

  deref(ref) {
    return ref?.deref();
  }

  cleanup() {
    // Remove dead references
    for (const ref of this._refs) {
      if (!ref.deref()) {
        this._refs.delete(ref);
      }
    }
  }

  get size() {
    return this._refs.size;
  }
}

/**
 * Component lifecycle mixin for automatic cleanup
 */
export const performanceOptimizationMixin = {
  data() {
    return {
      _timerManager: new TimerManager(),
      _weakRefManager: new WeakRefManager(),
      _rafUpdateKey: null
    };
  },

  created() {
    // Create unique RAF key for this component
    this._rafUpdateKey = `${this.$options.name || 'component'}-${Date.now()}-${Math.random()}`;
  },

  beforeUnmount() {
    this.performanceCleanup();
  },

  methods: {
    /**
     * Cleanup method to prevent memory leaks
     */
    performanceCleanup() {
      try {
        // Clear all timers
        if (this._timerManager) {
          this._timerManager.clearAll();
        }

        // Cancel RAF updates
        if (this._rafUpdateKey) {
          globalRAFBatcher.cancel(this._rafUpdateKey);
        }

        // Cleanup weak references
        if (this._weakRefManager) {
          this._weakRefManager.cleanup();
        }
      } catch (error) {
        console.error('Error during performance cleanup:', error);
      }
    },

    /**
     * Schedule a DOM update using RAF batching
     */
    scheduleUpdate(updateFn) {
      if (this._rafUpdateKey) {
        globalRAFBatcher.schedule(this._rafUpdateKey, updateFn);
      } else {
        // Fallback to immediate execution
        requestAnimationFrame(updateFn);
      }
    },

    /**
     * Create a managed timer
     */
    createTimeout(callback, delay) {
      if (this._timerManager) {
        return this._timerManager.setTimeout(callback, delay);
      }
      // Fallback to regular setTimeout
      return setTimeout(callback, delay);
    },

    /**
     * Create a managed interval
     */
    createInterval(callback, interval) {
      if (this._timerManager) {
        return this._timerManager.setInterval(callback, interval);
      }
      // Fallback to regular setInterval
      return setInterval(callback, interval);
    },

    /**
     * Create a weak reference
     */
    createWeakRef(target) {
      if (this._weakRefManager) {
        return this._weakRefManager.createRef(target);
      }
      // Fallback if weakRefManager not initialized
      return new WeakRef(target);
    }
  }
};

/**
 * Vuex state optimization helper
 * Reduces reactivity overhead by flattening nested state access
 */
export function optimizeMapState(stateMapping) {
  const optimized = {};

  Object.entries(stateMapping).forEach(([key, selector]) => {
    if (typeof selector === 'function') {
      optimized[key] = selector;
    } else if (typeof selector === 'string') {
      // Convert dot notation to direct access
      const path = selector.split('.');
      optimized[key] = state => {
        let current = state;
        for (const prop of path) {
          current = current?.[prop];
          if (current === undefined) break;
        }
        return current;
      };
    }
  });

  return optimized;
}
