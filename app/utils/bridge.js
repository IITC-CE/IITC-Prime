import store from '~/store';

export const router = (eventData) => {
  console.log("JSBridge router data");
  console.log(eventData);

  if (eventData.setLayers) {

    const base_layers = JSON.parse(eventData.setLayers.base_layer);
    store.dispatch('setBaseLayers', base_layers);

    const overlay_layer = JSON.parse(eventData.setLayers.overlay_layer);
    store.dispatch('setOverlayLayers', overlay_layer);
  }
}

export const injectBridgeIITC = () => {
  let bridge = "window.android = window.nsWebViewBridge;";
  const events = {
    setLayers: ["base_layer", 'overlay_layer'],
    setPermalink: ["href"]
  }
  Object.entries(events).forEach(entry => {
    const [key, value] = entry;
    bridge += "\n" +
      "window.nsWebViewBridge."+key+" = function("+value.join(', ')+") {" +
      " window.nsWebViewBridge.emit('JSBridge', {'"+key+"': {"+value.map(name => "'"+name+"': "+name).join(', ')+"}}); " +
      "};"
  });
  return bridge;
}

export const setLayerIITC = (layer) => {
  return "window.layerChooser.showLayer(" + layer.layerId + "," + layer.active + ");";
}
