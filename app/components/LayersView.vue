<template>
  <BottomSheet class="bottom_sheet">

    <FlexboxLayout>

      <StackLayout class="drow_down_stack">
        <label class="drow_down_label" text="Highlighter" />
<!--        <DropDown col="0" class="drop_down" :items="highlighter_layers_list" :selectedIndex="highlighter_layer_selected" row="0" colSpan="2" itemsPadding="10"></DropDown>-->
      </StackLayout>

      <StackLayout class="drow_down_stack">
        <label class="drow_down_label" text="Base layer" />
        <DropDown col="0" class="drop_down" :items="base_layers_list" :selectedIndex="base_layer_selected" row="0" colSpan="2" itemsPadding="10"></DropDown>
      </StackLayout>

    </FlexboxLayout>


<!--      <Button>-->
<!--        <FormattedString>-->
<!--          <Span text="This text has a " />-->
<!--          <Span text="red " style="color: red" />-->
<!--          <Span text="piece of text. " />-->
<!--          <Span text="Also, this bit is italic, " fontStyle="italic" />-->
<!--          <Span text="and this bit is bold." fontWeight="bold" />-->
<!--        </FormattedString>-->
<!--      </Button>-->

  </BottomSheet>
</template>

<script>
  import Vue from 'nativescript-vue'
  Vue.registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown)

  import { eventBus } from '~/app'
  import BottomSheet from './BottomSheet';

  export default {
    data() {
      return {
        base_layer_selected: this.$store.base_layer_selected,
        base_layers_list: this.$store.base_layers_list
      }
    },
    components: { BottomSheet },
    created() {

    }
  }
</script>

<style scoped lang="scss">
  @import '../app';

  .bottom_sheet {
    background-color: $base-bottom-sheet;
  }

  .drow_down_stack {
    width: 50%;
    padding-left: 10;
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
</style>
