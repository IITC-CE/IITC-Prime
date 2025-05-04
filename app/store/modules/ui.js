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

    isPanelOpen: false,
    panelPosition: 'BOTTOM', // Can be 'TOP', 'MIDDLE', 'BOTTOM'
    panelPositionValue: 0,   // Actual numeric position value
    panelPositionValues: {   // Position values for all states
      TOP: 50,
      MIDDLE: 0,
      BOTTOM: 0
    },
    panelVisibleHeight: 110, // Panel height when in BOTTOM position
    isLandscapeOrientation: false, // Screen orientation
    panelSnapThresholds: {   // Thresholds for snapping
      middleToBottom: 0,
      topToMiddle: 0
    },
    panelHeight: 0,          // Total panel height
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
    },

    // Panel position mutations
    SET_PANEL_POSITION(state, position) {
      state.panelPosition = position;
    },

    SET_PANEL_POSITION_VALUE(state, value) {
      state.panelPositionValue = value;
    },

    SET_PANEL_POSITION_VALUES(state, values) {
      state.panelPositionValues = { ...state.panelPositionValues, ...values };
    },

    SET_PANEL_VISIBLE_HEIGHT(state, height) {
      state.panelVisibleHeight = height;
    },

    SET_LANDSCAPE_ORIENTATION(state, isLandscape) {
      state.isLandscapeOrientation = isLandscape;
    },

    SET_PANEL_SNAP_THRESHOLDS(state, thresholds) {
      state.panelSnapThresholds = { ...state.panelSnapThresholds, ...thresholds };
    },

    SET_PANEL_HEIGHT(state, height) {
      state.panelHeight = height;
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

    // Panel position actions
    setPanelPosition({ commit }, { position, value }) {
      commit('SET_PANEL_POSITION', position);
      if (value !== undefined) {
        commit('SET_PANEL_POSITION_VALUE', value);
      }
    },

    setPanelPositionValues({ commit }, values) {
      commit('SET_PANEL_POSITION_VALUES', values);
    },

    setPanelVisibleHeight({ commit }, height) {
      commit('SET_PANEL_VISIBLE_HEIGHT', height);
    },

    setLandscapeOrientation({ commit }, isLandscape) {
      commit('SET_LANDSCAPE_ORIENTATION', isLandscape);
    },

    setPanelSnapThresholds({ commit }, thresholds) {
      commit('SET_PANEL_SNAP_THRESHOLDS', thresholds);
    },

    setPanelHeight({ commit }, height) {
      commit('SET_PANEL_HEIGHT', height);
    },

    // Update panel positions based on screen size
    updatePanelPositions({ commit, state, dispatch }) {
      const { screenHeight, panelVisibleHeight } = state;

      // Calculate position values
      const positionValues = {
        BOTTOM: screenHeight - panelVisibleHeight,
        MIDDLE: screenHeight / 2,
        TOP: 50 // TOP position is fixed
      };

      // Calculate snap thresholds
      const snapThresholds = {
        middleToBottom: (positionValues.BOTTOM - positionValues.MIDDLE) / 5,
        topToMiddle: (positionValues.MIDDLE - positionValues.TOP) / 5
      };

      // Update state
      dispatch('setPanelPositionValues', positionValues);
      dispatch('setPanelSnapThresholds', snapThresholds);
      dispatch('setPanelHeight', screenHeight - positionValues.TOP);

      // Keep panel position in sync
      if (state.panelPosition === 'BOTTOM') {
        dispatch('setPanelPosition', {
          position: 'BOTTOM',
          value: positionValues.BOTTOM
        });
      }
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
  },

  // Add getters for computed values
  getters: {
    // Get position value by position name
    getPanelPositionValue: (state) => (positionName) => {
      return state.panelPositionValues[positionName] || 0;
    },

    // Get current panel position value
    currentPanelPositionValue: (state) => {
      return state.panelPositionValue;
    },

    // Check if panel is closed (at bottom position)
    isPanelClosed: (state) => {
      const tolerance = 10;
      const bottomValue = state.panelPositionValues.BOTTOM;
      return Math.abs(state.panelPositionValue - bottomValue) < tolerance;
    }
  }
};
