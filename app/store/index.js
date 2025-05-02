//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import Vue from 'nativescript-vue';
import Vuex from 'vuex';
import { ui } from './modules/ui';
import { navigation } from './modules/navigation';
import { map } from './modules/map';
import { debug } from './modules/debug';

Vue.use(Vuex);

const debug_enabled = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    ui,
    navigation,
    map,
    debug
  },
  strict: debug_enabled
});
