// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="update-interval-container">
    <Label :text="$L('update_interval.external_label')" class="interval-label" />
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
  name: 'ExternalPluginsIntervalSelector',

  components: {
    SelectField,
  },

  props: {
    selectedInterval: {
      type: String,
      default: '86400',
    },
  },

  computed: {
    updateIntervals() {
      return [
        { name: this.$L('update_interval.every_6h'), value: '21600' },
        { name: this.$L('update_interval.every_12h'), value: '43200' },
        { name: this.$L('update_interval.every_day'), value: '86400' },
        { name: this.$L('update_interval.every_week'), value: '604800' },
      ];
    },

    selectedIntervalIndex() {
      return this.updateIntervals.findIndex(item => item.value === this.selectedInterval);
    },
  },

  methods: {
    onIntervalSelected(args) {
      if (!args.selectedId) return;
      this.$emit('intervalSelected', args.selectedId);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.update-interval-container {
  padding-bottom: $spacing-m;
}

.interval-label {
  color: $on-surface-dark;
  margin-bottom: 8;
  font-size: 14;
}
</style>
