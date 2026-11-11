// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="controls-container">
    <!-- Controls panel -->
    <GridLayout row="0" class="controls-panel" columns="auto, *, auto, auto, auto">
      <AppButton
        col="0"
        icon
        class="ms control-button"
        :text="$filters.fonticon('ms-arrow-back')"
        @tap="handleClose"
      />
      <AppButton
        col="2"
        icon
        destructive
        class="ms control-button trash"
        :text="$filters.fonticon('ms-delete')"
        @tap="$emit('clear')"
      />
      <AppButton
        col="3"
        icon
        class="ms control-button"
        :text="$filters.fonticon('ms-arrow-upward')"
        @tap="navigateHistoryUp"
      />
      <AppButton
        col="4"
        icon
        class="ms control-button"
        :text="$filters.fonticon('ms-arrow-downward')"
        @tap="navigateHistoryDown"
      />
    </GridLayout>

    <!-- Command input -->
    <GridLayout row="1" columns="*, auto" class="command-input-container">
      <TextView
        ref="commandInput"
        col="0"
        class="text-input command-input"
        v-model="commandText"
        @returnPress="executeCommand"
        @loaded="fixTextInputColors"
        :hint="$L('debug.command_hint')"
        autocorrect="false"
        maxLines="10"
      />
      <AppButton
        col="1"
        variant="filled"
        icon
        class="ms send-button"
        :text="$filters.fonticon('ms-send')"
        @tap="executeCommand"
      />
    </GridLayout>
  </StackLayout>
</template>

<script>
import { fixTextInputColors } from '@/utils/platform/ui';
import AppButton from '@/components/base/AppButton.vue';

export default {
  components: { AppButton },

  props: {
    command: {
      type: String,
      default: '',
    },
    commandHistory: {
      type: Array,
      default: () => [],
    },
    historyPosition: {
      type: Number,
      default: -1,
    },
  },

  data() {
    return {
      commandText: '',
    };
  },

  watch: {
    command(newVal) {
      this.commandText = newVal;
    },
    commandText(newVal) {
      this.$emit('update:command', newVal);
    },
  },

  methods: {
    fixTextInputColors,

    // Execute command and emit result to parent
    executeCommand() {
      if (!this.commandText || this.commandText.trim() === '') return;

      // Get the command text
      const cmdString = this.commandText;

      // Clear the input field
      this.commandText = '';

      // Emit the command to parent component
      this.$emit('command-executed', cmdString);
    },

    // Navigate up through command history using Vuex
    navigateHistoryUp() {
      this.$emit('history-navigate', { direction: 1, currentCommand: this.commandText });
    },

    // Navigate down through command history using Vuex
    navigateHistoryDown() {
      this.$emit('history-navigate', { direction: -1, currentCommand: this.commandText });
    },

    // Handle close button and reset state
    handleClose() {
      this.$emit('close');
    },

    // Focus on the command input field
    focusInput() {
      if (this.$refs.commandInput && this.$refs.commandInput.nativeView) {
        this.$refs.commandInput.nativeView.focus();
      }
    },

    // Remove focus from the command input field (closes keyboard)
    blurInput() {
      if (this.$refs.commandInput && this.$refs.commandInput.nativeView) {
        this.$refs.commandInput.nativeView.dismissSoftInput();
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.controls-container {
  width: 100%;
}

.controls-panel {
  background-color: $surface;
  padding: $spacing-s $spacing-m;
  margin: 0 -4;
}

.control-button {
  margin: 0 $spacing-xs;
  height: 40;
  width: 40;
  vertical-align: center;
}

.control-button.trash {
  margin-right: $spacing-l;
}

.ns-android .control-button {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: $radius-small;
  ripple-color: $ripple;
}

.ns-android .control-button.trash {
  ripple-color: rgba(255, 0, 0, 0.3);
}

.command-input-container {
  background-color: $surface;
  padding: $spacing-s $spacing-m $spacing-s $spacing-m;
}

.command-input {
  width: 100%;
  font-family: monospace;
  height: auto;
  max-height: 100;
}

.send-button {
  margin: $spacing-xs 0 $spacing-xs $spacing-s;
  height: 40;
  width: 50;
  vertical-align: center;
}

.ns-android .send-button {
  background-color: $accent;
  color: white;
  border-radius: $radius-small;
  ripple-color: $ripple;
}
</style>
