//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

export const ui = {
  namespaced: true,
  state: () => ({
    screenHeight: 0,
    slidingPanelWidth: 100,
    isWebviewLoadFinished: false,
    progress: 0,
    isDebugActive: false
  }),
  mutations: {
    SET_SCREEN_HEIGHT(state, height) {
      state.screenHeight = height;
    },
    SET_SLIDING_PANEL_WIDTH(state, width) {
      state.slidingPanelWidth = width;
    },
    SET_WEBVIEW_LOAD_STATUS(state, status) {
      state.isWebviewLoadFinished = status;
    },
    SET_PROGRESS(state, progress) {
      state.progress = progress;
    },
    SET_DEBUG_MODE(state, isActive) {
      state.isDebugActive = isActive;
    }
  },
  actions: {
    setScreenHeight({ commit }, height) {
      commit('SET_SCREEN_HEIGHT', height);
    },
    setSlidingPanelWidth({ commit }, width) {
      commit('SET_SLIDING_PANEL_WIDTH', width);
    },
    setWebviewLoadStatus({ commit }, status) {
      commit('SET_WEBVIEW_LOAD_STATUS', status);
    },
    setProgress({ commit }, progress) {
      commit('SET_PROGRESS', progress);
    },
    reloadWebView() {},
    iitcBootFinished() {},
    toggleDebugMode({ commit, state }) {
      commit('SET_DEBUG_MODE', !state.isDebugActive);
    }
  }
};
