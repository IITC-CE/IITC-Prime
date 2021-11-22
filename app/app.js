import VueDevtools from 'nativescript-vue-devtools'
import Vue from 'nativescript-vue'

import Main from '~/components/Main'

import BottomSheetPlugin from '@nativescript-community/ui-material-bottomsheet/vue';
import { install } from "@nativescript-community/ui-material-bottomsheet";
install();
Vue.use(BottomSheetPlugin);

const store = Vue.observable({
  overlay_layer_selected: 0,
  base_layer_selected: 0,
  overlay_layers_list: [],
  base_layers_list: []
});
Vue.prototype.$store = store;

Vue.use(VueDevtools, { host: '192.168.42.10' })
Vue.config.silent = false;

export const eventBus = new Vue();
new Vue({
  render: (h) => h('frame', [h(Main)]),
}).$start()
