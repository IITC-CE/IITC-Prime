//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

export const ui = {
  namespaced: true,
  state: () => ({
    screenHeight: 0,
    slidingPanelWidth: 100,
    isWebviewLoadFinished: false,
    progress: 0,
    isDebugActive: false,

    // Active panel in sliding panel (quick, search, layers)
    activePanel: 'quick',

    // Panel command
    panelCommand: {
      action: '',
      timestamp: 0
    },

    // Track if panel is open
    isPanelOpen: false
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
    },

    // Set active panel in sliding panel with validation
    SET_ACTIVE_PANEL(state, panelName) {
      const validPanels = ['quick', 'search', 'layers', null];
      state.activePanel = validPanels.includes(panelName) ? panelName : 'quick';
    },

    // Send command to panel
    SEND_PANEL_COMMAND(state, action) {
      state.panelCommand = {
        action,
        timestamp: Date.now()
      };
    },

    // Set panel open state
    SET_PANEL_OPEN_STATE(state, isOpen) {
      state.isPanelOpen = isOpen;
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
    },

    // Set active panel
    setActivePanel({ commit }, panelName) {
      commit('SET_ACTIVE_PANEL', panelName);
    },

    // Set panel open state
    setPanelOpenState({ commit }, isOpen) {
      commit('SET_PANEL_OPEN_STATE', isOpen);
    },

    // Switch active panel and open if needed
    switchPanel({ commit, dispatch, state }, panelName) {
      // If panel is closed, always open it with the specified panel
      if (!state.isPanelOpen) {
        commit('SET_PANEL_OPEN_STATE', true);
        commit('SET_ACTIVE_PANEL', panelName || 'quick');
        commit('SEND_PANEL_COMMAND', 'open');
        return;
      }

      // If same panel, just deactivate
      if (state.activePanel === panelName) {
        commit('SET_ACTIVE_PANEL', null);
        return;
      }

      // Set active panel
      commit('SET_ACTIVE_PANEL', panelName);
    },

    // Close panel
    closePanel({ commit }) {
      commit('SET_PANEL_OPEN_STATE', false);
      commit('SET_ACTIVE_PANEL', 'quick');
      commit('SEND_PANEL_COMMAND', 'close');
    }
  }
};
