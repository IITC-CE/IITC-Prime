// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { l } from '@nativescript-community/l';

const DEFAULT_PANES = [
  { name: 'all', label: l('nav.pane.chat_all'), icon: 'fa-bullhorn' },
  { name: 'faction', label: l('nav.pane.chat_faction'), icon: 'fa-user-friends' },
  { name: 'alerts', label: l('nav.pane.alerts'), icon: 'fa-bell' },
  { name: 'info', label: l('nav.pane.info'), icon: 'fa-info-circle' },
  { name: 'map', label: l('nav.pane.map'), icon: 'fa-map' },
];

export const navigation = {
  namespaced: true,
  state: () => ({
    panes: [...DEFAULT_PANES],
    currentPane: 'map',
  }),
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
  },
};
