//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    class="map-state-bar"
    flexDirection="row"
    justifyContent="space-between"
    alignItems="center">

    <!-- Portal status component - left side -->
    <PortalStatusView
      width="68%"
      :portalStatus="portalStatus" />

    <!-- Map status component - right side -->
    <MapStatusView
      width="32%"
      :mapStatus="mapStatus" />
  </FlexboxLayout>
</template>

<script>
import { mapState } from 'vuex';
import PortalStatusView from './components/MapStateBar/PortalStatusView';
import MapStatusView from './components/MapStateBar/MapStatusView';

export default {
  name: 'MapStateBar',
  components: {
    PortalStatusView,
    MapStatusView
  },
  computed: {
    ...mapState({
      mapStatus: state => state.map.mapStatus,
      portalStatus: state => state.map.portalStatus
    })
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.map-state-bar {
  width: 100%;
  height: 100%;
  background-color: $base;
  padding: 0 10 8;
}
</style>
