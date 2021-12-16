//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import Vue from 'nativescript-vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

const store = new Vuex.Store({
  state: {
    appbar_width: 100,
    is_opened_bottom_sheet: false,

    panes: [
      {name: "all", label: "All", icon: "mdi-list"},
      {name: "faction", label: "Faction", icon: "mdi-group"},
      {name: "alerts", label: "Alerts", icon: "mdi-notifications-active"},
      {name: "info", label: "Info", icon: "mdi-info"},
      {name: "map", label: "Map", icon: "mdi-map"}
    ],
    current_pane: "map",
    base_layer_selected: 0,
    base_layers_list: [],
    overlay_layers: [],
    progress: 0
  },
  mutations: {
    setAppBarWidth(state, width) {
      state.appbar_width = width;
    },
    setIsOpenedBottomSheet(state, status) {
      state.is_opened_bottom_sheet = status;
    },

    addPane(state, pane) {
      state.panes.push(pane);
    },
    setCurrentPane(state, name) {
      state.current_pane = name;
    },
    setBaseLayerSelected(state, index) {
      state.base_layer_selected = index;
    },
    setBaseLayersList(state, data) {
      state.base_layers_list = data;
    },
    setOverlayLayers(state, data) {
      state.overlay_layers = data;
    },
    setOverlayLayerProperty(state, property) {
      state.overlay_layers[property.index].active = property.active;
    },
    setProgress(state, progress) {
      state.progress = progress;
    }
  },
  actions: {
    setAppBarWidth({ commit }, property) {
      commit('setAppBarWidth', property);
    },
    setIsOpenedBottomSheet({ commit }, status) {
      commit('setIsOpenedBottomSheet', status);
    },

    addPane({ commit }, pane) {
      commit('addPane', pane);
    },
    setCurrentPane({ commit }, name) {
      commit('setCurrentPane', name);
    },
    // TODO: store base_layers as object: layerId may not be equal to id
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
    setActiveBaseLayer({ commit }, index) {
      commit('setBaseLayerSelected', index);
    },
    setOverlayLayers({ commit }, overlay_layers) {
      commit('setOverlayLayers', overlay_layers);
    },
    setOverlayLayerProperty({ commit }, property) {
      commit('setOverlayLayerProperty', property);
    },
    setProgress({ commit }, property) {
      commit('setProgress', property);
    }
  },
  strict: debug,
});

Vue.prototype.$store = store;

export default store;
