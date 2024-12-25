//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

export const map = {
  namespaced: true,
  state: () => ({
    baseLayerSelected: 0,
    baseLayersList: [],
    overlayLayers: [],
    location: { lat: 0, lng: 0, accuracy: 0, isTarget: false },
    injectPlugin: {}
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
    }
  },
  actions: {
    // TODO: store base_layers as object: layerId may not be equal to id
    setBaseLayers({ commit }, baseLayers) {
      const layerNames = [];
      let activeIndex = -1;

      baseLayers.forEach(layer => {
        layerNames.push(layer.name);
        if (layer.active === true) {
          activeIndex = layer.layerId;
        }
      });

      commit('SET_BASE_LAYER_SELECTED', activeIndex);
      commit('SET_BASE_LAYERS_LIST', layerNames);
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
    }
  }
};
