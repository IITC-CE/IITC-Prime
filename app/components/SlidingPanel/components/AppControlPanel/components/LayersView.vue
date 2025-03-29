//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout flexDirection="column">

    <StackLayout orientation="horizontal" class="block">

      <StackLayout class="select-stack">
        <Label class="select-label" text="Highlighter" />
<!--        <PickerField-->
<!--          col="0"-->
<!--          row="0"-->
<!--          colSpan="2"-->
<!--          class="picker-field"-->
<!--          hint="Select highlighter"-->
<!--          :items="highlighterLayersList"-->
<!--          :selectedIndex="highlighterLayerSelected"-->
<!--          @pickerClosed="onHighlighterSelected"-->
<!--          pickerTitle="Select Highlighter Layer"-->
<!--        />-->
      </StackLayout>

      <StackLayout
        class="select-stack"
        v-if="baseLayersList && baseLayersList.length > 0"
      >
        <Label class="select-label" text="Base layer" />
        <SelectField
          col="0"
          row="0"
          colSpan="2"
          :items="baseLayersList"
          :selectedIndex="baseLayerSelected"
          idField="layerId"
          textField="name"
          title="Select Base Layer"
          @change="onBaseLayerSelected"
        />
      </StackLayout>

    </StackLayout>

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

    <WrapLayout class="block">
      <GridLayout
        :class="{ 'overlay-item': true, 'overlay-item-half': index <= 12 }"
        columns="*, auto"
        rows="50"
        v-for="(layer, index) in overlayLayers"
        v-bind:key="layer.layerId"
        v-if="index > 8"
      >
        <Label class="overlay-item-label" :text="layer.name" @tap="onOverlayToggle(index, true)" col="0" :row="index" colSpan="2" />
        <Switch :ref="'overlaySwitch'+index" :checked="layer.active" @checkedChange="onOverlayToggle(index)" col="1" :row="index" colSpan="2" />
      </GridLayout>
    </WrapLayout>

  </FlexboxLayout>
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
        overlayLayers: state => state.map.overlayLayers
      })
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

      onOverlayToggle(index, isLabelTap = false) {
        if (isLabelTap) {
          // Toggle switch state when label is tapped
          const switchEl = this.$refs['overlaySwitch' + index][0].nativeView;
          switchEl.checked = !switchEl.checked;
        } else {
          // Update store based on switch state
          const active = this.$refs['overlaySwitch' + index][0].nativeView.checked;
          this.$store.dispatch('map/setOverlayLayerProperty', {index, active});
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

  .select-stack {
    width: 50%;
    padding-left: $spacing-m;
  }

  .select-label {
    font-size: $font-small-size;
  }

  .overlay-portal {
    margin: $spacing-xs;
    border-radius: $radius-large;
    horizontal-align: center;

    &--active {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .overlay-item {
    border-bottom-width: 1;
    border-bottom-color: $surface-dim;
  }

  .overlay-item-half {
    width: 50%;
    background-color: $surface-container;
    border-bottom-color: $surface-container;
  }

  .overlay-item-label {
    font-size: $font-size;
    padding: 15;
  }
</style>
