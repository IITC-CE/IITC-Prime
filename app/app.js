// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { createApp, registerElement } from 'nativescript-vue';
import { Application, Utils, isAndroid } from '@nativescript/core';

import { FontIcon, fonticon } from '@nativescript-community/fonticon';
import { l, loadLocaleJSON } from '@nativescript-community/l';
import { BottomSheetPlugin } from '@nativescript-community/ui-material-bottomsheet/vue3';
import { install as installBottomSheet } from '@nativescript-community/ui-material-bottomsheet';
import CanvasSVG from '@nativescript-community/ui-svg/vue';
import ButtonPlugin from '@nativescript-community/ui-material-button/vue';
import SwitchPlugin from '@nativescript-community/ui-material-switch/vue';
import WebViewX from '@modos189/nativescript-webview-x/vue';
import { CheckBox } from '@nstudio/nativescript-checkbox';
import CollectionView from '@nativescript-community/ui-collectionview/vue3';
import SwipeMenuPlugin from '@nativescript-community/ui-collectionview-swipemenu/vue3';
import RipplePlugin from '@nativescript-community/ui-material-ripple/vue';
import { install as installPersistentBottomSheet } from '@nativescript-community/ui-persistent-bottomsheet';
import PersistentBottomSheetPlugin from '@nativescript-community/ui-persistent-bottomsheet/vue3';
import { initSentry, setupVueErrorHandler } from './sentry';

import Main from '~/components/Main';
import store from './store';
import { initializeTracing } from './app-trace';
import { getStatusBarHeight } from '@/utils/platform/ui';
import { setAndroidDefaultUA } from '~/utils/webview/user-agent';

// Initialize app logging
initializeTracing();
initSentry();

loadLocaleJSON(require('./i18n/en.default.json'));

// Install BottomSheet plugins
installBottomSheet();
installPersistentBottomSheet();

FontIcon.paths = {
  fa: './assets/css/Font-Awesome.css',
};
FontIcon.loadCssSync();

registerElement('HTMLLabel', () => require('@nativescript-community/ui-label').Label);
registerElement('CheckBox', () => CheckBox, {
  model: {
    prop: 'checked',
    event: 'checkedChange',
  },
});

if (isAndroid) {
  try {
    setAndroidDefaultUA(
      android.webkit.WebSettings.getDefaultUserAgent(Utils.android.getApplicationContext())
    );
  } catch (e) {
    console.error('Failed to read default WebView UA:', e);
  }

  Application.android.on('activityCreated', args => {
    const activity = args.activity;
    if (activity instanceof androidx.activity.ComponentActivity) {
      androidx.activity.EdgeToEdge.enable(
        activity,
        androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
        androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
      );
    }
    // Seed initial top inset from Android resources (before the first inset dispatch)
    store.dispatch('ui/setScreenSafeArea', { top: getStatusBarHeight() });
  });
}

const app = createApp(Main);

setupVueErrorHandler(app);

app.config.globalProperties.$filters = {
  fonticon: fonticon,
};
app.config.globalProperties.$L = l;

app.use(store);
app.use(WebViewX);
app.use(CollectionView);
app.use(CanvasSVG);
app.use(ButtonPlugin);
app.use(SwitchPlugin);
app.use(RipplePlugin);
app.use(BottomSheetPlugin);
app.use(PersistentBottomSheetPlugin);
app.use(SwipeMenuPlugin);

app.start();
