// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase title="Backup & Restore">
    <!-- Import -->
    <SettingsSection title="Import" />
    <SettingsItem
      type="action"
      title="Choose backup file"
      description="Restore from a previously exported .zip"
      @action="chooseFile"
      :isFirst="true"
      :isLast="true"
    />

    <Label
      v-if="isInvalidBackup"
      text="This file is not a valid IITC backup"
      class="hint hint--error"
      textWrap="true"
    />

    <template v-if="hasPickedBackup">
      <SettingsItem
        v-if="available.has_settings"
        type="switch"
        title="Import settings"
        description="Update channel and plugin on/off state"
        :value="importSettings"
        @change="importSettings = $event"
        :spaced="firstImportSection === 'settings'"
        :isFirst="firstImportSection === 'settings'"
        :isLast="lastImportSection === 'settings'"
      />
      <SettingsItem
        v-if="available.has_data"
        type="switch"
        title="Import plugin data"
        description="Stored data of installed plugins"
        :value="importData"
        @change="importData = $event"
        :spaced="firstImportSection === 'data'"
        :isFirst="firstImportSection === 'data'"
        :isLast="lastImportSection === 'data'"
      />
      <SettingsItem
        v-if="available.has_external"
        type="switch"
        title="Import external plugins"
        description="User scripts not from the official repository"
        :value="importExternal"
        @change="importExternal = $event"
        :spaced="firstImportSection === 'external'"
        :isFirst="firstImportSection === 'external'"
        :isLast="lastImportSection === 'external'"
      />
      <SettingsItem
        type="action"
        title="Restore backup"
        description="Apply the selected items"
        @action="restore"
        :bold="true"
        :spaced="true"
        :isFirst="true"
        :isLast="true"
      />
    </template>

    <!-- Export -->
    <SettingsSection title="Export" />
    <SettingsItem
      type="switch"
      title="Export settings"
      description="Update channel and plugin on/off state"
      :value="exportSettings"
      @change="exportSettings = $event"
      :isFirst="true"
    />
    <SettingsItem
      type="switch"
      title="Export plugin data"
      description="Stored data of installed plugins"
      :value="exportData"
      @change="exportData = $event"
    />
    <SettingsItem
      type="switch"
      title="Export external plugins"
      description="User scripts not from the official repository"
      :value="exportExternal"
      @change="exportExternal = $event"
      :isLast="true"
    />
    <SettingsItem
      type="action"
      title="Export backup"
      description="Save a backup file you can share"
      @action="exportBackupFile"
      :bold="true"
      :spaced="true"
      :isFirst="true"
      :isLast="true"
    />

    <ActivityIndicator v-if="isWorking" busy="true" class="backup-indicator" />
  </SettingsBase>
</template>

<script>
import { mapActions } from 'vuex';
import { markRaw } from 'vue';

import SettingsBase from './SettingsBase';
import SettingsSection from './components/SettingsSection';
import SettingsItem from './components/SettingsItem';
import { selectFiles, shareFilePath } from '~/utils/file-manager';
import { alert } from '~/utils/dialogs';
import { goBack } from '~/utils/platform';

export default {
  name: 'BackupView',

  components: {
    SettingsBase: markRaw(SettingsBase),
    SettingsSection: markRaw(SettingsSection),
    SettingsItem: markRaw(SettingsItem),
  },

  data() {
    return {
      isWorking: false,

      // Import
      pickedPath: null,
      isInvalidBackup: false,
      available: { has_settings: false, has_data: false, has_external: false },
      importSettings: true,
      importData: true,
      importExternal: true,

      // Export
      exportSettings: true,
      exportData: true,
      exportExternal: true,
    };
  },

  computed: {
    hasPickedBackup() {
      return (
        !!this.pickedPath &&
        (this.available.has_settings || this.available.has_data || this.available.has_external)
      );
    },

    firstImportSection() {
      if (this.available.has_settings) return 'settings';
      if (this.available.has_data) return 'data';
      if (this.available.has_external) return 'external';
      return null;
    },

    lastImportSection() {
      if (this.available.has_external) return 'external';
      if (this.available.has_data) return 'data';
      if (this.available.has_settings) return 'settings';
      return null;
    },
  },

  methods: {
    ...mapActions('manager', ['exportBackup', 'inspectBackup', 'importBackup', 'loadPlugins']),

    async chooseFile() {
      if (this.isWorking) return;

      const files = await selectFiles({
        allowsMultipleSelection: false,
        acceptTypes: [
          'application/zip',
          'application/x-zip-compressed',
          'application/octet-stream',
        ],
        extensions: ['zip'],
      });
      if (!files.length) return;

      this.resetImport();
      this.isWorking = true;
      try {
        const path = files[0].path;
        const info = await this.inspectBackup(path);

        if (!info.has_settings && !info.has_data && !info.has_external) {
          this.isInvalidBackup = true;
          return;
        }

        this.pickedPath = path;
        this.available = info;
        // Default each option on only when the backup actually has that section
        this.importSettings = info.has_settings;
        this.importData = info.has_data;
        this.importExternal = info.has_external;
      } catch (error) {
        console.error('Inspect backup failed:', error);
        this.isInvalidBackup = true;
      } finally {
        this.isWorking = false;
      }
    },

    async restore() {
      if (this.isWorking || !this.pickedPath) return;

      const params = {
        settings: this.importSettings && this.available.has_settings,
        data: this.importData && this.available.has_data,
        external: this.importExternal && this.available.has_external,
      };

      if (!params.settings && !params.data && !params.external) {
        await alert({
          title: 'Nothing to restore',
          message: 'Select at least one item to restore',
          okButtonText: 'OK',
        });
        return;
      }

      this.isWorking = true;
      try {
        await this.importBackup({ path: this.pickedPath, params });

        await this.loadPlugins();
        this.resetImport();

        await alert({
          title: 'Backup restored',
          message: 'The backup has been restored',
          okButtonText: 'OK',
        });

        await this.$store.dispatch('ui/reloadWebView');
        goBack();
      } catch (error) {
        console.error('Restore backup failed:', error);
        await alert({
          title: 'Error',
          message: 'Failed to restore the backup. Please try again.',
          okButtonText: 'OK',
        });
      } finally {
        this.isWorking = false;
      }
    },

    async exportBackupFile() {
      if (this.isWorking) return;

      if (!this.exportSettings && !this.exportData && !this.exportExternal) {
        await alert({
          title: 'Nothing to export',
          message: 'Select at least one item to export',
          okButtonText: 'OK',
        });
        return;
      }

      this.isWorking = true;
      try {
        const { path } = await this.exportBackup({
          settings: this.exportSettings,
          data: this.exportData,
          external: this.exportExternal,
        });

        await shareFilePath(path, 'IITC backup');
      } catch (error) {
        console.error('Export backup failed:', error);
        await alert({
          title: 'Error',
          message: 'Failed to create the backup. Please try again.',
          okButtonText: 'OK',
        });
      } finally {
        this.isWorking = false;
      }
    },

    resetImport() {
      this.pickedPath = null;
      this.isInvalidBackup = false;
      this.available = { has_settings: false, has_data: false, has_external: false };
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.hint {
  padding: 12 16;
  font-size: $font-size-small;
}

.hint--error {
  color: $state-error;
}

.backup-indicator {
  color: $primary;
  width: 24;
  height: 24;
  margin-top: 16;
  horizontal-align: center;
}
</style>
