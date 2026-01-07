// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <ListView
    v-bind="$attrs"
    class="list-view"
    :items="listItems"
    :itemTemplateSelector="templateSelector"
    separatorColor="#00000000"
    iosEstimatedRowHeight="44"
  >
    <template #default="{ item }">
      <Label text="Unknown item type" />
    </template>

    <template #action-buttons-group="{ item }">
      <GridLayout columns="*, *, *, *" rows="104" class="block action-buttons-block">
        <StackLayout
          v-for="(button, index) in item.buttons"
          :key="button.id"
          :col="index"
          class="btn-quick"
          @tap="onActionButtonTap(button.id)"
        >
          <MDRipple class="btn-quick-btn-icon">
            <Label
              class="fa btn-quick-icon"
              :text="$filters.fonticon(button.icon)"
              horizontalAlignment="center"
            />
          </MDRipple>
          <Label
            class="btn-quick-text"
            :text="button.text"
            horizontalAlignment="center"
            textWrap="true"
          />
        </StackLayout>
      </GridLayout>
    </template>

    <template #navigation-item="{ item }">
      <MDRipple
        class="list-item"
        :class="{ 'list-item--first': item.isFirst, 'list-item--last': item.isLast }"
        orientation="horizontal"
        @tap="onNavigationItemTap(item.id)"
      >
        <Label class="fa icon" :text="$filters.fonticon(item.icon)" col="0" row="0" />
        <Label class="navigation-item-label" :text="item.text" col="1" row="0" />
      </MDRipple>
    </template>

    <template #select-fields-group="{ item }">
      <GridLayout columns="*, 2, *" rows="28, 56" class="block">
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
          title="Select Highlighter"
          class="list-item--top-left list-item--bottom-left"
          @change="onHighlighterSelected"
        />

        <!-- Base layer column -->
        <Label
          v-if="item.fields[1].visible"
          col="2"
          row="0"
          class="select-label"
          :text="item.fields[1].label"
        />
        <SelectField
          v-if="item.fields[1].visible"
          col="2"
          row="1"
          :items="item.fields[1].items"
          :selectedIndex="item.fields[1].selectedIndex"
          idField="layerId"
          textField="name"
          title="Select Base Layer"
          class="list-item--top-right list-item--bottom-right"
          @change="onBaseLayerSelected"
        />
      </GridLayout>
    </template>

    <template #portal-icons-group="{ item }">
      <GridLayout columns="*, *, *, *, *, *, *, *, *" rows="42" class="block">
        <template v-for="(portal, index) in item.portals" :key="portal.layerId">
          <SVGView
            v-if="index <= 8"
            class="overlay-portal"
            :class="{ 'overlay-portal--active': portal.active === true }"
            :col="index"
            @tap="onOverlayPortalToggle($event, portal.index)"
            :src="'~/assets/icons/portals/portal_L' + index + '_' + String(portal.active) + '.svg'"
            stretch="aspectFit"
          />
        </template>
      </GridLayout>
    </template>

    <template #switch-pair="{ item }">
      <GridLayout
        columns="*, 2, *"
        rows="56"
        class="switch-pair-block"
        :class="{
          'switch-pair-block--first': item.isFirst,
          'switch-pair-block--last': item.isLast,
        }"
      >
        <GridLayout
          v-for="(switchItem, colIndex) in item.items"
          :key="switchItem.layerId"
          :col="colIndex * 2"
          class="list-item"
          :class="{
            'list-item--top-left': switchItem.isTopLeft,
            'list-item--top-right': switchItem.isTopRight,
            'list-item--bottom-left': switchItem.isBottomLeft,
            'list-item--bottom-right': switchItem.isBottomRight,
          }"
          columns="*, 56"
          rows="54"
        >
          <Label class="overlay-item-label" :text="switchItem.name" col="0" row="0" />
          <MDSwitch
            class="switch"
            :checked="switchItem.active"
            @checkedChange="args => onOverlayToggle(switchItem.index, args.value)"
            col="1"
            row="0"
          />
        </GridLayout>
      </GridLayout>
    </template>

    <template #switch-single="{ item }">
      <GridLayout
        class="list-item"
        :class="{ 'list-item--first': item.isFirst, 'list-item--last': item.isLast }"
        columns="*, 56"
        rows="54"
        orientation="horizontal"
      >
        <Label class="overlay-item-label" :text="item.item.name" col="0" row="0" />
        <MDSwitch
          class="switch"
          :checked="item.item.active"
          @checkedChange="args => onOverlayToggle(item.item.index, args.value)"
          col="1"
          row="0"
        />
      </GridLayout>
    </template>

    <template #spacer>
      <GridLayout rows="80">
        <Label row="0" text="" />
      </GridLayout>
    </template>
  </ListView>
