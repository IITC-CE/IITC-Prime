// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * Polyfills required inside NativeScript workers.
 *
 * The `setimmediate` package (a transitive dep of jszip via `lie`) misdetects
 * the worker as a browser main thread and calls the nonexistent
 * `global.attachEvent`, throwing at import time and killing the worker.
 * It early-returns when `global.setImmediate` exists, so we define it before
 * the jszip chain loads. Must be imported FIRST in the worker entry.
 */

if (typeof global.setImmediate !== 'function') {
  global.setImmediate = (callback, ...args) => setTimeout(callback, 0, ...args);
  global.clearImmediate = handle => clearTimeout(handle);
}
