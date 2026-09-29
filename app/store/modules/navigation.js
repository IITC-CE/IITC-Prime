// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { l } from '@nativescript-community/l';

const DEFAULT_PANES = [
  { name: 'all', label: l('nav.pane.chat_all'), icon: 'ms-campaign' },
  { name: 'faction', label: l('nav.pane.chat_faction'), icon: 'ms-group' },
  { name: 'alerts', label: l('nav.pane.alerts'), icon: 'ms-notifications' },
  { name: 'info', label: l('nav.pane.info'), icon: 'ms-info' },
  { name: 'map', label: l('nav.pane.map'), icon: 'ms-map' },
];

export const navigation = {
  namespaced: true,
  state: () => ({
    panes: [...DEFAULT_PANES],
    currentPane: 'map',
    // Open IITC dialog IDs, focused one last
    dialogStack: [],
  }),
  getters: {
    topDialog: state => state.dialogStack[state.dialogStack.length - 1] ?? null,
  },
  mutations: {
    ADD_PANE(state, pane) {
      state.panes.push(pane);
    },
    SET_CURRENT_PANE(state, name) {
      state.currentPane = name;
    },
    RESET_PANES(state) {
      state.panes = [...DEFAULT_PANES];
      state.currentPane = 'map';
    },
    DIALOG_OPENED(state, id) {
      if (!state.dialogStack.includes(id)) {
        state.dialogStack.push(id);
      }
    },
    DIALOG_CLOSED(state, id) {
      state.dialogStack = state.dialogStack.filter(d => d !== id);
    },
    DIALOG_FOCUSED(state, id) {
      state.dialogStack = [...state.dialogStack.filter(d => d !== id), id];
    },
    RESET_DIALOGS(state) {
      state.dialogStack = [];
    },
  },
  actions: {
    addPane({ commit }, pane) {
      commit('ADD_PANE', pane);
    },
    setCurrentPane({ commit }, name) {
      commit('SET_CURRENT_PANE', name);
    },
    resetPanes({ commit }) {
      commit('RESET_PANES');
    },
    dialogOpened({ commit }, id) {
      commit('DIALOG_OPENED', id);
    },
    dialogClosed({ commit }, id) {
      commit('DIALOG_CLOSED', id);
    },
    dialogFocused({ commit }, id) {
      commit('DIALOG_FOCUSED', id);
    },
    resetDialogs({ commit }) {
      commit('RESET_DIALOGS');
    },
    // Drop now: a quick second back press must not hit the same dialog before dialogclose arrives
    closeDialog({ commit }, id) {
      commit('DIALOG_CLOSED', id);
    },
  },
};
