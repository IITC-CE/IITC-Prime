//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    class="app-control-panel"
    width="100%"
    :height="maxHeight"
    flexDirection="column">

    <!-- buttons -->
    <StackLayout
      class="panel-header"
      orientation="horizontal">
      <Button text="Search" />
      <Button text="Location" />
      <Button text="Layers" />
    </StackLayout>

    <!-- content -->
    <StackLayout
      class="panel-body"
      flexGrow="1">
      <Label text="content" />
    </StackLayout>
  </FlexboxLayout>
</template>

<script>
export default {
  name: 'AppControlPanel',
  props: {
    maxHeight: {
      type: Number,
      required: true
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.app-control-panel {
  background-color: $base;
  color: $text;
  border-radius: 10 10 0 0;
  border-color: $complementary;
  border-top-width: 1;
}

.panel-header {
  height: 50;
  justify-content: space-around;
}

.panel-body {
}
</style>
