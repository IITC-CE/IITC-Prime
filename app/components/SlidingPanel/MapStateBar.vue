//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    class="map-state-bar"
    flexDirection="row"
    justifyContent="space-between"
    alignItems="center">

    <Label
      class="map-state-left"
      flexGrow="1"
      text="Left Content" />

    <Label
      class="map-state-right"
      flexGrow="1"
      text="Right Content" />
  </FlexboxLayout>
</template>

<script>
export default {
  name: 'MapStateBar',
}
</script>

<style scoped lang="scss">
@import '@/app';

.map-state-bar {
  width: 100%;
  height: 100%;
  background-color: $base;
  padding: 0 10;
}

.map-state-left, .map-state-right {
  text-align: center;
  color: $text;
}
</style>
