//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <ListView
    :items="listItems"
    :itemTemplateSelector="templateSelector"
    @itemTap="onItemTap"
    separatorColor="#00000000"
  >
    <template #default="{ item }">
      <Label text="Unknown item type" />
    </template>

    <template #action-buttons-group="{ item }">
      <GridLayout
        columns="*, *, *, *"
        rows="90"
        class="action-buttons-block"
      >
        <StackLayout
          v-for="(button, index) in item.buttons"
          :key="button.id"
          :col="index"
          class="btn"
          @tap="onActionButtonTap(button.id)"
        >
          <Label class="fa icon" :text="$filters.fonticon(button.icon)" horizontalAlignment="center" />
          <Label class="text" :text="button.text" horizontalAlignment="center" />
        </StackLayout>
      </GridLayout>
    </template>

    <template #navigation-item="{ item }">
      <GridLayout
        class="navigation-item"
        columns="42, *"
        rows="42"
        @tap="onNavigationItemTap(item.id)"
      >
        <Label class="fa icon" :text="$filters.fonticon(item.icon)" col="0" row="0" />
        <Label class="navigation-item-label" :text="item.text" col="1" row="0" />
      </GridLayout>
    </template>

    <template #select-fields-group="{ item }">
      <GridLayout
        columns="*, 8, *"
        rows="28, 52"
        class="select-fields-block"
      >
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
          @change="onBaseLayerSelected"
        />
      </GridLayout>
    </template>

    <template #portal-icons-group="{ item }">
      <GridLayout
        columns="*, *, *, *, *, *, *, *, *"
        rows="52"
        class="portal-icons-block"
      >
        <template v-for="(portal, index) in item.portals" :key="portal.layerId">
          <SVGView
            v-if="index <= 8"
            class="overlay-portal"
            :class="{ 'overlay-portal--active': portal.active === true }"
            :col="index"
            @tap="onOverlayPortalToggle($event, portal.index)"
            :src="'~/assets/icons/portals/portal_L'+index+'_'+String(portal.active)+'.svg'"
            stretch="aspectFit"
          />
        </template>
      </GridLayout>
    </template>

    <template #switch-pair="{ item }">
      <GridLayout
        columns="*, 8, *"
        rows="62"
        class="switch-pair-block"
      >
        <GridLayout
          v-for="(switchItem, colIndex) in item.items"
          :key="switchItem.layerId"
          :col="colIndex * 2"
          class="btn-primary"
          columns="*, 50"
          rows="50"
        >
          <Label
            class="overlay-item-label"
            :text="switchItem.name"
            @tap="onOverlayToggle(switchItem.index, 'label')"
            col="0"
            row="0"
          />
          <Switch
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
        class="switch-single-block"
        columns="*, 50"
        rows="50"
      >
        <Label
          class="overlay-item-label"
          :text="item.item.name"
          @tap="onOverlayToggle(item.item.index, 'label')"
          col="0"
          row="0"
        />
        <Switch
          class="switch"
          :checked="item.item.active"
          @checkedChange="args => onOverlayToggle(item.item.index, args.value)"
          col="1"
          row="0"
        />
      </GridLayout>
    </template>
  </ListView>
</template>

<script>
import SelectField from "@/components/base/SelectField.vue";
import { mapState } from 'vuex';
import { $navigateTo } from 'nativescript-vue';
import SettingsView from '@/components/Settings/SettingsView';
import PluginsView from '@/components/Settings/PluginsView';

export default {
  name: 'AppControlListView',

  components: {
    SelectField
  },

  props: {
    listItems: {
      type: Array,
      required: true
    }
  },

  data() {
    return {
      settingsScreen: SettingsView,
      pluginsScreen: PluginsView,
    }
  },

  computed: {
    ...mapState({
      isDebugActive: state => state.ui.isDebugActive
    })
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
        'switch-single'
      ];
      const itemType = data.item.type;
      return validTypes.includes(itemType) ? itemType : 'default';
    },

    onItemTap(args) {
      // Handle general item tap if needed
    },

    onActionButtonTap(buttonId) {
      switch(buttonId) {
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
      e.object.src = '~/assets/icons/portals/portal_L'+index+'_'+String(active)+'.svg';
      this.$store.dispatch('map/setOverlayLayerProperty', {index, active});
    },

    onOverlayToggle(index, value) {
      if (typeof value === 'boolean') {
        // Direct value from switch event
        this.$store.dispatch('map/setOverlayLayerProperty', {index, active: value});
      } else {
        // Label tap - toggle current state
        const currentLayer = this.$store.state.map.overlayLayers[index];
        if (currentLayer) {
          this.$store.dispatch('map/setOverlayLayerProperty', {index, active: !currentLayer.active});
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
          duration: 300
        }
      });
    },

    openPlugins() {
      $navigateTo(this.pluginsScreen, {
        animated: true,
        transition: {
          name: 'slideLeft',
          duration: 300
        }
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
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.action-buttons-block {
  margin-bottom: $spacing-m;
}

.btn {
  font-size: $font-size;
  text-align: center;
  padding: 0 $spacing-s;
}

.btn .icon {
  margin: 0 0 $spacing-xs 0;
  width: 54;
  height: 54;
  font-size: $font-size-headline;
  border-radius: $radius-large;
  color: $on-primary;
  background-color: $surface-bright;
  box-shadow: 0 2 4 rgba(0, 0, 0, 0.05);
}

.btn .text {
  color: $text;
}

.navigation-item {
  margin-bottom: $spacing-xs;
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

.select-fields-block {
  margin-bottom: $spacing-m;
}

.select-label {
  font-size: $font-small-size;
}

.portal-icons-block {
  margin-bottom: $spacing-m;
}

.overlay-portal {
  margin: $spacing-xs;
  border-radius: $radius-large;
  horizontal-align: center;

  &--active {
    background-color: $surface-bright;
    box-shadow: 0 2 5 rgba(0, 0, 0, 0.1);
  }
}

.switch-pair-block {
  margin-bottom: $spacing-xs;
}

.switch-single-block {
  margin-bottom: $spacing-xs;
}

.overlay-item-label {
  font-size: $font-size;
}

.switch {
  width: 50;
}
</style>
