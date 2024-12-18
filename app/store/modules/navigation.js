//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

export const navigation = {
  namespaced: true,
  state: () => ({
    panes: [
      { name: "all", label: "All", icon: "fa-list" },
      { name: "faction", label: "Faction", icon: "fa-user-friends" },
      { name: "alerts", label: "Alerts", icon: "fa-bell" },
      { name: "info", label: "Info", icon: "fa-info-circle" },
      { name: "map", label: "Map", icon: "fa-map" }
    ],
    currentPane: "map"
  }),
  mutations: {
    ADD_PANE(state, pane) {
      state.panes.push(pane);
    },
    SET_CURRENT_PANE(state, name) {
      state.currentPane = name;
    }
  },
  actions: {
    addPane({ commit }, pane) {
      commit('ADD_PANE', pane);
    },
    setCurrentPane({ commit }, name) {
      commit('SET_CURRENT_PANE', name);
    }
  }
};
