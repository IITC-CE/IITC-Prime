//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <StackLayout>

    <GridLayout
      columns="*, 8, *"
      rows="auto, auto"
      class="block"
      v-if="(highlightersList && highlightersList.length > 0) || (baseLayersList && baseLayersList.length > 0)"
    >
      <!-- Highlighter column -->
      <Label
        col="0"
        row="0"
        class="select-label"
        text="Highlighter"
        v-if="highlightersList && highlightersList.length > 0"
      />
      <SelectField
        col="0"
        row="1"
        :items="highlightersList"
        :selectedIndex="highlightersList.indexOf(highlighterSelected)"
        title="Select Highlighter"
        @change="onHighlighterSelected"
        v-if="highlightersList && highlightersList.length > 0"
      />

      <!-- Base layer column -->
      <Label
        col="2"
        row="0"
        class="select-label"
        text="Base layer"
        v-if="baseLayersList && baseLayersList.length > 0"
      />
      <SelectField
        col="2"
        row="1"
        :items="baseLayersList"
        :selectedIndex="baseLayerSelected"
        idField="layerId"
        textField="name"
        title="Select Base Layer"
        @change="onBaseLayerSelected"
        v-if="baseLayersList && baseLayersList.length > 0"
      />
    </GridLayout>

    <GridLayout
      columns="*, *, *, *, *, *, *, *, *"
      rows="50"
      class="block"
    >
        <SVGView
          class="overlay-portal"
          :class="{ 'overlay-portal--active': layer.active === true }"
          :col="index"
          v-for="(layer, index) in overlayLayers"
          v-bind:key="layer.layerId"
          v-if="index <= 8"
          @tap="onOverlayPortalToggle($event, index)"
          :src="'~/assets/icons/portals/portal_L'+index+'_'+String(layer.active)+'.svg'"
          stretch="aspectFit"
        />
    </GridLayout>

    <StackLayout class="block">
      <GridLayout
        v-for="(row, rowIndex) in pairedItemRows"
        :key="'row-' + rowIndex"
        columns="*, 8, *"
        rows="auto"
        class="paired-row"
      >
        <GridLayout
          v-for="(item, colIndex) in row"
          :key="item.layerId"
          :col="colIndex * 2"
          class="btn-primary"
          columns="*, 50"
          rows="50"
        >
          <Label
            class="overlay-item-label"
            :text="item.name"
            @tap="onOverlayToggle(item.index, 'label')"
            col="0"
            row="0"
          />
          <Switch
            class="switch"
            :checked="item.active"
            @checkedChange="args => onOverlayToggle(item.index, args.value)"
            col="1"
            row="0"
          />
        </GridLayout>
      </GridLayout>

      <GridLayout
        v-for="layer in singleItems"
        :key="layer.layerId"
        class="list-item"
        columns="*, 50"
        rows="50"
      >
        <Label
          class="overlay-item-label"
          :text="layer.name"
          @tap="onOverlayToggle(layer.index, 'label')"
          col="0"
          row="0"
        />
        <Switch
          class="switch"
          :checked="layer.active"
          @checkedChange="args => onOverlayToggle(layer.index, args.value)"
          col="1"
          row="0"
        />
      </GridLayout>
    </StackLayout>
  </StackLayout>
</template>

<script>
  import SelectField from "@/components/base/SelectField.vue";
  import { mapState } from 'vuex';

  export default {
    data() {
      return {
      }
    },

    components: {
      SelectField
    },

    computed: {
      ...mapState({
        baseLayerSelected: state => state.map.baseLayerSelected,
        baseLayersList: state => state.map.baseLayersList,
        overlayLayers: state => state.map.overlayLayers,
        highlightersList: state => state.map.highlightersList,
        highlighterSelected: state => state.map.highlighterSelected,
      }),
      filteredLayers() {
        return this.overlayLayers
          .map((layer, index) => ({ ...layer, index }))
          .filter(layer => layer.index > 8);
      },
      pairedItemRows() {
        const itemsPerRow = 2;
        const rows = [];
        const pairedItems = this.filteredLayers.slice(0, 4);

        for (let i = 0; i < pairedItems.length; i += itemsPerRow) {
          rows.push(pairedItems.slice(i, i + itemsPerRow));
        }

        return rows;
      },
      singleItems() {
        return this.filteredLayers.slice(4);
      }
    },

    methods: {
      onBaseLayerSelected(args) {
        const id = args.selectedId;
        if (id !== undefined && id !== this.baseLayerSelected) {
          this.$store.dispatch('map/setActiveBaseLayer', id);
        }
      },

      onOverlayPortalToggle(e, index) {
        const active = !this.overlayLayers[index].active;
        e.object.src = '~/assets/icons/portals/portal_L'+index+'_'+String(active)+'.svg';
        this.$store.dispatch('map/setOverlayLayerProperty', {index, active});
      },

      onOverlayToggle(index, value) {
        if (typeof value === 'boolean') {
          // Direct value from switch event
          this.$store.dispatch('map/setOverlayLayerProperty', {index, active: value});
        } else {
          // Label tap - toggle current state
          const currentLayer = this.overlayLayers[index];
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
    }
  };
</script>

<style scoped lang="scss">
  @import '@/app';

  .block {
    margin-bottom: $spacing-m;
  }

  .select-label {
    font-size: $font-small-size;
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

  .overlay-item-label {
    font-size: $font-size;
  }

  .switch {
    width: 50;
  }
</style>
