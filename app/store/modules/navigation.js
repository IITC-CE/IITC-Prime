// Copyright (C) 2024 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

export const navigation = {
  namespaced: true,
  state: () => ({
    panes: [
      { name: 'all', label: 'Chat: All', icon: 'fa-bullhorn' },
      { name: 'faction', label: 'Chat: Faction', icon: 'fa-user-friends' },
      { name: 'alerts', label: 'Alerts', icon: 'fa-bell' },
      { name: 'info', label: 'Portal info', icon: 'fa-info-circle' },
      { name: 'map', label: 'Map', icon: 'fa-map' },
    ],
    currentPane: 'map',
  }),
  mutations: {
    ADD_PANE(state, pane) {
      state.panes.push(pane);
    },
    SET_CURRENT_PANE(state, name) {
      state.currentPane = name;
    },
  },
  actions: {
    addPane({ commit }, pane) {
      commit('ADD_PANE', pane);
    },
    setCurrentPane({ commit }, name) {
      commit('SET_CURRENT_PANE', name);
    },
  },
};
