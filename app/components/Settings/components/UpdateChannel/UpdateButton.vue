//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <StackLayout class="update-container">
    <MDButton
      text="Check for Updates Now"
      class="update-button"
      @tap="$emit('update')"
      :isEnabled="!isUpdating"
    />
    <Label
      v-if="formattedLastCheckTime"
      :text="`Last check: ${formattedLastCheckTime}`"
      class="last-check-label"
    />
    <ActivityIndicator v-if="isUpdating" busy="true" class="update-indicator" />
  </StackLayout>
</template>

<script>
import { MDButton } from '@nativescript-community/ui-material-button';

export default {
  name: 'UpdateButton',

  components: {
    MDButton
  },

  props: {
    isUpdating: {
      type: Boolean,
      default: false
    },
    lastCheckTime: {
      type: Number,
      default: null
    }
  },

  computed: {
    // Formatted last check date
    formattedLastCheckTime() {
      if (!this.lastCheckTime) return '';

      const date = new Date(this.lastCheckTime);
      return date.toLocaleString();
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.update-container {
  margin: 16;
  text-align: center;
}

.update-button {
  background-color: $primary;
  color: $on-primary;
  font-size: 16;
  height: 50;
  border-radius: 4;
  margin-bottom: 8;
}

.last-check-label {
  font-size: 14;
  color: $surface-variant;
  margin: 8 0;
}

.update-indicator {
  color: $primary;
  width: 24;
  height: 24;
  margin: 8 0;
}
</style>
