//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import storage from '@/utils/storage';

export const settings = {
  namespaced: true,

  state: () => ({
    // UI settings
    desktopMode: false,
    fakeUserAgent: false,
    persistentZoom: false,

    // Location settings
    location: {
      accuracy: 'high', // 'high', 'medium', 'low'
      updateInterval: 1000, // milliseconds
      followMode: false
    }
  }),

  mutations: {
    SET_SETTING(state, { key, value }) {
      // Handle nested properties like 'location.accuracy'
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        state[parent][child] = value;
      } else {
        state[key] = value;
      }
    },

    LOAD_SETTINGS(state, settings) {
      // Apply saved settings to state
      Object.keys(settings).forEach(key => {
        if (key in state) {
          if (typeof state[key] === 'object' && typeof settings[key] === 'object') {
            state[key] = { ...state[key], ...settings[key] };
          } else {
            state[key] = settings[key];
          }
        }
      });
    }
  },

  actions: {
    /**
     * Initialize settings by loading from storage
     */
    async initSettings({ commit, dispatch }) {
      try {
        const data = await storage.get('app_settings');
        if (data && data.app_settings) {
          commit('LOAD_SETTINGS', data.app_settings);

          // Apply settings that require immediate action
          await dispatch('applySettings');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    },

    /**
     * Save a single setting
     */
    async setSetting({ commit, dispatch, state }, { key, value }) {
      commit('SET_SETTING', { key, value });

      // Persist to storage
      await storage.set({ app_settings: state });

      // Apply settings that need immediate effect
      await dispatch('applySettings', [key]);
    },

    /**
     * Save all settings (bulk update)
     */
    async saveSettings({ state }) {
      await storage.set({ app_settings: state });
    },

    /**
     * Apply settings that require immediate action
     */
    async applySettings({ state, dispatch }, changedKeys = []) {
      // Desktop mode changed
      if (changedKeys.length === 0 || changedKeys.includes('desktopMode')) {
        await dispatch('ui/setDesktopMode', state.desktopMode, { root: true });
      }

      // Fake user agent changed
      if (changedKeys.length === 0 || changedKeys.includes('fakeUserAgent')) {
        await dispatch('ui/setFakeUserAgent', state.fakeUserAgent, { root: true });
      }

      // Persistent zoom changed
      if (changedKeys.length === 0 || changedKeys.includes('persistentZoom')) {
        await dispatch('map/setPersistentZoom', state.persistentZoom, { root: true });
      }

      // Location settings changed
      if (changedKeys.length === 0 || changedKeys.some(key => key.startsWith('location.'))) {
        await dispatch('map/updateLocationSettings', state.location, { root: true });
      }
    },

    /**
     * Reset settings to default values
     */
    async resetSettings({ commit, dispatch }) {
      const defaultSettings = {
        desktopMode: false,
        fakeUserAgent: false,
        persistentZoom: false,
        location: {
          accuracy: 'high',
          updateInterval: 1000,
          followMode: false
        }
      };

      commit('LOAD_SETTINGS', defaultSettings);
      await dispatch('saveSettings');
      await dispatch('applySettings');
    }
  },

  getters: {
    // Quick access getters
    isDesktopMode: state => state.desktopMode,
    isFakeUserAgent: state => state.fakeUserAgent,
    isPersistentZoom: state => state.persistentZoom,
    locationSettings: state => state.location,

    // Specific location settings
    locationAccuracy: state => state.location.accuracy,
    locationUpdateInterval: state => state.location.updateInterval,
    isFollowMode: state => state.location.followMode
  }
};
