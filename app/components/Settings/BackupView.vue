// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase :title="$L('backup.title')">
    <!-- Import -->
    <SettingsSection :title="$L('backup.section.import')" />
    <SettingsItem
      type="action"
      :title="$L('backup.choose_file.title')"
      :description="$L('backup.choose_file.description')"
      @action="chooseFile"
      :isFirst="true"
      :isLast="true"
    />

    <Label
      v-if="isInvalidBackup"
      :text="$L('backup.invalid')"
      class="hint hint--error"
      textWrap="true"
    />

    <template v-if="hasPickedBackup">
      <SettingsItem
        v-if="available.has_settings"
        type="switch"
        :title="$L('backup.import_settings.title')"
        :description="$L('backup.import_settings.description')"
        :value="importSettings"
        @change="importSettings = $event"
        :spaced="firstImportSection === 'settings'"
        :isFirst="firstImportSection === 'settings'"
        :isLast="lastImportSection === 'settings'"
      />
      <SettingsItem
        v-if="available.has_data"
        type="switch"
        :title="$L('backup.import_data.title')"
        :description="$L('backup.import_data.description')"
        :value="importData"
        @change="importData = $event"
        :spaced="firstImportSection === 'data'"
        :isFirst="firstImportSection === 'data'"
        :isLast="lastImportSection === 'data'"
      />
      <SettingsItem
        v-if="available.has_external"
        type="switch"
        :title="$L('backup.import_external.title')"
        :description="$L('backup.import_external.description')"
        :value="importExternal"
        @change="importExternal = $event"
        :spaced="firstImportSection === 'external'"
        :isFirst="firstImportSection === 'external'"
        :isLast="lastImportSection === 'external'"
      />
      <SettingsItem
        type="action"
        :title="$L('backup.restore.title')"
        :description="$L('backup.restore.description')"
        @action="restore"
        :bold="true"
        :spaced="true"
        :isFirst="true"
        :isLast="true"
      />
    </template>

    <!-- Export -->
    <SettingsSection :title="$L('backup.section.export')" />
    <SettingsItem
      type="switch"
      :title="$L('backup.export_settings.title')"
      :description="$L('backup.export_settings.description')"
      :value="exportSettings"
      @change="exportSettings = $event"
      :isFirst="true"
    />
    <SettingsItem
      type="switch"
      :title="$L('backup.export_data.title')"
      :description="$L('backup.export_data.description')"
      :value="exportData"
      @change="exportData = $event"
    />
    <SettingsItem
      type="switch"
      :title="$L('backup.export_external.title')"
      :description="$L('backup.export_external.description')"
      :value="exportExternal"
      @change="exportExternal = $event"
      :isLast="true"
    />
    <SettingsItem
      type="action"
      :title="$L('backup.export_file.title')"
      :description="$L('backup.export_file.description')"
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
          title: this.$L('backup.dialog.nothing_to_restore.title'),
          message: this.$L('backup.dialog.nothing_to_restore.message'),
          okButtonText: this.$L('dialog.ok'),
        });
        return;
      }

      this.isWorking = true;
      try {
        await this.importBackup({ path: this.pickedPath, params });

        await this.loadPlugins();
        this.resetImport();

        await alert({
          title: this.$L('backup.dialog.restored.title'),
          message: this.$L('backup.dialog.restored.message'),
          okButtonText: this.$L('dialog.ok'),
        });

        await this.$store.dispatch('ui/reloadWebView');
        goBack();
      } catch (error) {
        console.error('Restore backup failed:', error);
        await alert({
          title: this.$L('dialog.error.title'),
          message: this.$L('backup.dialog.restore_error.message'),
          okButtonText: this.$L('dialog.ok'),
        });
      } finally {
        this.isWorking = false;
      }
    },

    async exportBackupFile() {
      if (this.isWorking) return;

      if (!this.exportSettings && !this.exportData && !this.exportExternal) {
        await alert({
          title: this.$L('backup.dialog.nothing_to_export.title'),
          message: this.$L('backup.dialog.nothing_to_export.message'),
          okButtonText: this.$L('dialog.ok'),
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
          title: this.$L('dialog.error.title'),
          message: this.$L('backup.dialog.export_error.message'),
          okButtonText: this.$L('dialog.ok'),
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
