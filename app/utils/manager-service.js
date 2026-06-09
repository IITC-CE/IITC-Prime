// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * ManagerService - a service for working with lib-iitc-manager.
 *
 * Runs lib-iitc-manager on a background Worker (manager-worker.js) and exposes
 * the same async API. Heavy work (plugin parsing, update fetching) runs off the
 * UI thread.
 */

export class ManagerService {
  constructor() {
    this.worker = null;
    this.nextId = 1;
    // id -> { resolve, reject } for in-flight RPC calls
    this.pending = new Map();
    this.callbacks = {
      onMessage: null,
      onProgress: null,
      onInjectPlugin: null,
      onPluginEvent: null,
      onPluginsViewChanged: null,
    };
  }

  _ensureWorker() {
    if (this.worker) return this.worker;

    // String literal is required: nativescript-worker-loader rewrites it into a
    // bundled worker chunk at build time.
    this.worker = new Worker('./manager-worker.js');

    this.worker.onmessage = msg => {
      const data = msg.data || {};

      // Manager callback forwarded from the worker
      if (data.callback) {
        this._dispatchCallback(data.callback, data.args || []);
        return;
      }

      // RPC response
      const entry = this.pending.get(data.id);
      if (!entry) return;
      this.pending.delete(data.id);

      if (data.error) {
        const error = new Error(data.error.message);
        if (data.error.name) error.name = data.error.name;
        if (data.error.stack) error.stack = data.error.stack;
        entry.reject(error);
      } else {
        entry.resolve(data.result);
      }
    };

    this.worker.onerror = error => {
      console.error('[ManagerService] Worker error:', error);
      // A fatal worker error means in-flight RPCs will never get a response;
      // reject them so callers don't hang. (Per-call errors are reported as
      // { id, error } messages and handled above, not here.)
      this._rejectAllPending(new Error(`Manager worker error: ${error?.message || error}`));
    };

    return this.worker;
  }

  _rejectAllPending(error) {
    for (const entry of this.pending.values()) {
      entry.reject(error);
    }
    this.pending.clear();
  }

  _call(method, ...args) {
    const worker = this._ensureWorker();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, method, args });
    });
  }

  _dispatchCallback(name, args) {
    const cb = this.callbacks[name];
    if (name === 'onMessage') {
      console.log(`[ManagerService] message: ${args[0]}`, args[1]);
    }
    if (cb) cb(...args);
  }

  async startup() {
    return this._call('startup');
  }

  async checkUpdates(force = false) {
    return this._call('checkUpdates', force);
  }

  /** @returns {Promise<Array<{uid: string, filePath: string}>>} */
  async getEnabledPluginScripts() {
    return this._call('getEnabledPluginScripts');
  }

  async getUpdateChannel() {
    return this._call('getUpdateChannel');
  }

  async setUpdateChannel(channel) {
    return this._call('setUpdateChannel', channel);
  }

  async getUpdateInterval(channel) {
    return this._call('getUpdateInterval', channel);
  }

  async setUpdateInterval(interval, channel) {
    return this._call('setUpdateInterval', interval, channel);
  }

  async getCustomChannelUrl() {
    return this._call('getCustomChannelUrl');
  }

  async setCustomChannelUrl(url) {
    return this._call('setCustomChannelUrl', url);
  }

  async getPlugins() {
    return this._call('getPlugins');
  }

  async managePlugin(uid, action) {
    await this._call('managePlugin', uid, action);
  }

  async addUserScripts(scripts) {
    return this._call('addUserScripts', scripts);
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this._rejectAllPending(new Error('ManagerService cleaned up'));
    this.callbacks = {
      onMessage: null,
      onProgress: null,
      onInjectPlugin: null,
      onPluginEvent: null,
      onPluginsViewChanged: null,
    };
  }
}

// Create singleton instance
export const managerService = new ManagerService();
