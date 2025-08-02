// Copyright (C) 2024-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

export const ui = {
  namespaced: true,
  state: () => ({
    screenHeight: 0,
    slidingPanelWidth: 100,
    isWebviewLoaded: false,
    isIitcLoaded: false,
    progress: 0,
    isDebugActive: false,

    // Panel configuration
    mapStateBarHeight: 46,
    panelVisibleHeight: 110,
    panelHeight: 0,

    // Active panel in sliding panel (quick, search, layers)
    activePanel: 'quick',

    // Panel state
    panelState: {
      isOpen: false,
      position: 'BOTTOM',      // Current position ID ('TOP', 'MIDDLE', 'BOTTOM')
      positionValue: 0,        // Actual numeric position value
      positions: {             // Position values for all states
        TOP: 50,
        MIDDLE: 0,
        BOTTOM: 0
      },
      snapThresholds: {        // Thresholds for snapping
        middleToBottom: 0,
        topToMiddle: 0
      }
    },

    // Panel command for programmatic control
    panelCommand: {
      action: '',
      timestamp: 0
    },

    // Device orientation
    isLandscapeOrientation: false
  }),

  mutations: {
    SET_SCREEN_HEIGHT(state, height) {
      state.screenHeight = height;
    },
    SET_SLIDING_PANEL_WIDTH(state, width) {
      state.slidingPanelWidth = width;
    },
    SET_WEBVIEW_LOADED(state, status) {
      state.isWebviewLoaded = status;
    },
    SET_IITC_LOADED(state, status) {
      state.isIitcLoaded = status;
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

    // Update panel configuration
    UPDATE_PANEL_CONFIG(state, { key, value }) {
      if (key in state) {
        state[key] = value;
      }
    },

    // Update panel state - single property
    UPDATE_PANEL_STATE(state, { key, value }) {
      if (key in state.panelState) {
        state.panelState[key] = value;
      }
    },

    // Update panel state - positions object
    UPDATE_PANEL_POSITIONS(state, positions) {
      state.panelState.positions = { ...state.panelState.positions, ...positions };
    },

    // Update panel state - thresholds object
    UPDATE_PANEL_THRESHOLDS(state, thresholds) {
      state.panelState.snapThresholds = { ...state.panelState.snapThresholds, ...thresholds };
    },

    // Set landscape orientation
    SET_LANDSCAPE_ORIENTATION(state, isLandscape) {
      state.isLandscapeOrientation = isLandscape;
    }
  },

  actions: {
    setScreenHeight({ commit }, height) {
      commit('SET_SCREEN_HEIGHT', height);
    },
    setSlidingPanelWidth({ commit }, width) {
      commit('SET_SLIDING_PANEL_WIDTH', width);
    },
    async setWebviewLoaded({ commit, dispatch }, status) {
      commit('SET_WEBVIEW_LOADED', status);
      // Reset IITC load status, portal status and map status when webview reloads
      if (!status) {
        dispatch('setIitcLoaded', false);
        await dispatch('map/setPortalStatus', null, { root: true });
        await dispatch('map/setMapStatus', null, { root: true });
      }
      if (status) {
        await dispatch('manager/inject', null, { root: true });
      }
    },
    setProgress({ commit }, progress) {
      commit('SET_PROGRESS', progress);
    },
    reloadWebView() {},
    setIitcLoaded({ commit }, status) {
      commit('SET_IITC_LOADED', status);
    },
    iitcBootFinished({ dispatch }) {
      dispatch('setIitcLoaded', true);
    },
    toggleDebugMode({ commit, state }) {
      commit('SET_DEBUG_MODE', !state.isDebugActive);
    },

    // Panel configuration actions
    updatePanelConfig({ commit }, payload) {
      commit('UPDATE_PANEL_CONFIG', payload);
    },

    // Set active panel
    setActivePanel({ commit }, panelName) {
      commit('SET_ACTIVE_PANEL', panelName);
    },

    // Panel state actions
    updatePanelState({ commit }, { key, value }) {
      commit('UPDATE_PANEL_STATE', { key, value });
    },

    // Set panel open state
    setPanelOpenState({ commit }, isOpen) {
      commit('UPDATE_PANEL_STATE', { key: 'isOpen', value: isOpen });
    },

    // Set panel position
    setPanelPosition({ commit }, { position, value }) {
      commit('UPDATE_PANEL_STATE', { key: 'position', value: position });

      if (value !== undefined) {
        commit('UPDATE_PANEL_STATE', { key: 'positionValue', value });
      }
    },

    // Update all position values
    updatePanelPositions({ commit }, positions) {
      commit('UPDATE_PANEL_POSITIONS', positions);
    },

    // Update snap thresholds
    updatePanelThresholds({ commit }, thresholds) {
      commit('UPDATE_PANEL_THRESHOLDS', thresholds);
    },

    // Set landscape orientation
    setLandscapeOrientation({ commit }, isLandscape) {
      commit('SET_LANDSCAPE_ORIENTATION', isLandscape);
    },

    // Recalculate all panel dimensions and positions based on screen size
    recalculatePanelLayout({ commit, state, dispatch }) {
      const { screenHeight, panelVisibleHeight } = state;

      // Set panel height
      const topPosition = 50; // Fixed
      commit('UPDATE_PANEL_CONFIG', {
        key: 'panelHeight',
        value: screenHeight - topPosition
      });

      // Calculate position values
      const positions = {
        BOTTOM: screenHeight - panelVisibleHeight,
        MIDDLE: screenHeight / 2,
        TOP: topPosition
      };

      // Calculate snap thresholds
      const snapThresholds = {
        middleToBottom: (positions.BOTTOM - positions.MIDDLE) / 5,
        topToMiddle: (positions.MIDDLE - positions.TOP) / 5
      };

      // Update state
      dispatch('updatePanelPositions', positions);
      dispatch('updatePanelThresholds', snapThresholds);

      // Keep panel position in sync if panel is at bottom
      if (state.panelState.position === 'BOTTOM') {
        dispatch('setPanelPosition', {
          position: 'BOTTOM',
          value: positions.BOTTOM
        });
      }
    },

    // Switch active panel and open if needed
    switchPanel({ commit, dispatch, state }, panelName) {
      // If panel is closed, always open it with the specified panel
      if (!state.panelState.isOpen) {
        dispatch('setPanelOpenState', true);
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
    closePanel({ commit, dispatch }) {
      dispatch('setPanelOpenState', false);
      commit('SET_ACTIVE_PANEL', 'quick');
      commit('SEND_PANEL_COMMAND', 'close');
    }
  },

  // Add getters for computed values
  getters: {
    // Get position value by position name
    getPanelPositionValue: (state) => (positionName) => {
      return state.panelState.positions[positionName] || 0;
    },

    // Get current panel position value
    currentPanelPositionValue: (state) => {
      return state.panelState.positionValue;
    },

    // Check if panel is closed (at bottom position)
    isPanelClosed: (state) => {
      const tolerance = 10;
      const bottomValue = state.panelState.positions.BOTTOM;
      return Math.abs(state.panelState.positionValue - bottomValue) < tolerance;
    }
  }
};
