//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import Vue from 'nativescript-vue';
import Vuex from 'vuex';

import mutations from './mutations'
import actions from './actions'

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

const store = new Vuex.Store({
  state: {
    screen_height: 0,
    sliding_panel_width: 100,
    is_webview_load_finished: false,

    panes: [
      {name: "all", label: "All", icon: "fa-list"},
      {name: "faction", label: "Faction", icon: "fa-user-friends"},
      {name: "alerts", label: "Alerts", icon: "fa-bell"},
      {name: "info", label: "Info", icon: "fa-info-circle"},
      {name: "map", label: "Map", icon: "fa-map"}
    ],
    current_pane: "map",
    base_layer_selected: 0,
    base_layers_list: [],
    overlay_layers: [],
    progress: 0,
    location: {lat: 0, lng: 0, accuracy: 0, is_target: false},
    injectPlugin: {}
  },
  mutations,
  actions,
  strict: debug,
});

Vue.prototype.$store = store;

export default store;
