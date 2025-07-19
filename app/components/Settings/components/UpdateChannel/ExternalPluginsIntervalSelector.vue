// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="update-interval-container">
    <Label text="External plugins update frequency:" class="interval-label" />
    <SelectField
      :items="updateIntervals"
      :selectedIndex="selectedIntervalIndex"
      title="Select Update Interval"
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
    SelectField
  },

  props: {
    selectedInterval: {
      type: String,
      default: '86400'
    }
  },

  data() {
    return {
      updateIntervals: [
        { name: 'Every 6 hours', value: '21600' },
        { name: 'Every 12 hours', value: '43200' },
        { name: 'Every day', value: '86400' },
        { name: 'Every week', value: '604800' }
      ]
    };
  },

  computed: {
    selectedIntervalIndex() {
      return this.updateIntervals.findIndex(
        item => item.value === this.selectedInterval
      );
    }
  },

  methods: {
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
  color: $on-surface-dark;
  margin-bottom: 8;
  font-size: 14;
}
</style>