</template>

<script>
import SelectField from '@/components/base/SelectField.vue';
import { mapState } from 'vuex';
import { $navigateTo } from 'nativescript-vue';
import SettingsView from '@/components/Settings/SettingsView';
import PluginsView from '@/components/Settings/PluginsView';

export default {
  name: 'AppControlListView',
  inheritAttrs: false,

  components: {
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
    };
  },

  computed: {
    ...mapState({
      isDebugActive: state => state.ui.isDebugActive,
    }),
  },

  methods: {
    // Template selector function - determines which template to use
    templateSelector(data) {
      const validTypes = [
        'action-buttons-group',
        'navigation-item',
        'select-fields-group',
        'portal-icons-group',
        'switch-pair',
        'switch-single',
        'spacer',
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

    onNavigationItemTouch(paneName, event) {
      // Use touch events to avoid conflict with gesture handler
      // Only trigger on tap (quick touch without movement)
      if (!this.touchData) {
        this.touchData = {};
      }

      if (event.action === 'down') {
        this.touchData.startTime = Date.now();
        this.touchData.startX = event.getX();
        this.touchData.startY = event.getY();
      } else if (event.action === 'up') {
        const duration = Date.now() - (this.touchData.startTime || 0);
        const deltaX = Math.abs(event.getX() - (this.touchData.startX || 0));
        const deltaY = Math.abs(event.getY() - (this.touchData.startY || 0));
        const distance = deltaX + deltaY;

        // Treat as tap if quick (<300ms) and minimal movement (<15 DIP)
        if (duration < 300 && distance < 15) {
          this.switchToPane(paneName);
        }
      }
    },

    onNavigationItemTap(paneName) {
      this.switchToPane(paneName);
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
      e.object.src = '~/assets/icons/portals/portal_L' + index + '_' + String(active) + '.svg';
      this.$store.dispatch('map/setOverlayLayerProperty', { index, active });
    },

    onOverlayToggle(index, value) {
      if (typeof value === 'boolean') {
        // Direct value from switch event
        this.$store.dispatch('map/setOverlayLayerProperty', { index, active: value });
      } else {
        // Label tap - toggle current state
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
      if (args.item) {
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
  margin-left: $spacing-m;
  margin-right: $spacing-m;
}

.block {
  padding: 0;
  padding-bottom: $spacing-m;
  background-color: $surface;
}

.action-buttons-block {
  padding-top: $spacing-xs;
  padding-bottom: $spacing-xs;
}

.btn-quick {
  font-size: $font-size;
  text-align: center;
  padding: 0 $spacing-s;
}

.btn-quick .btn-quick-btn-icon {
  margin: 0 0 $spacing-xs 0;
  width: 54;
  height: 54;
  border-radius: $radius-large;
  background-color: $surface-bright;
  box-shadow: 0 2 4 rgba(0, 0, 0, 0.05);
  ripple-color: $ripple;
  vertical-alignment: center;
}

.btn-quick .btn-quick-icon {
  font-size: $font-size-headline;
  color: $on-primary;
}

.btn-quick .btn-quick-text {
  color: $text;
}

.icon {
  font-size: 18;
  width: 32;
  vertical-align: center;
  text-align: center;
}

.navigation-item-label {
  font-size: $font-size;
  padding-left: 15;
}

.select-label {
  font-size: $font-small-size;
  color: $on-surface-dark;
}

.overlay-portal {
  border-radius: $radius-large;
  horizontal-align: center;

  &--active {
    background-color: $surface-bright;
    box-shadow: 0 2 5 rgba(0, 0, 0, 0.1);
  }
}

.switch-pair-block {
  padding: 0;

  &--last {
    padding-bottom: $spacing-m;
  }
}

.overlay-item-label {
  height: $spacing-item;
  font-size: $font-size;
}
</style>
