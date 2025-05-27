//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import storage from '@/utils/storage';

export const settings = {
  namespaced: true,

  state: () => ({
    // UI settings
    desktopMode: false,
    fakeUserAgent: false,

    // Location settings
    persistentZoom: false,
    showLocation: false,
    followMode: false,
  }),

  mutations: {
    SET_SETTING(state, { key, value }) {
      state[key] = value;
    },

    LOAD_SETTINGS(state, settings) {
      // Apply saved settings to state
      Object.keys(settings).forEach(key => {
        if (key in state) {
          state[key] = settings[key];
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
      // Fake user agent changed
      if (changedKeys.length === 0 || changedKeys.includes('fakeUserAgent')) {
        await dispatch('ui/setFakeUserAgent', state.fakeUserAgent, { root: true });
      }

      // Persistent zoom changed
      if (changedKeys.length === 0 || changedKeys.includes('persistentZoom')) {
        await dispatch('map/setPersistentZoom', state.persistentZoom, { root: true });
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
        showLocation: false,
        followMode: false,
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
    isShowLocation: state => state.showLocation,
    isFollowMode: state => state.followMode,
  }
};
