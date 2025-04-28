//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

export const map = {
  namespaced: true,
  state: () => ({
    baseLayerSelected: 0,
    baseLayersList: [],
    overlayLayers: [],
    highlightersList: ["No Highlights"],
    highlighterSelected: "No Highlights",
    location: { lat: 0, lng: 0, accuracy: 0, isTarget: false },
    injectPlugin: {},
    portalStatus: {
      guid: null,
      team: 'N',
      level: 0,
      isNeutral: true,
      title: 'No portal selected',
      health: 0,
      resonators: [],
      levelColor: null,
    },
    mapStatus: {
      portalLevels: {
        hasPortals: false,
        minLinkLength: 0,
        formattedLength: '0m'
      },
      mapStatus: {
        short: null,
        long: null,
        progress: 1,
        progressPercent: 100
      },
      requests: {
        active: 0,
        failed: 0,
        hasActive: false,
        hasFailed: false
      }
    },
  }),
  mutations: {
    SET_BASE_LAYER_SELECTED(state, index) {
      state.baseLayerSelected = index;
    },
    SET_BASE_LAYERS_LIST(state, layers) {
      state.baseLayersList = layers;
    },
    SET_OVERLAY_LAYERS(state, layers) {
      state.overlayLayers = layers;
    },
    SET_OVERLAY_LAYER_PROPERTY(state, { index, active }) {
      state.overlayLayers[index].active = active;
    },
    SET_LOCATION(state, location) {
      state.location = location;
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
          resonators: [],
          levelColor: null,
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
  },
  actions: {
    setBaseLayers({ commit }, baseLayers) {
      const layers = [];
      let activeId = 0;

      baseLayers.forEach((layer, index) => {
        layers.push({
          name: layer.name,
          layerId: layer.layerId
        });

        if (layer.active === true) {
          activeId = layer.layerId;
        }
      });

      commit('SET_BASE_LAYER_SELECTED', activeId);
      commit('SET_BASE_LAYERS_LIST', layers);
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
    setInjectPlugin({ commit }, plugin) {
      commit('SET_INJECT_PLUGIN', plugin);
    },
    addHighlighter({ commit }, name) {
      commit('ADD_HIGHLIGHTER', name);
    },
    setActiveHighlighter({ commit }, name) {
      commit('SET_ACTIVE_HIGHLIGHTER', name);
    },
    setPortalStatus({ commit }, data) {
      commit('SET_PORTAL_STATUS', data);
    },
    setMapStatus({ commit }, data) {
      commit('SET_MAP_STATUS', data);
    },
  }
};
