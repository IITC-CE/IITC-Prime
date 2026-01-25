// Copyright (C) 2024-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { INGRESS_INTEL_MAP } from '@/utils/url-config';

export const ui = {
  namespaced: true,
  state: () => ({
    screenHeight: 0,
    isWebviewLoaded: false,
    isIitcLoaded: false,
    progress: 0,
    isDebugActive: false,
    currentUrl: INGRESS_INTEL_MAP,

    // Panel configuration
    mapStateBarHeight: 46,

    // Active panel in sliding panel (quick, search, layers)
    activePanel: 'quick',

    // Panel state
    panelState: {
      isOpen: false,
      position: 'BOTTOM', // Current position name for compatibility
      positionValue: 0, // Current position value for compatibility
    },

    // Panel command for programmatic control
    panelCommand: {
      action: '',
      timestamp: 0,
    },

    // Safe area inset for WebView bottom padding (in pixels)
    safeAreaBottomInset: 10,
  }),

  mutations: {
    SET_SCREEN_HEIGHT(state, height) {
      state.screenHeight = height;
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
    SET_CURRENT_URL(state, url) {
      state.currentUrl = url;
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
        timestamp: Date.now(),
      };
    },

    // Update panel state - single property
    UPDATE_PANEL_STATE(state, { key, value }) {
      if (key in state.panelState) {
        state.panelState[key] = value;
      }
    },

    // Set safe area bottom inset
    SET_SAFE_AREA_INSET(state, value) {
      state.safeAreaBottomInset = value;
    },
  },

  actions: {
    setScreenHeight({ commit }, height) {
      commit('SET_SCREEN_HEIGHT', height);
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
    setCurrentUrl({ commit }, url) {
      commit('SET_CURRENT_URL', url);
    },

    // Set active panel
    setActivePanel({ commit }, panelName) {
      commit('SET_ACTIVE_PANEL', panelName);
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
    },

    // Set safe area insets
    setSafeAreaInsets({ commit }, bottomPx) {
      commit('SET_SAFE_AREA_INSET', bottomPx);
    },
  },
};
