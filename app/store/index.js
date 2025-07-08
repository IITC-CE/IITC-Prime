//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { createStore } from 'vuex';
import { ui } from './modules/ui';
import { navigation } from './modules/navigation';
import { map } from './modules/map';
import { debug } from './modules/debug';
import { manager } from './modules/manager';
import { settings } from './modules/settings';

const debug_enabled = process.env.NODE_ENV !== 'production';

export default createStore({
  modules: {
    ui,
    navigation,
    map,
    debug,
    manager,
    settings,
  },
  strict: debug_enabled
});
