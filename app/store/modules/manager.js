//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { Manager } from 'lib-iitc-manager';
import storage from '@/utils/storage';

// Private singleton instance
let managerInstance = null;

export const manager = {
  namespaced: true,

  state: () => ({
    isInitialized: false,
    isRunning: false,
    inProgress: false,
  }),

  mutations: {
    SET_INITIALIZED(state, value) {
      state.isInitialized = value;
    },
    SET_RUNNING(state, value) {
      state.isRunning = value;
    },
    SET_PROGRESS(state, value) {
      state.inProgress = value;
    },
  },

  actions: {
    /**
     * Initialize the Manager instance
     * Creates a singleton instance if it doesn't exist
     */
    async initialize({ commit, dispatch }) {
      if (managerInstance) {
        return managerInstance;
      }

      managerInstance = new Manager({
        storage,
        // Handle messages from Manager
        message: (message, args) => {
          console.log(`Manager message: ${message}`, args);
          dispatch('ui/showMessage', message, { root: true });
        },
        // Control progress bar visibility
        progressbar: isShow => {
          commit('SET_PROGRESS', isShow);
        },
        // Handle plugin injection
        inject_plugin: plugin => {
          dispatch('map/setInjectPlugin', plugin, { root: true });
        },
        // Handle plugin state changes
        plugin_event: (event) => {
          dispatch('handlePluginStateChange', event);
        },
        is_daemon: true
      });

      commit('SET_INITIALIZED', true);
      return managerInstance;
    },

    /**
     * Start Manager operation
     * Must be called after initialization
     */
    async run({ commit, dispatch }) {
      const manager = await dispatch('initialize');
      await manager.run();
      commit('SET_RUNNING', true);

      return manager;
    },

    /**
     * Force update check (user-initiated)
     */
    async forceUpdate({ commit, dispatch }) {
      commit('SET_PROGRESS', true);

      try {
        const manager = await dispatch('initialize');
        await manager.checkUpdates(true);

        commit('SET_PROGRESS', false);
        return true;
      } catch (error) {
        console.error('Force update failed:', error);
        commit('SET_PROGRESS', false);
        return false;
      }
    },

    /**
     * Inject plugins into WebView
     */
    async inject({ dispatch }) {
      const manager = await dispatch('initialize');
      await manager.inject();
    },

    /**
     * Get current update channel
     */
    async getUpdateChannel() {
      const data = await storage.get('channel');
      return data.channel || 'release';
    },

    /**
     * Set update channel
     */
    async setUpdateChannel({ dispatch }, channel) {
      const manager = await dispatch('initialize');
      await manager.setChannel(channel);
    },

    /**
     * Get update check interval for specified channel
     */
    async getUpdateInterval({ dispatch }, channel) {
      if (!channel) {
        channel = await dispatch('getUpdateChannel');
      }

      const key = `${channel}_update_check_interval`;
      const data = await storage.get(key);
      return data[key] || 86400;
    },

    /**
     * Set update check interval for a channel
     */
    async setUpdateInterval({ dispatch }, { interval, channel }) {
      if (!channel) {
        channel = await dispatch('getUpdateChannel');
      }

      const manager = await dispatch('initialize');
      await manager.setUpdateCheckInterval(interval, channel);
    },

    /**
     * Get custom channel URL
     */
    async getCustomChannelUrl() {
      const data = await storage.get('network_host');
      return (data.network_host && data.network_host.custom) ?
        data.network_host.custom : '';
    },

    /**
     * Handle plugin state changes from manager
     */
    async handlePluginStateChange({ dispatch }, event) {
      try {
        // Handle user-location plugin changes
        for (const [uid, plugin] of Object.entries(event.plugins)) {
          if (uid === "User Location+https://github.com/IITC-CE/ingress-intel-total-conversion") {
            const isEnabled = event.event === 'add';
            await dispatch('settings/updateShowLocationFromManager', isEnabled, { root: true });
            break;
          }
        }
      } catch (error) {
        console.error('Failed to handle plugin state change:', error);
      }
    },

    /**
     * Set custom channel URL
     */
    async setCustomChannelUrl({ dispatch }, url) {
      const manager = await dispatch('initialize');
      await manager.setCustomChannelUrl(url);
    },

    /**
     * Activate or deactivate a plugin
     */
    async managePlugin({ dispatch }, { uid, action }) {
      const manager = await dispatch('initialize');
      await manager.managePlugin(uid, action);
    },

    /**
     * Add user scripts (plugins)
     */
    async addUserScripts({ dispatch }, scripts) {
      const manager = await dispatch('initialize');
      const result = await manager.addUserScripts(scripts);

      return result;
    },

    /**
     * Get all plugins from storage
     */
    async getPlugins({ dispatch }) {
      const channel = await dispatch('getUpdateChannel');
      const key = `${channel}_plugins_flat`;

      const data = await storage.get(key);
      return data[key] || {};
    },

    /**
     * Get only enabled plugins
     */
    async getEnabledPlugins({ dispatch }) {
      const plugins = await dispatch('getPlugins');
      return Object.fromEntries(
        Object.entries(plugins).filter(([_, plugin]) => plugin.status === 'on')
      );
    },

    /**
     * Check if custom channel URL is valid
     */
    async checkCustomChannelUrl(_, url) {
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

        const response = await fetch(metaUrl, {
          method: 'HEAD',
          timeout: 2000
        });

        return response.ok;
      } catch (error) {
        console.error('Error checking custom URL:', error);
        return false;
      }
    },
  },

  getters: {
    /**
     * Check if Manager is initialized
     */
    isInitialized: state => state.isInitialized,

    /**
     * Check if Manager is running
     */
    isRunning: state => state.isRunning,

    /**
     * Check if Manager in progress
     */
    inProgress: state => state.inProgress,
  }
};
