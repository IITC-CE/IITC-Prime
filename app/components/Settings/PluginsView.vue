//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <SettingsBase title="Plugins">
    <Label class="placeholder" text="Will be implemented here" />
  </SettingsBase>
</template>

<script>
import SettingsBase from './SettingsBase';

export default {
  name: 'PluginsView',
  components: { SettingsBase }
};
</script>

<style scoped>
.placeholder {
  padding: 20;
  text-align: center;
  color: #888;
}
</style>
