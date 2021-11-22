import { eventBus } from '~/app'

export const router = (eventData) => {
  if (eventData.setLayers) {

    const base_layers = JSON.parse(eventData.setLayers.base_layer);
    eventBus.$emit('bridgeBaseLayers', base_layers);

    const overlay_layer = JSON.parse(eventData.setLayers.overlay_layer);
    eventBus.$emit('bridgeOverlayLayers', overlay_layer);
  }
}
