// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { INITIAL_INTERNAL_HOSTNAMES, isDemoUrl } from '@/utils/url-config';

// Google base layers need a Maps API token IITC extracts from intel.ingress.com,
// which the demo server can't provide, so they are dropped in demo mode.
const isGoogleBaseLayer = name => typeof name === 'string' && name.startsWith('Google');

export const map = {
  namespaced: true,
  state: () => ({
    baseLayerSelected: 0,
    baseLayersList: [],
    overlayLayers: [],
    highlightersList: ['No Highlights'],
    highlighterSelected: 'No Highlights',
    location: { lat: 0, lng: 0, accuracy: 0 },
    isFollowingUser: false,
    locationRequestState: 'idle', // 'idle' | 'locating' | 'error'
    injectPlugin: {},
    portalStatus: {
      guid: null,
      team: 'N',
      level: 0,
      isNeutral: true,
      title: 'No portal selected',
      health: 0,
      resonators: null,
      levelColor: null,
      isLoading: false,
    },
    mapStatus: {
      portalLevels: {
        hasPortals: false,
        minLinkLength: 0,
        formattedLength: '0m',
      },
      mapStatus: {
        short: null,
        long: null,
        progress: 1,
        progressPercent: 100,
      },
      requests: {
        active: 0,
        failed: 0,
        hasActive: false,
        hasFailed: false,
      },
    },
    internalHostnames: [...INITIAL_INTERNAL_HOSTNAMES],
  }),
  mutations: {
    SET_BASE_LAYER_SELECTED(state, index) {
      state.baseLayerSelected = index;
    },
    SET_BASE_LAYERS_LIST(state, layers) {
      state.baseLayersList = layers;
    },
    SET_OVERLAY_LAYERS(state, layers) {
      const existing = state.overlayLayers;
      const sameStructure =
        existing.length === layers.length &&
        layers.every((l, i) => l.layerId === existing[i].layerId);
      if (!sameStructure) {
        state.overlayLayers = layers;
        return;
      }
      // Same layer set - update only changed properties in-place so that
      // computed properties depending on the array reference don't invalidate.
      layers.forEach((layer, i) => {
        if (existing[i].active !== layer.active) existing[i].active = layer.active;
        if (existing[i].name !== layer.name) existing[i].name = layer.name;
      });
    },
    SET_OVERLAY_LAYER_PROPERTY(state, { index, active }) {
      state.overlayLayers[index].active = active;
    },
    SET_LOCATION(state, location) {
      state.location = location;
    },
    SET_FOLLOWING_USER(state, following) {
      state.isFollowingUser = following;
    },
    SET_LOCATION_REQUEST_STATE(state, requestState) {
      state.locationRequestState = requestState;
    },
    SET_INJECT_PLUGIN(state, plugin) {
      state.injectPlugin = plugin;
    },
    ADD_HIGHLIGHTER(state, name) {
      if (!state.highlightersList.includes(name)) {
        state.highlightersList.push(name);
      }
    },
    SET_ACTIVE_HIGHLIGHTER(state, name) {
      state.highlighterSelected = name;
    },
    RESET_HIGHLIGHTERS(state) {
      state.highlightersList = ['No Highlights'];
      state.highlighterSelected = 'No Highlights';
    },
    SET_PORTAL_STATUS(state, data) {
      // If no data (or null), reset to default state
      if (!data) {
        state.portalStatus = {
          guid: null,
          team: 'N',
          level: 0,
          isNeutral: true,
          title: 'No portal selected',
          health: 0,
          resonators: null, // Reset to null for lazy initialization
          levelColor: null,
          isLoading: false,
        };
      } else {
        // Update with data from IITC
        state.portalStatus = { ...data };
      }
    },
    SET_MAP_STATUS(state, data) {
      if (data) {
        state.mapStatus = { ...data };
      }
    },
    ADD_INTERNAL_HOSTNAME(state, domain) {
      if (!state.internalHostnames.includes(domain)) {
        state.internalHostnames.push(domain);
      }
    },
    RESET_INTERNAL_HOSTNAMES(state) {
      state.internalHostnames = [...INITIAL_INTERNAL_HOSTNAMES];
    },
  },
  actions: {
    setBaseLayers({ commit, dispatch, rootState }, baseLayers) {
      const inDemo = isDemoUrl(rootState.ui.currentUrl);
      const visible = inDemo
        ? baseLayers.filter(layer => !isGoogleBaseLayer(layer.name))
        : baseLayers;

      const layers = [];
      let activeId = 0;
      let hasActive = false;

      visible.forEach(layer => {
        layers.push({
          name: layer.name,
          layerId: layer.layerId,
        });

        if (layer.active === true) {
          activeId = layer.layerId;
          hasActive = true;
        }
      });

      commit('SET_BASE_LAYERS_LIST', layers);

      if (inDemo && !hasActive && layers.length > 0) {
        // Active base map was a filtered-out Google layer -
        // switch IITC to the first remaining one
        dispatch('setActiveBaseLayer', layers[0].layerId);
      } else {
        commit('SET_BASE_LAYER_SELECTED', activeId);
      }
    },
    setActiveBaseLayer({ commit }, index) {
      commit('SET_BASE_LAYER_SELECTED', index);
    },
    setOverlayLayers({ commit }, layers) {
      commit('SET_OVERLAY_LAYERS', layers);
    },
    setOverlayLayerProperty({ commit }, property) {
      commit('SET_OVERLAY_LAYER_PROPERTY', property);
    },
    setLocation({ commit }, location) {
      commit('SET_LOCATION', location);
    },
    setFollowingUser({ commit }, following) {
      commit('SET_FOLLOWING_USER', following);
    },
    setLocationRequestState({ commit }, requestState) {
      commit('SET_LOCATION_REQUEST_STATE', requestState);
    },
    setInjectPlugin({ commit }, plugin) {
      commit('SET_INJECT_PLUGIN', plugin);
    },
    addHighlighter({ commit }, name) {
      commit('ADD_HIGHLIGHTER', name);
    },
    setActiveHighlighter({ commit, state }, name) {
      if (state.highlighterSelected !== name) {
        commit('SET_ACTIVE_HIGHLIGHTER', name);
      }
    },
    resetHighlighters({ commit }) {
      commit('RESET_HIGHLIGHTERS');
    },
    setPortalStatus({ commit }, data) {
      commit('SET_PORTAL_STATUS', data);
    },
    setMapStatus({ commit }, data) {
      commit('SET_MAP_STATUS', data);
    },
    addInternalHostname({ commit }, domain) {
      if (typeof domain !== 'string') return;
      // Subdomains always match, so "*.example.com" and ".example.com" mean "example.com"
      const hostname = domain
        .trim()
        .toLowerCase()
        .replace(/^\*?\./, '');
      if (hostname) {
        commit('ADD_INTERNAL_HOSTNAME', hostname);
      }
    },
    resetInternalHostnames({ commit }) {
      commit('RESET_INTERNAL_HOSTNAMES');
    },
    /**
     * Handle location tracking enable/disable
     */
    async setLocationTracking({ dispatch }, enabled) {
      if (enabled) {
        // Start continuous GPS tracking
        await dispatch('startLocationTracking');
      } else {
        // Stop GPS tracking and reset follow mode
        await dispatch('stopLocationTracking');
        await dispatch('setFollowingUser', false);
      }
    },
    /**
     * Start continuous location tracking
     */
    async startLocationTracking({ rootState }) {},
    /**
     * Stop location tracking
     */
    async stopLocationTracking({ rootState }) {},
    /**
     * Trigger locate from GPS instance
     */
    async triggerUserLocate({ rootState }) {},
    /**
     * Use built-in map locate function
     */
    async locateMapOnce({ commit }, { lat, lng, persistentZoom }) {},
    /**
     * Trigger locate action in `user-location` plugin
     */
    async userLocationLocate({ commit }, { lat, lng, accuracy, persistentZoom }) {},
    /**
     * Update user orientation in `user-location` plugin
     */
    async userLocationOrientation({ commit }, { direction }) {},
    /**
     * Execute JavaScript code in WebView
     */
    async executeJavaScript({ commit }, code) {},
  },
  getters: {
    isFollowingUser: state => state.isFollowingUser,
  },
};
