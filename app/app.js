// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { createApp, registerElement } from 'nativescript-vue';

import { FontIcon, fonticon } from '@nativescript-community/fonticon';
import { BottomSheetPlugin } from '@nativescript-community/ui-material-bottomsheet/vue3';
import { install as installBottomSheet } from '@nativescript-community/ui-material-bottomsheet';
import CanvasSVG from '@nativescript-community/ui-svg/vue';
import ButtonPlugin from '@nativescript-community/ui-material-button/vue';
import SwitchPlugin from '@nativescript-community/ui-material-switch/vue';
import WebView from '@nativescript-community/ui-webview/vue';
import { CheckBox } from '@nstudio/nativescript-checkbox';
import CollectionView from '@nativescript-community/ui-collectionview/vue3';
import RipplePlugin from '@nativescript-community/ui-material-ripple/vue';
import { ImageCacheIt } from '@triniwiz/nativescript-image-cache-it';
import { install as installPersistentBottomSheet } from '@nativescript-community/ui-persistent-bottomsheet';
import PersistentBottomSheetPlugin from '@nativescript-community/ui-persistent-bottomsheet/vue';

import Main from '~/components/Main';
import store from './store';
import { initializeTracing } from './app-trace';

// Initialize app logging
initializeTracing();
ImageCacheIt.enableAutoMM();

// Install BottomSheet plugins
installBottomSheet();
installPersistentBottomSheet();

FontIcon.paths = {
  fa: './assets/css/Font-Awesome.css',
};
FontIcon.loadCssSync();

registerElement('HTMLLabel', () => require('@nativescript-community/ui-label').Label);
registerElement(
  'ImageCacheIt',
  () => require('@triniwiz/nativescript-image-cache-it').ImageCacheIt
);
registerElement('CheckBox', () => CheckBox, {
  model: {
    prop: 'checked',
    event: 'checkedChange',
  },
});

const app = createApp(Main);

app.config.globalProperties.$filters = {
  fonticon: fonticon,
};

app.use(store);
app.use(WebView);
app.use(CollectionView);
app.use(CanvasSVG);
app.use(ButtonPlugin);
app.use(SwitchPlugin);
app.use(RipplePlugin);
app.use(BottomSheetPlugin);
app.use(PersistentBottomSheetPlugin);

app.start();
