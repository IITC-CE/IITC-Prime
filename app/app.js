//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

// import VueDevtools from 'nativescript-vue-devtools'
import Vue from 'nativescript-vue'

import Main from '~/components/Main'

import { TNSFontIcon, fonticon } from 'nativescript-fonticon'
TNSFontIcon.paths = { 'fa': './assets/css/Font-Awesome.css' }
TNSFontIcon.loadCss()
Vue.filter('fonticon', fonticon)

import BottomSheetPlugin from '@nativescript-community/ui-material-bottomsheet/vue';
import { install } from "@nativescript-community/ui-material-bottomsheet";
install();
Vue.use(BottomSheetPlugin);

import CanvasSVG from '@nativescript-community/ui-svg/vue';
Vue.use(CanvasSVG);

import store from './store';

// Vue.use(VueDevtools, { host: '192.168.42.10' })
Vue.config.silent = false;

new Vue({
  render: (h) => h('frame', [h(Main)]),
  store
}).$start()
