// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <ListView
    v-bind="$attrs"
    class="list-view"
    :items="listItems"
    :itemTemplateSelector="templateSelector"
    separatorColor="#00000000"
    iosEstimatedRowHeight="44"
    @loaded="hideListSeparators"
    @itemLoading="disableListItemHighlight"
  >
    <template #default="{ item }">
      <Label text="Unknown item type" />
    </template>

    <template #action-buttons-group="{ item }">
      <GridLayout columns="*, 8, *, 8, *, 8, *" class="block action-buttons-block">
        <StackLayout
          v-for="(button, index) in item.buttons"
          :key="button.id"
          :col="index * 2"
          class="btn-quick"
          v-on="pressFeedback"
          @tap="onActionButtonTap(button.id)"
        >
          <StackLayout class="btn-quick-wrapper">
            <Label
              class="ms btn-quick-icon"
              :text="$filters.fonticon(button.icon)"
              horizontalAlignment="center"
            />
            <Label class="btn-quick-text" :text="button.text" horizontalAlignment="center" />
          </StackLayout>
        </StackLayout>
      </GridLayout>
    </template>

    <template #navigation-item="{ item }">
      <StackLayout
        class="list-item"
        :class="{ 'list-item--first': item.isFirst, 'list-item--last': item.isLast }"
        v-on="pressFeedback"
        @tap="onNavigationItemTap(item.id)"
      >
        <GridLayout columns="auto, *" height="100%">
          <Label class="ms list-item-icon" :text="$filters.fonticon(item.icon)" col="0" />
          <Label class="list-item-title" :text="item.text" col="1" verticalAlignment="center" />
          <ContentView
            v-if="isIOS"
            col="1"
            class="list-separator"
            :visibility="item.isLast ? 'collapse' : 'visible'"
          />
        </GridLayout>
      </StackLayout>
    </template>

    <template #select-fields-group="{ item }">
      <GridLayout :columns="pairColumns" rows="28, auto" class="block">
        <!-- Highlighter column -->
        <Label
          v-if="item.fields[0].visible"
          col="0"
          row="0"
          class="select-label"
          :text="item.fields[0].label"
        />
        <SelectField
          v-if="item.fields[0].visible"
          col="0"
          row="1"
          :items="item.fields[0].items"
          :selectedIndex="item.fields[0].items.indexOf(item.fields[0].selectedValue)"
          :title="$L('layers.select_highlighter')"
          immediateChange
          class="select-field--compact list-item--top-left list-item--bottom-left"
          @change="onHighlighterSelected"
        />

        <!-- Base layer column -->
        <Label
          v-if="item.fields[1].visible"
          :col="pairStep"
          row="0"
          class="select-label"
          :text="item.fields[1].label"
        />
        <SelectField
          v-if="item.fields[1].visible"
          :col="pairStep"
          row="1"
          :items="item.fields[1].items"
          :selectedIndex="item.fields[1].selectedIndex"
          idField="layerId"
          textField="name"
          :title="$L('layers.select_base_layer')"
          immediateChange
          class="select-field--compact list-item--top-right list-item--bottom-right"
          @change="onBaseLayerSelected"
        />
        <ContentView v-if="isIOS" col="1" row="1" class="list-separator list-separator--vertical" />
      </GridLayout>
    </template>

    <template #portal-icons-group="{ item }">
      <GridLayout
        columns="*, *, *, *, *, *, *, *, *"
        rows="52"
        class="block portal-icons-row"
        @loaded="onPortalRowLoaded"
      >
        <template v-for="(portal, index) in item.portals" :key="portal.layerId">
          <GridLayout
            v-if="index <= 8"
            :col="index"
            class="portal-icon-cell"
            v-on="pressFeedback"
            @tap="onOverlayPortalToggle($event, portal.index)"
            :class="{
              'portal-icon-cell--active':
                $store.state.map.overlayLayers[portal.index]?.active === true,
              'portal-icon-cell--first': index === 0,
              'portal-icon-cell--last': index === 8,
            }"
          >
            <SVGView
              class="overlay-portal"
              :src="
                '~/assets/icons/portals/portal_L' +
                index +
                '_' +
                String(!!$store.state.map.overlayLayers[portal.index]?.active) +
                '.svg'
              "
              stretch="aspectFit"
            />
          </GridLayout>
        </template>
      </GridLayout>
    </template>

    <template #switch-pair="{ item }">
      <GridLayout
        :columns="pairColumns"
        rows="auto"
        class="switch-pair-block"
        :class="{
          'switch-pair-block--first': item.isFirst,
          'switch-pair-block--last': item.isLast,
        }"
      >
        <GridLayout
          v-for="(switchItem, colIndex) in item.items"
          :key="switchItem.layerId"
          :col="colIndex * pairStep"
          class="list-item"
          :class="{
            'list-item--top-left': switchItem.isTopLeft,
            'list-item--top-right': switchItem.isTopRight,
            'list-item--bottom-left': switchItem.isBottomLeft,
            'list-item--bottom-right': switchItem.isBottomRight,
          }"
          columns="*, auto"
          rows="*"
          v-on="switchRowFeedback"
          @tap="onOverlayToggle(switchItem.index)"
        >
          <Label class="overlay-item-label" :text="switchItem.name" col="0" row="0" />
          <AppSwitch
            class="switch list-item-trailing"
            @checkedChange="args => onOverlayToggle(switchItem.index, args.value)"
            :checked="$store.state.map.overlayLayers[switchItem.index]?.active"
            col="1"
            row="0"
          />
          <ContentView
            v-if="isIOS"
            colSpan="2"
            class="list-separator"
            :visibility="
              switchItem.isBottomLeft || switchItem.isBottomRight ? 'collapse' : 'visible'
            "
          />
        </GridLayout>
        <ContentView v-if="isIOS" col="1" class="list-separator list-separator--vertical" />
      </GridLayout>
    </template>

    <template #switch-single="{ item }">
      <GridLayout
        class="list-item"
        :class="{ 'list-item--first': item.isFirst, 'list-item--last': item.isLast }"
        columns="*, auto"
        rows="*"
        v-on="switchRowFeedback"
        @tap="onOverlayToggle(item.item.index)"
      >
        <Label class="overlay-item-label" :text="item.item.name" col="0" row="0" />
        <AppSwitch
          class="switch list-item-trailing"
          @checkedChange="args => onOverlayToggle(item.item.index, args.value)"
          :checked="$store.state.map.overlayLayers[item.item.index]?.active"
          col="1"
          row="0"
        />
        <ContentView
          v-if="isIOS"
          colSpan="2"
          class="list-separator"
          :visibility="item.isLast ? 'collapse' : 'visible'"
        />
      </GridLayout>
    </template>
  </ListView>
