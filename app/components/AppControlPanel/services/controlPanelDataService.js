// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

export class ControlPanelDataService {
  static generateListData(activeButton, store) {
    switch(activeButton) {
      case 'quick':
      case null:
        return this.getQuickAccessData(store);
      case 'layers':
        return this.getLayersData(store);
      case 'search':
        return this.getSearchData(store);
      default:
        return this.getQuickAccessData(store);
    }
  }

  static getQuickAccessData(store) {
    const data = [
      {
        type: 'action-buttons-group',
        id: 'action-buttons',
        buttons: [
          { id: 'settings', icon: 'fa-tools', text: 'Settings' },
          { id: 'plugins', icon: 'fa-toolbox', text: 'Plugins' },
          { id: 'debug', icon: 'fa-terminal', text: 'Debug' },
          { id: 'reload', icon: 'fa-redo', text: 'Reload IITC' }
        ]
      }
    ];

    // Add navigation items from store
    const filteredPanes = this.getFilteredPanes(store.state.navigation.panes);
    filteredPanes.forEach(pane => {
      data.push({
        type: 'navigation-item',
        id: pane.name,
        icon: pane.icon,
        text: pane.label
      });
    });

    return data;
  }

  static getLayersData(store) {
    const data = [];

    // Add select fields group if there are highlighters or base layers
    const highlightersList = store.state.map.highlightersList;
    const baseLayersList = store.state.map.baseLayersList;

    if ((highlightersList && highlightersList.length > 0) || (baseLayersList && baseLayersList.length > 0)) {
      data.push({
        type: 'select-fields-group',
        id: 'select-fields',
        fields: [
          {
            type: 'highlighter',
            label: 'Highlighter',
            items: highlightersList,
            selectedValue: store.state.map.highlighterSelected,
            visible: highlightersList && highlightersList.length > 0
          },
          {
            type: 'base-layer',
            label: 'Base layer',
            items: baseLayersList,
            selectedIndex: store.state.map.baseLayerSelected,
            visible: baseLayersList && baseLayersList.length > 0
          }
        ]
      });
    }

    // Add portal icons group (first 9 overlay layers)
    const overlayLayers = store.state.map.overlayLayers;
    if (overlayLayers && overlayLayers.length > 0) {
      data.push({
        type: 'portal-icons-group',
        id: 'portal-icons',
        portals: overlayLayers.slice(0, 9).map((layer, index) => ({
          ...layer,
          index
        }))
      });

      // Add switch items for remaining layers
      const switchItems = this.generateSwitchItems(overlayLayers);
      data.push(...switchItems);
    }

    return data;
  }

  static getSearchData(store) {
    // Search view is currently empty
    return [];
  }

  static generateSwitchItems(overlayLayers) {
    const filteredLayers = overlayLayers
      .map((layer, index) => ({ ...layer, index }))
      .filter(layer => layer.index > 8);

    const items = [];

    // First 4 items as pairs (2 per row)
    const pairedItems = filteredLayers.slice(0, 4);
    for (let i = 0; i < pairedItems.length; i += 2) {
      const pair = pairedItems.slice(i, i + 2);
      if (pair.length === 2) {
        items.push({
          type: 'switch-pair',
          id: `switch-pair-${i/2}`,
          items: pair
        });
      } else if (pair.length === 1) {
        items.push({
          type: 'switch-single',
          id: `switch-single-${pair[0].index}`,
          item: pair[0]
        });
      }
    }

    // Remaining items as single switches
    const singleItems = filteredLayers.slice(4);
    singleItems.forEach(item => {
      items.push({
        type: 'switch-single',
        id: `switch-single-${item.index}`,
        item
      });
    });

    return items;
  }

  static getFilteredPanes(panes) {
    const START_EXCLUDE = 3;
    const END_EXCLUDE = 5;
    return panes.filter((_, index) => index < START_EXCLUDE || index >= END_EXCLUDE);
  }
}
