<template>
  <BottomSheet class="bottom_sheet">

    <StackLayout orientation="horizontal" class="block">

      <StackLayout class="drow_down_stack">
        <label class="drow_down_label" text="Highlighter" />
<!--        <DropDown col="0" class="drop_down" :items="highlighter_layers_list" :selectedIndex="highlighter_layer_selected" row="0" colSpan="2" itemsPadding="10"></DropDown>-->
      </StackLayout>

      <StackLayout class="drow_down_stack">
        <label class="drow_down_label" text="Base layer" />
        <DropDown col="0" class="drop_down" :items="base_layers_list" :selectedIndex="base_layer_selected" row="0" colSpan="2" itemsPadding="10"></DropDown>
      </StackLayout>

    </StackLayout>

    <GridLayout
      columns="*, *, *, *, *, *, *, *, *"
      rows="50"
      class="block"
    >
        <SVGView
          :class="{ overlay_portal: true, active: layer.active === true }"
          :col="index"
          v-for="(layer, index) in overlay_layers"
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
        v-for="(layer, index) in overlay_layers"
        v-bind:key="layer.layerId"
        v-if="index > 8"
      >
        <Label class="overlay_item_label" :text="layer.name" @tap="onOverlayLayerPropertyTap(index)" col="0" :row="index" colSpan="2" />
        <Switch :ref="'overlaySwitch'+index" :checked="layer.active" @checkedChange="onOverlayLayerPropertyChange(index)" col="1" :row="index" colSpan="2" />
      </GridLayout>
    </WrapLayout>

  </BottomSheet>
</template>

<script>
  import Vue from 'nativescript-vue'
  Vue.registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown)

  import store from '~/store';
  import BottomSheet from './BottomSheet';

  export default {
    data() {
      return {
        base_layer_selected: this.$store.state.base_layer_selected,
        base_layers_list: this.$store.state.base_layers_list,
        overlay_layers: this.$store.state.overlay_layers
      }
    },
    components: { BottomSheet },
    created() {
    },
    methods: {
      onOverlayPortalPropertyChange(e, index) {
        const active = !(this.$store.state.overlay_layers[index].active === true);
        e.object.src = '~/assets/icons/portals/portal_L'+index+'_'+String(active)+'.svg';
        store.dispatch('setOverlayLayerProperty', {index: index, active: active});
      },
      onOverlayLayerPropertyTap(index) {
        const switch_obj = this.$refs['overlaySwitch' + index][0].nativeView;
        switch_obj.checked = !switch_obj.checked;
      },
      onOverlayLayerPropertyChange(index) {
        const active = this.$refs['overlaySwitch' + index][0].nativeView.checked;
        store.dispatch('setOverlayLayerProperty', {index: index, active: active});
      }
    }
  }
</script>

<style scoped lang="scss">
  @import '../app';

  .bottom_sheet {
    background-color: $base-bottom-sheet;
  }

  .block {
    margin-bottom: 10;
  }

  .drow_down_stack {
    width: 50%;
    padding-left: 14;
  }

  .drow_down_label {
    font-size: 14;
  }

  .drop_down {
    font-size: 16;
    color: $text-bottom-sheet;

    // Hack to remove arrow on the right
    // https://github.com/PeterStaev/NativeScript-Drop-Down/issues/91#issuecomment-336069519
    /*border-color: rgba(0, 0, 0, 0);*/
    /*border-width: 1;*/
    /*border-style: solid;*/
  }

  .overlay_portal {
    margin: 2;
    border-radius: 50%;
    background-color: $complementary-bottom-sheet;
    opacity: 0.5;
    horizontal-align: center;
  }

  .overlay_portal.active {
    opacity: 1;
  }

  .overlay_item_stack {
    width: 100%;
  }

  .overlay_item {
    border-bottom-width: 1;
    border-bottom-color: $complementary-bottom-sheet;
  }

  .overlay_item_half {
    width: 50%;
    background-color: $complementary-bottom-sheet;

    border-bottom-width: 1;
    border-bottom-color: $base-bottom-sheet;
    border-right-width: 1;
    border-right-color: $base-bottom-sheet;
  }

  .overlay_item_label {
    font-size: 16;
    padding: 14;
  }
</style>