</template>

<script>
import SelectField from '@/components/base/SelectField.vue';
import AppSwitch from '@/components/base/AppSwitch.vue';
import { $navigateTo } from 'nativescript-vue';
import { isIOS } from '@nativescript/core';
import {
  disableListItemHighlight,
  hideListSeparators,
  pressFeedback,
  switchRowFeedback,
} from '@/utils/platform/ui';
import SettingsView from '@/components/Settings/SettingsView';
import PluginsView from '@/components/Settings/PluginsView';

export default {
  name: 'AppControlListView',
  inheritAttrs: false,

  components: {
    AppSwitch,
    SelectField,
  },

  props: {
    listItems: {
      type: Array,
      required: true,
    },
  },

  data() {
    return {
      settingsScreen: SettingsView,
      pluginsScreen: PluginsView,
      isIOS,
      pressFeedback,
      switchRowFeedback,
      // iOS joins the two cells of a row into one card, Android keeps a gap between them
      pairColumns: isIOS ? '*, *' : '*, 2, *',
      pairStep: isIOS ? 1 : 2,
    };
  },

  methods: {
    disableListItemHighlight,
    hideListSeparators,

    onPortalRowLoaded(args) {
      if (args.object.android) {
        args.object.android.setClipToPadding(false);
        args.object.android.setClipChildren(false);
      }
    },

    // Template selector function - determines which template to use
    templateSelector(data) {
      const validTypes = [
        'action-buttons-group',
        'navigation-item',
        'select-fields-group',
        'portal-icons-group',
        'switch-pair',
        'switch-single',
      ];
      const itemType = data.item.type;
      return validTypes.includes(itemType) ? itemType : 'default';
    },

    onActionButtonTap(buttonId) {
      switch (buttonId) {
        case 'settings':
          this.openSettings();
          break;
        case 'plugins':
          this.openPlugins();
          break;
        case 'debug':
          this.toggleDebugMode();
          break;
        case 'reload':
          this.reloadWebView();
          break;
      }
    },

    onNavigationItemTap(paneName) {
      if (this.$store.getters['settings/isDesktopMode']) {
        this.$store.dispatch(
          'map/executeJavaScript',
          `window.chat.chooseTab('${paneName}'); window.chat.toggle(); true`
        );
      } else {
        this.switchToPane(paneName);
      }
    },

    onBaseLayerSelected(args) {
      const id = args.selectedId;
      if (id !== undefined && id !== this.$store.state.map.baseLayerSelected) {
        this.$store.dispatch('map/setActiveBaseLayer', id);
      }
    },

    onOverlayPortalToggle(e, index) {
      const currentLayer = this.$store.state.map.overlayLayers[index];
      const active = !currentLayer.active;
      e.object.getChildAt(0).src =
        '~/assets/icons/portals/portal_L' + index + '_' + String(active) + '.svg';
      this.$store.dispatch('map/setOverlayLayerProperty', { index, active });
    },

    onOverlayToggle(index, value) {
      if (typeof value === 'boolean') {
        const currentLayer = this.$store.state.map.overlayLayers[index];
        if (!currentLayer || currentLayer.active === value) return;
        this.$store.dispatch('map/setOverlayLayerProperty', { index, active: value });
      } else if (!isIOS) {
        // Row tap, see switchRowFeedback
        const currentLayer = this.$store.state.map.overlayLayers[index];
        if (currentLayer) {
          this.$store.dispatch('map/setOverlayLayerProperty', {
            index,
            active: !currentLayer.active,
          });
        }
      }
    },

    onHighlighterSelected(args) {
      if (args.item && this.$store.state.map.highlighterSelected !== args.item) {
        this.$store.dispatch('map/setActiveHighlighter', args.item);
      }
    },

    // Action button methods
    openSettings() {
      $navigateTo(this.settingsScreen, {
        animated: true,
        transition: {
          name: 'slideLeft',
          duration: 300,
        },
      });
    },

    openPlugins() {
      $navigateTo(this.pluginsScreen, {
        animated: true,
        transition: {
          name: 'slideLeft',
          duration: 300,
        },
      });
    },

    toggleDebugMode() {
      this.$store.dispatch('ui/toggleDebugMode');
    },

    reloadWebView() {
      this.$store.dispatch('ui/reloadWebView');
    },

    switchToPane(name) {
      this.$store.dispatch('navigation/setCurrentPane', name);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.list-view {
  margin-left: $spacing-panel;
  margin-right: $spacing-panel;
}

.block {
  padding: 0;
  margin: 0;
  padding-bottom: $spacing-m;
  background-color: $surface;
}

.action-buttons-block {
  padding-top: $spacing-s;
  padding-bottom: $spacing-m;
}

.btn-quick {
  padding: $spacing-s $spacing-xxs;
  border-radius: $radius-large;
  background-color: $surface-container;
  box-shadow: 0 2 4 rgba(0, 0, 0, 0.05);

  &:highlighted {
    background-color: $surface-container-high;
  }
}

.btn-quick-wrapper {
  padding: $spacing-xs 0;
}

.btn-quick-icon {
  color: $on-surface;
  text-align: center;
  margin-bottom: $spacing-xxs;
}

.btn-quick-text {
  font-size: $font-size-small;
  color: $on-surface;
  text-align: center;
}

.select-label {
  font-size: $font-size-small;
  color: $on-surface-variant;
}

.portal-icons-row {
  background-color: $surface;
  padding-left: $spacing-s;
  padding-right: $spacing-s;
  margin-bottom: 3;
}

.portal-icon-cell {
  &--active {
    background-color: $surface-container;
  }

  &:highlighted {
    background-color: $surface-container;
  }

  &--active:highlighted {
    background-color: $surface-container-high;
  }

  &--first {
    border-top-left-radius: $radius-large;
    border-bottom-left-radius: $radius-large;
    padding-left: $spacing-s;
    margin-left: -$spacing-s;
  }

  &--last {
    border-top-right-radius: $radius-large;
    border-bottom-right-radius: $radius-large;
    padding-right: $spacing-s;
    margin-right: -$spacing-s;
  }
}

.overlay-portal {
  height: 38;
  horizontal-align: center;
  vertical-align: middle;
}

.switch {
  vertical-align: center;
}

.switch-pair-block {
  padding: 0;

  &--last {
    padding-bottom: $spacing-m;
  }
}

// Smaller than row text elsewhere, so that a name and a switch fit into half a row
.overlay-item-label {
  vertical-align: center;
  font-size: $font-size;
}
</style>
