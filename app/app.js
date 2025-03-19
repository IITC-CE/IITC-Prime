//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import Vue from 'nativescript-vue'

import { FontIcon, fonticon } from '@nativescript-community/fonticon';
import BottomSheetPlugin from '@nativescript-community/ui-material-bottomsheet/vue';
import CanvasSVG from '@nativescript-community/ui-svg/vue';
import ButtonPlugin from '@nativescript-community/ui-material-button/vue';
import WebViewPlugin from '@nativescript-community/ui-webview/vue';
import { CheckBox } from '@nstudio/nativescript-checkbox';

import Main from '~/components/Main'
import store from './store';

FontIcon.paths = {
  'fa': './assets/css/Font-Awesome.css',
};
FontIcon.loadCssSync();
Vue.filter('fonticon', fonticon);

import { install } from "@nativescript-community/ui-material-bottomsheet";
install();
Vue.use(BottomSheetPlugin);

Vue.use(CanvasSVG);

Vue.use(ButtonPlugin);

Vue.use(WebViewPlugin);

Vue.registerElement(
  'CheckBox',
  () => CheckBox,
  {
    model: {
      prop: 'checked',
      event: 'checkedChange'
    }
  }
);

Vue.config.silent = false;

new Vue({
  render: (h) => h('frame', [h(Main)]),
  store
}).$start()
