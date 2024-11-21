//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

export default {
  setScreenHeight(state, height) {
    state.screen_height = height;
  },
  setSlidingPanelWidth(state, width) {
    state.sliding_panel_width = width;
  },
  setIsOpenedBottomSheet(state, status) {
    state.is_opened_bottom_sheet = status;
  },
  setIsWebViewLoadFinished(state, status) {
    state.is_webview_load_finished = status;
  },

  addPane(state, pane) {
    state.panes.push(pane);
  },
  setCurrentPane(state, name) {
    state.current_pane = name;
  },
  setBaseLayerSelected(state, index) {
    state.base_layer_selected = index;
  },
  setBaseLayersList(state, data) {
    state.base_layers_list = data;
  },
  setOverlayLayers(state, data) {
    state.overlay_layers = data;
  },
  setOverlayLayerProperty(state, property) {
    state.overlay_layers[property.index].active = property.active;
  },
  setProgress(state, progress) {
    state.progress = progress;
  },
  setLocation(state, location) {
    state.location = location;
  },
  setInjectPlugin(state, injectPlugin) {
    state.injectPlugin = injectPlugin;
  }
}
