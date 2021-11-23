import Vue from 'nativescript-vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

const store = new Vuex.Store({
  state: {
    base_layer_selected: 0,
    base_layers_list: [],

    overlay_layers: [],
  },
  mutations: {
    setBaseLayerSelected(state, data) {
      state.base_layer_selected = data;
    },
    setBaseLayersList(state, data) {
      state.base_layers_list = data;
    },

    setOverlayLayers(state, data) {
      state.overlay_layers = data;
    },
    setOverlayLayerProperty(state, property) {
      state.overlay_layers[property.index].active = property.active;
    }
  },
  actions: {
    setBaseLayers({ commit }, base_layers) {

      const lst = [];
      let active = -1;
      base_layers.forEach(element => {
        lst.push(element.name);
        if (element.active === true) active = element.layerId;
      });
      commit('setBaseLayerSelected', active);
      commit('setBaseLayersList', lst);

    },
    setOverlayLayers({ commit }, overlay_layers) {
      commit('setOverlayLayers', overlay_layers);
    },
    setOverlayLayerProperty({ commit }, property) {
      commit('setOverlayLayerProperty', property);
    },
  },
  strict: debug,
});

Vue.prototype.$store = store;

export default store;
