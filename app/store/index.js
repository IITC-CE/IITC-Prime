// Copyright (C) 2021-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

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
