// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

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
      onPluginEvent: null
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
          }
        },
        message: (message, args) => {
          console.log(`[ManagerService] message: ${message}`, args);
          if (this.callbacks.onMessage) {
            this.callbacks.onMessage(message, args);
          }
        },
        progressbar: (isShow) => {
          if (this.callbacks.onProgress) {
            this.callbacks.onProgress(isShow);
          }
        },
        inject_plugin: (plugin) => {
          if (this.callbacks.onInjectPlugin) {
            this.callbacks.onInjectPlugin(plugin);
          }
        },
        plugin_event: (event) => {
          if (this.callbacks.onPluginEvent) {
            this.callbacks.onPluginEvent(event);
          }
        },
        is_daemon: false
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

    // Load all initial data in parallel
    const [channel, customUrl, plugins] = await Promise.all([
      this.getUpdateChannel(),
      this.getCustomChannelUrl(),
      this.getPlugins()
    ]);

    return {
      isRunning: true,
      currentChannel: channel,
      customChannelUrl: customUrl,
      plugins
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

    // Return updated data
    const plugins = await this.getPlugins();
    return {
      currentChannel: channel,
      plugins
    };
  }

  /**
   * Get update check interval
   */
  async getUpdateInterval(channel) {
    const manager = await this.initialize();
    if (!channel) {
      channel = manager.channel;
    }

    const key = `${channel}_update_check_interval`;
    const data = await manager.storage.get([key]);
    return data[key] || 86400;
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
    const data = await manager.storage.get(['network_host']);
    return (data.network_host && data.network_host.custom) ?
      data.network_host.custom : '';
  }

  /**
   * Set custom channel URL
   */
  async setCustomChannelUrl(url) {
    const manager = await this.initialize();
    await manager.setCustomChannelUrl(url);
    return {
      customChannelUrl: url
    };
  }

  /**
   * Validate custom channel URL
   */
  async validateCustomChannelUrl(url) {
    if (!url) return false;

    try {
      // Ensure URL has http/https prefix
      let fullUrl = url;
      if (!/^https?:\/\//i.test(fullUrl)) {
        fullUrl = 'http://' + fullUrl;
      }

      // Test if meta.json is accessible
      const metaUrl = fullUrl.endsWith('/') ?
        `${fullUrl}meta.json` : `${fullUrl}/meta.json`;

      const metaUrlWithCacheBust = `${metaUrl}?${Date.now()}`;

      const response = await fetch(metaUrlWithCacheBust, {
        method: 'GET',
        timeout: 2000,
        headers: {
          'Accept': '*/*',
          'Range': 'bytes=0-0'  // Request only first byte
        }
      });

      // Accept both 200 (full response) and 206 (partial content from Range request)
      return response.status === 200 || response.status === 206;
    } catch (error) {
      console.error('[ManagerService] Error checking custom URL:', error);
      return false;
    }
  }

  // === Plugin Management ===

  /**
   * Get all plugins
   */
  async getPlugins() {
    const manager = await this.initialize();
    const channel = manager.channel;
    const storage = manager.storage;

    const key = `${channel}_plugins_flat`;
    const data = await storage.get([key]);
    return data[key] || {};
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

    // Return updated plugins
    const plugins = await this.getPlugins();
    return {
      plugins,
      updatedPlugin: { uid, status: action }
    };
  }

  /**
   * Add user scripts
   */
  async addUserScripts(scripts) {
    const manager = await this.initialize();
    const result = await manager.addUserScripts(scripts);

    // Return updated plugins
    const plugins = await this.getPlugins();
    return {
      result,
      plugins
    };
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
      onPluginEvent: null
    };
  }
}

// Create singleton instance
export const managerService = new ManagerService();
