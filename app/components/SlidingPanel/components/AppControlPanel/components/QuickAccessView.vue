//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    flexDirection="column"
  >

    <GridLayout
      columns="*, *, *, *"
      class="block"
    >
      <QuickAccessBigButton col="0" icon="fa-tools" name="Settings" />
      <QuickAccessBigButton col="1" icon="fa-toolbox" name="Plugins" />
      <QuickAccessBigButton col="2" icon="fa-terminal" name="Debug" />
      <QuickAccessBigButton col="3" icon="fa-redo" name="Reload IITC" />
    </GridLayout>

    <Label class="separator" />

    <GridLayout
      class="pane_item"
      columns="auto, *"
      rows="50"
      v-for="(pane, index) in panes"
      v-bind:key="pane.name"
      @tap="switchToPane(pane.name)"
    >
      <Label class="fa icon" :text="pane.icon | fonticon" col="0" :row="index" />
      <Label class="pane_item_label" :text="pane.label" col="1" :row="index" />
    </GridLayout>

  </FlexboxLayout>
</template>

<script>
  import QuickAccessBigButton from './QuickAccessBigButton.vue';

  export default {
    data() {
      return {
        panes: this.$store.state.panes,
      }
    },

    components: { QuickAccessBigButton },

    methods: {
      switchToPane(name) {
        this.$store.dispatch('setCurrentPane', name);
      }
    }
  };
</script>

<style scoped lang="scss">
  @import '@/app';

  .separator {
    width: 100%;
    height: 5;
    margin: 10 0;
    background-color: $complementary-bottom-sheet;
  }

  .pane_item {
    border-bottom-width: 1;
    border-bottom-color: $complementary-bottom-sheet;
  }

  .icon {
    font-size: 18;
    width: 24;
    vertical-align: center;
    text-align: center;
    margin-left: 10;
  }

  .pane_item_label {
    font-size: $font-size;
    padding: 15;
  }
</style>
