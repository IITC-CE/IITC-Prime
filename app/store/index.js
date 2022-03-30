//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import Vue from 'nativescript-vue';
import Vuex from 'vuex';

import mutations from './mutations'
import actions from './actions'

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
    progress: 0,
    location: {lat: 0, lng: 0, accuracy: 0, is_target: false},
  },
  mutations,
  actions,
  strict: debug,
});

Vue.prototype.$store = store;

export default store;
