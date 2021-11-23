import VueDevtools from 'nativescript-vue-devtools'
import Vue from 'nativescript-vue'

import Main from '~/components/Main'

import BottomSheetPlugin from '@nativescript-community/ui-material-bottomsheet/vue';
import { install } from "@nativescript-community/ui-material-bottomsheet";
install();
Vue.use(BottomSheetPlugin);

import CanvasSVG from '@nativescript-community/ui-svg/vue';
Vue.use(CanvasSVG);

import store from './store';

Vue.use(VueDevtools, { host: '192.168.42.10' })
Vue.config.silent = false;

new Vue({
  render: (h) => h('frame', [h(Main)]),
  store
}).$start()
