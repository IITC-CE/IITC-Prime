//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout flexDirection="column">

    <StackLayout orientation="horizontal" class="block">

      <StackLayout class="select_stack">
        <Label class="select_label" text="Highlighter" />
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

      <StackLayout class="select_stack">
        <Label class="select_label" text="Base layer" />
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
          v-if="baseLayersList && baseLayersList.length > 0"
        />
      </StackLayout>

    </StackLayout>

    <GridLayout
      columns="*, *, *, *, *, *, *, *, *"
      rows="50"
      class="block"
    >
        <SVGView
          class="overlay_portal"
          :col="index"
          v-for="(layer, index) in overlayLayers"
          v-bind:key="layer.layerId"
          v-if="index <= 8"
          @tap="onOverlayPortalPropertyChange($event, index)"
          height="90%"
          :src="'~/assets/icons/portals/portal_L'+index+'_'+String(layer.active)+'.svg'"
          stretch="aspectFit"
        />
    </GridLayout>

    <WrapLayout class="overlay_item_stack block">
      <GridLayout
        :class="{ overlay_item: true, overlay_item_half: index <= 12 }"
        columns="*, auto"
        rows="50"
        v-for="(layer, index) in overlayLayers"
        v-bind:key="layer.layerId"
        v-if="index > 8"
      >
        <Label class="overlay_item_label" :text="layer.name" @tap="onOverlayLayerPropertyTap(index)" col="0" :row="index" colSpan="2" />
        <Switch :ref="'overlaySwitch'+index" :checked="layer.active" @checkedChange="onOverlayLayerPropertyChange(index)" col="1" :row="index" colSpan="2" />
      </GridLayout>
    </WrapLayout>

  </FlexboxLayout>
</template>

<script>
  import SelectField from "@/components/base/SelectField.vue";

  export default {
    data() {
      return {
        baseLayerSelected: this.$store.state.map.baseLayerSelected || 0,
        baseLayersList: this.$store.state.map.baseLayersList || [],
        overlayLayers: this.$store.state.map.overlayLayers
      }
    },

    components: {
      SelectField
    },

    methods: {
      onBaseLayerSelected(args) {
        const id = args.selectedId;
        if (id !== undefined && id !== this.baseLayerSelected) {
          this.baseLayerSelected = id;
          this.$store.dispatch('map/setActiveBaseLayer', id);
        }
      },

      onOverlayPortalPropertyChange(e, index) {
        const active = !(this.$store.state.map.overlayLayers[index].active === true);
        e.object.src = '~/assets/icons/portals/portal_L'+index+'_'+String(active)+'.svg';
        this.$store.dispatch('map/setOverlayLayerProperty', {index: index, active: active});
      },

      onOverlayLayerPropertyTap(index) {
        const switch_obj = this.$refs['overlaySwitch' + index][0].nativeView;
        switch_obj.checked = !switch_obj.checked;
      },

      onOverlayLayerPropertyChange(index) {
        const active = this.$refs['overlaySwitch' + index][0].nativeView.checked;
        this.$store.dispatch('map/setOverlayLayerProperty', {index: index, active: active});
      }
    }
  };
</script>

<style scoped lang="scss">
  @import '@/app';

  .block {
    margin-bottom: 10;
  }

  .select_stack {
    width: 50%;
    padding-left: 14;
  }

  .select_label {
    font-size: $font-small-size;
  }

  .overlay_portal {
    margin: 2;
    border-radius: 50%;
    background-color: $surface-variant;
    horizontal-align: center;
  }

  .overlay_item_stack {
    width: 100%;
  }

  .overlay_item {
    border-bottom-width: 1;
    border-bottom-color: $surface-variant;
  }

  .overlay_item_half {
    width: 50%;
    background-color: $surface-variant;

    border-bottom-width: 1;
    border-bottom-color: $surface-variant;
    border-right-width: 1;
    border-right-color: $surface-variant;
  }

  .overlay_item_label {
    font-size: $font-size;
    padding: 15;
  }
</style>
