// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * ManagerService - a service for working with lib-iitc-manager.
 */

import { Manager } from 'lib-iitc-manager';
import storage from '@/utils/storage';

export class ManagerService {
  constructor() {
    this.manager = null;
    this.isInitialized = false;
    this.callbacks = {
      onMessage: null,
      onProgress: null,
      onInjectPlugin: null,
      onPluginEvent: null,
      onPluginsViewChanged: null,
    };
  }

  /**
   * Initialize Manager instance
   */
  async initialize() {
    if (this.isInitialized && this.manager) {
      return this.manager;
    }

    try {
      this.manager = new Manager({
        storage: {
          async get(keys) {
            return await storage.get(keys);
          },
          async set(obj) {
            await storage.set(obj);
          },
        },
        gmApi: {
          bridgeAdapterCode: `
            window.__iitc_gm_bridge__ = {
              send(data) {
                window.nsWebViewBridge.emit('gmBridgeRequest', JSON.stringify(data));
              },
              onResponse(cb) {
                window.addEventListener('gmBridgeResponse', function(e) { cb(e.detail); });
              }
            };
          `,
        },
        message: (message, args) => {
          console.log(`[ManagerService] message: ${message}`, args);
          if (this.callbacks.onMessage) {
            this.callbacks.onMessage(message, args);
          }
        },
        onProgress: isShow => {
          if (this.callbacks.onProgress) {
            this.callbacks.onProgress(isShow);
          }
        },
        injectPlugin: plugin => {
          if (this.callbacks.onInjectPlugin) {
            this.callbacks.onInjectPlugin(plugin);
          }
        },
        onPluginEvent: event => {
          if (this.callbacks.onPluginEvent) {
            this.callbacks.onPluginEvent(event);
          }
        },
        onPluginsViewChanged: view => {
          if (this.callbacks.onPluginsViewChanged) {
            this.callbacks.onPluginsViewChanged(view.plugins, view.core || null);
          }
        },
        useFetchHeadMethod: false,
        isDaemon: false,
      });

      this.isInitialized = true;
      return this.manager;
    } catch (error) {
      console.error('[ManagerService] Failed to initialize Manager:', error);
      throw error;
    }
  }

  // === Core Operations ===

  /**
   * Start Manager and load initial data
   */
  async startup() {
    const manager = await this.initialize();
    await manager.run();

    const [channel, customUrl] = await Promise.all([
      this.getUpdateChannel(),
      this.getCustomChannelUrl(),
    ]);

    return {
      isRunning: true,
      currentChannel: channel,
      customChannelUrl: customUrl,
    };
  }

  /**
   * Update check
   */
  async checkUpdates(force = false) {
    const manager = await this.initialize();
    await manager.checkUpdates(force);
    return { success: true };
  }

  /**
   * Inject plugins
   */
  async inject() {
    const manager = await this.initialize();
    await manager.inject();
    return { success: true };
  }

  // === Channel Management ===

  /**
   * Get current update channel
   */
  async getUpdateChannel() {
    const manager = await this.initialize();
    return manager.channel;
  }

  /**
   * Set update channel and reload plugins
   */
  async setUpdateChannel(channel) {
    const manager = await this.initialize();
    await manager.setChannel(channel);
    return { currentChannel: channel };
  }

  /**
   * Get update check interval
   */
  async getUpdateInterval(channel) {
    const manager = await this.initialize();
    return await manager.getUpdateCheckInterval(channel);
  }

  /**
   * Set update check interval
   */
  async setUpdateInterval(interval, channel) {
    const manager = await this.initialize();
    await manager.setUpdateCheckInterval(interval, channel);
    return { success: true };
  }

  /**
   * Get custom channel URL
   */
  async getCustomChannelUrl() {
    const manager = await this.initialize();
    return manager.networkHost?.custom ?? '';
  }

  /**
   * Set custom channel URL
   */
  async setCustomChannelUrl(url) {
    const manager = await this.initialize();
    await manager.setCustomChannelUrl(url);
    return {
      customChannelUrl: url,
    };
  }

  // === Plugin Management ===

  /**
   * Get all plugins
   */
  async getPlugins() {
    const manager = await this.initialize();
    const view = await manager.getPluginsView();
    return { plugins: view.plugins, core: view.core || null };
  }

  /**
   * Get only enabled plugins
   */
  async getEnabledPlugins() {
    const manager = await this.initialize();
    return await manager.getEnabledPlugins();
  }

  /**
   * Enable/disable plugin
   */
  async managePlugin(uid, action) {
    const manager = await this.initialize();
    await manager.managePlugin(uid, action);
  }

  /**
   * Add user scripts
   */
  async addUserScripts(scripts) {
    const manager = await this.initialize();
    return await manager.addUserScripts(scripts);
  }

  /**
   * Set callback functions for handling Manager events
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.manager = null;
    this.isInitialized = false;
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
