//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

export default {
  setAppBarWidth({commit}, property) {
    commit('setAppBarWidth', property);
  },
  setIsOpenedBottomSheet({commit}, status) {
    commit('setIsOpenedBottomSheet', status);
  },

  addPane({commit}, pane) {
    commit('addPane', pane);
  },
  setCurrentPane({commit}, name) {
    commit('setCurrentPane', name);
  },
  // TODO: store base_layers as object: layerId may not be equal to id
  setBaseLayers({commit}, base_layers) {
    const lst = [];
    let active = -1;
    base_layers.forEach(element => {
      lst.push(element.name);
      if (element.active === true) active = element.layerId;
    });
    commit('setBaseLayerSelected', active);
    commit('setBaseLayersList', lst);
  },
  setActiveBaseLayer({commit}, index) {
    commit('setBaseLayerSelected', index);
  },
  setOverlayLayers({commit}, overlay_layers) {
    commit('setOverlayLayers', overlay_layers);
  },
  setOverlayLayerProperty({commit}, property) {
    commit('setOverlayLayerProperty', property);
  },
  setProgress({commit}, property) {
    commit('setProgress', property);
  },
  setLocation({commit}, property) {
    commit('setLocation', property);
  }
}
