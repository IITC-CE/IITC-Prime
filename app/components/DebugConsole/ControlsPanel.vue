// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="controls-container">
    <!-- Controls panel -->
    <GridLayout
      row="0"
      class="controls-panel"
      columns="auto, *, auto, auto, auto">

      <MDButton
        col="0"
        class="fa control-button"
        :text="$filters.fonticon('fa-arrow-left')"
        variant="flat"
        @tap="handleClose"
      />
      <MDButton
        col="2"
        class="fa control-button trash"
        :text="$filters.fonticon('fa-trash')"
        variant="flat"
        @tap="$emit('clear')"
      />
      <MDButton
        col="3"
        class="fa control-button"
        :text="$filters.fonticon('fa-arrow-up')"
        variant="flat"
        @tap="navigateHistoryUp"
      />
      <MDButton
        col="4"
        class="fa control-button"
        :text="$filters.fonticon('fa-arrow-down')"
        variant="flat"
        @tap="navigateHistoryDown"
      />
    </GridLayout>

    <!-- Command input -->
    <GridLayout row="1" columns="*, auto" class="command-input-container">
      <TextView
        ref="commandInput"
        col="0"
        class="command-input"
        v-model="commandText"
        @returnPress="executeCommand"
        hint="Enter JavaScript command..."
        autocorrect="false"
        maxLines="10"
      />
      <MDButton
        col="1"
        class="fa btn-primary send-button"
        :text="$filters.fonticon('fa-paper-plane')"
        variant="flat"
        @tap="executeCommand"
      />
    </GridLayout>
  </StackLayout>
</template>

<script>
export default {
  props: {
    command: {
      type: String,
      default: ''
    },
    commandHistory: {
      type: Array,
      default: () => []
    },
    historyPosition: {
      type: Number,
      default: -1
    }
  },

  data() {
    return {
      commandText: ''
    }
  },

  watch: {
    command(newVal) {
      this.commandText = newVal;
    },
    commandText(newVal) {
      this.$emit('update:command', newVal);
    }
  },

  methods: {
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
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.controls-container {
  width: 100%;
}

.controls-panel {
  background-color: rgba(0, 0, 0, 0.2);
  padding: $spacing-s $spacing-m;
  margin: 0 -4;
}

.control-button {
  font-size: 16;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4;
  margin: 0 $spacing-xs;
  padding: 11 0 0 0;
  height: 40;
  min-width: 40;
  width: 40;
  text-align: center;
  ripple-color: $ripple;
}

.control-button.trash {
  margin-right: $spacing-l;
  ripple-color: rgba(255, 0, 0, 0.3);
}

.command-input-container {
  background-color: rgba(0, 0, 0, 0.3);
  padding: $spacing-s $spacing-m $spacing-m $spacing-m;
}

.command-input {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: $radius-small;
  padding: $spacing-s;
  font-family: monospace;
  font-size: 14;
  height: auto;
  min-height: 40;
  max-height: 100;
  color: #ffffff;
  placeholder-color: #aaaaaa;
}

.send-button {
  background-color: $primary;
  color: white;
  margin-left: $spacing-s;
  font-size: 16;
  height: 40;
  width: 50;
  padding: 11 3 0 0;
  text-align: center;
}
</style>
