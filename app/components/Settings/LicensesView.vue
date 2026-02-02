// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase title="Open Source Licenses" use-scroll="false">
    <GridLayout rows="*" class="licenses-list-container">
      <ListView
        row="0"
        :items="licenses"
        class="licenses-list"
        separatorColor="transparent"
        @itemTap="onItemTap"
      >
        <template #default="{ item }">
          <GridLayout
            class="list-item license-item"
            :class="{ 'list-item--first': item.isFirst, 'list-item--last': item.isLast }"
            columns="*"
            rows="auto, auto"
          >
            <Label :text="item.moduleName" class="license-name" textWrap="true" row="0" />
            <Label v-if="item.moduleUrl" :text="item.moduleUrl" class="license-url" row="1" />
          </GridLayout>
        </template>
      </ListView>
    </GridLayout>
  </SettingsBase>
</template>

<script>
import SettingsBase from './SettingsBase';
import { openUrl } from '@nativescript/core/utils';

export default {
  name: 'LicensesView',

  components: {
    SettingsBase,
  },

  data() {
    return {
      licenses: [],
    };
  },

  created() {
    this.loadLicenses();
  },

  methods: {
    loadLicenses() {
      let licensesData = null;
      try {
        licensesData = require('~/licenses.json');
      } catch (err) {
        licensesData = { dependencies: [] };
      }

      // Combine manual licenses with auto-generated native dependencies
      const items = [
        { moduleName: 'NativeScript', moduleUrl: 'https://nativescript.org' },
        { moduleName: 'Vue.js', moduleUrl: 'https://vuejs.org' },
        {
          moduleName: 'IITC-CE',
          moduleUrl: 'https://github.com/IITC-CE/ingress-intel-total-conversion',
        },
        {
          moduleName: 'lib-iitc-manager',
          moduleUrl: 'https://github.com/IITC-CE/lib-iitc-manager',
        },
        { moduleName: 'FontAwesome', moduleUrl: 'https://fontawesome.com' },
        ...(licensesData.dependencies || []),
      ];

      this.licenses = items.map((item, index) => ({
        ...item,
        isFirst: index === 0,
        isLast: index === items.length - 1,
      }));
    },

    onItemTap(args) {
      const item = this.licenses[args.index];

      if (item?.moduleUrl) {
        openUrl(item.moduleUrl);
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.licenses-list-container {
  padding-top: $spacing-l;
}

.licenses-list {
  width: 100%;
}

.license-item {
  padding: $spacing-m;
  height: auto;
}

.license-name {
  color: $on-surface;
  font-size: $font-size;
  font-weight: 500;
}

.license-url {
  color: $on-surface-dark;
  font-size: $font-size-small;
  margin-top: $spacing-xxs;
}
</style>
