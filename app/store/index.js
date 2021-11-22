import Vue from 'nativescript-vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

const store = new Vuex.Store({
  state: {
    base_layer_selected: 0,
    base_layers_list: []
  },
  mutations: {
    setBaseLayerSelected(state, data) {
      state.base_layer_selected = data;
    },
    setBaseLayersList(state, data) {
      state.base_layers_list = data;
    },
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

    }
  },
  strict: debug,
});

Vue.prototype.$store = store;

export default store;
