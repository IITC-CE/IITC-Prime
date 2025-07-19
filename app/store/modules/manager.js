// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { managerService } from '@/utils/manager-service';

export const manager = {
  namespaced: true,

  state: () => ({
    isInitialized: false,
    isRunning: false,
    inProgress: false,
    plugins: {},
    lastPluginUpdate: null,
    currentChannel: 'release',
    customChannelUrl: '',
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
    SET_PLUGINS(state, plugins) {
      state.plugins = plugins;
      state.lastPluginUpdate = Date.now();
    },
    UPDATE_PLUGIN_STATUS(state, { uid, status }) {
      if (state.plugins[uid]) {
        state.plugins[uid].status = status;
        state.lastPluginUpdate = Date.now();
      }
    },
    SET_CURRENT_CHANNEL(state, channel) {
      state.currentChannel = channel;
    },
    SET_CUSTOM_CHANNEL_URL(state, url) {
      state.customChannelUrl = url;
    },
  },

  actions: {
    /**
     * Initialize manager and setup event listeners
     */
    async run({ commit, dispatch }) {
      // Set callbacks for handling Manager events
      managerService.setCallbacks({
        onMessage: (message, args) => {
          dispatch('ui/showMessage', message, { root: true });
        },
        onProgress: (isShow) => {
          commit('SET_PROGRESS', isShow);
        },
        onInjectPlugin: (plugin) => {
          dispatch('map/setInjectPlugin', plugin, { root: true });
        },
        onPluginEvent: (event) => {
          dispatch('handlePluginEvent', event);
        }
      });

      commit('SET_PROGRESS', true);

      try {
        const data = await managerService.startup();

        commit('SET_RUNNING', data.isRunning);
        commit('SET_CURRENT_CHANNEL', data.currentChannel);
        commit('SET_CUSTOM_CHANNEL_URL', data.customChannelUrl);
        commit('SET_PLUGINS', data.plugins);
        commit('SET_INITIALIZED', true);

        return data;
      } finally {
        commit('SET_PROGRESS', false);
      }
    },

    /**
     * Force update check
     */
    async forceUpdate({ commit }) {
      commit('SET_PROGRESS', true);

      try {
        return await managerService.checkUpdates(true);
      } finally {
        commit('SET_PROGRESS', false);
      }
    },

    /**
     * Inject plugins
     */
    async inject() {
      return await managerService.inject();
    },

    /**
     * Load update channel into state
     */
    async loadUpdateChannel({ commit }) {
      const channel = await managerService.getUpdateChannel();
      commit('SET_CURRENT_CHANNEL', channel);
      return channel;
    },

    /**
     * Set update channel
     */
    async setUpdateChannel({ commit }, channel) {
      // Optimistic UI update
      commit('SET_CURRENT_CHANNEL', channel);

      try {
        const data = await managerService.setUpdateChannel(channel);
        commit('SET_CURRENT_CHANNEL', data.currentChannel);
        commit('SET_PLUGINS', data.plugins);
        return data;
      } catch (error) {
        // Revert on error
        const currentData = await managerService.getUpdateChannel();
        commit('SET_CURRENT_CHANNEL', currentData);
        throw error;
      }
    },

    /**
     * Get update check interval for specified channel
     */
    async getUpdateInterval(_, channel) {
      return await managerService.getUpdateInterval(channel);
    },

    /**
     * Set update check interval for a channel
     */
    async setUpdateInterval(_, { interval, channel }) {
      return await managerService.setUpdateInterval(interval, channel);
    },

    /**
     * Load custom channel URL into state
     */
    async loadCustomChannelUrl({ commit }) {
      const url = await managerService.getCustomChannelUrl();
      commit('SET_CUSTOM_CHANNEL_URL', url);
      return url;
    },

    /**
     * Set custom channel URL
     */
    async setCustomChannelUrl({ commit }, url) {
      const data = await managerService.setCustomChannelUrl(url);
      commit('SET_CUSTOM_CHANNEL_URL', data.customChannelUrl);
      return data;
    },

    /**
     * Load plugins into state
     */
    async loadPlugins({ commit }) {
      const plugins = await managerService.getPlugins();
      commit('SET_PLUGINS', plugins);
      return plugins;
    },

    /**
     * Enable/disable/delete plugin
     */
    async managePlugin({ commit, state }, { uid, action }) {
      // Optimistic UI update
      const previousStatus = state.plugins[uid]?.status;
      commit('UPDATE_PLUGIN_STATUS', { uid, status: action });

      try {
        const data = await managerService.managePlugin(uid, action);

        // Update full plugins list
        commit('SET_PLUGINS', data.plugins);

        return data;
      } catch (error) {
        // Revert on error
        if (previousStatus) {
          commit('UPDATE_PLUGIN_STATUS', { uid, status: previousStatus });
        }
        throw error;
      }
    },

    /**
     * Validate custom channel URL
     */
    async checkCustomChannelUrl(_, url) {
      return await managerService.validateCustomChannelUrl(url);
    },

    /**
     * Handle plugin state changes from manager
     */
    async handlePluginEvent({ commit, dispatch }, event) {
      try {
        for (const [uid, plugin] of Object.entries(event.plugins)) {
          const status = event.event === 'add' ? 'on' : 'off';
          commit('UPDATE_PLUGIN_STATUS', { uid, status });

          // Handle user-location plugin changes - only for add/remove, not update
          if (uid === "User Location+https://github.com/IITC-CE/ingress-intel-total-conversion" &&
              event.event !== 'update') {
            const isEnabled = event.event === 'add';
            await dispatch('settings/updateShowLocationFromManager', isEnabled, { root: true });
          }
        }

        // Reload full plugins list
        await dispatch('loadPlugins');
      } catch (error) {
        console.error('Failed to handle plugin state change:', error);
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

    /**
     * Get all plugins from Vuex state
     */
    plugins: state => state.plugins,

    /**
     * Timestamp of last plugins update
     */
    lastPluginUpdate: state => state.lastPluginUpdate,

    /**
     * Only enabled plugins
     */
    enabledPlugins: state => {
      return Object.fromEntries(
        Object.entries(state.plugins).filter(([_, plugin]) => plugin.status === 'on')
      );
    },

    /**
     * Current update channel
     */
    currentChannel: state => state.currentChannel,

    /**
     * Custom channel URL
     */
    customChannelUrl: state => state.customChannelUrl,
  }
};
