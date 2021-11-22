<template>
  <StackLayout class="sheet_wrapper">
    <label class="sheet_drag"></label>
    <ScrollView class="sheet_scroll_view" scrollBarIndicatorVisible="false">
      <FlexboxLayout class="sheet_container"  flexDirection="column">
        <slot></slot>
      </FlexboxLayout>
    </ScrollView>
  </StackLayout>
</template>

<script>
  export default {
    data() {
      return {}
    }
  }
</script>

<style scoped lang="scss">
  @import '../app';

  .sheet_wrapper {
    background-color: $base-bottom-sheet;
    height: 100%;
    border-radius: 8 8 0 0;
    margin-top: 10;
  }

  .sheet_drag {
    height: 4;
    width: 24;
    margin-top: 6;
    margin-bottom: 6;
    background-color: $accent-bottom-sheet;
    border-radius: 50%;
  }

  .sheet_scroll_view {
    height: 100%;
  }

  .sheet_container {
    padding: 25 15 15 15;
  }
</style>
