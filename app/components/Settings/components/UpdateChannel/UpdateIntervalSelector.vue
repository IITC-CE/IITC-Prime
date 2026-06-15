// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="update-interval-container">
    <Label :text="intervalLabel" class="interval-label" />
    <SelectField
      :items="updateIntervals"
      :selectedIndex="selectedIntervalIndex"
      :title="$L('update_interval.select_title')"
      textField="name"
      idField="value"
      class="list-item--first list-item--last"
      @change="onIntervalSelected"
    />
  </StackLayout>
</template>

<script>
import SelectField from '@/components/base/SelectField';

export default {
  name: 'UpdateIntervalSelector',

  components: {
    SelectField
  },

  props: {
    currentChannel: {
      type: String,
      required: true
    },
    selectedInterval: {
      type: String,
      default: '86400'
    }
  },

  computed: {
    updateIntervals() {
      return [
        { name: this.$L('update_interval.every_5s'), value: '5' },
        { name: this.$L('update_interval.every_6h'), value: '21600' },
        { name: this.$L('update_interval.every_12h'), value: '43200' },
        { name: this.$L('update_interval.every_day'), value: '86400' },
        { name: this.$L('update_interval.every_week'), value: '604800' },
      ];
    },

    selectedIntervalIndex() {
      return this.updateIntervals.findIndex(item => item.value === this.selectedInterval);
    },

    intervalLabel() {
      const channel = this.currentChannel.charAt(0).toUpperCase() + this.currentChannel.slice(1);
      return this.$L('update_interval.channel_label', channel);
    },
  },

  methods: {
    /**
     * Handle interval selection change
     */
    onIntervalSelected(args) {
      if (!args.selectedId) return;
      this.$emit('intervalSelected', args.selectedId);
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.update-interval-container {
  padding-bottom: $spacing-m;
}

.interval-label {
  color: $on-surface-variant;
  margin-bottom: 8;
  font-size: 14;
}
</style>
