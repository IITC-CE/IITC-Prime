//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <GridLayout rows="*, auto, auto" class="debug-console">
    <!-- Logs list -->
    <ListView
      ref="logsList"
      row="0"
      class="logs-list"
      :items="logs"
      @scroll="handleScroll"
    >
      <v-template>
        <GridLayout columns="auto, *" class="log-item" :class="'log-' + item.type">
          <Label col="0" :text="formatTimestamp(item.timestamp)" class="log-timestamp" />
          <Label col="1" :text="item.message" textWrap="true" class="log-message" />
        </GridLayout>
      </v-template>
    </ListView>

    <!-- Controls panel -->
    <GridLayout row="1" columns="auto, *, auto, auto" class="controls-panel">
      <Button col="0" class="control-button" text="Clear" @tap="clearLogs" />
      <Label col="1" />
      <Button col="2" class="control-button" text="↑" @tap="navigateHistoryUp" />
      <Button col="3" class="control-button" text="↓" @tap="navigateHistoryDown" />
    </GridLayout>

    <!-- Command input -->
    <GridLayout row="2" columns="*, auto" class="command-input-container">
      <TextView
        ref="commandInput"
        col="0"
        class="command-input"
        v-model="command"
        @returnPress="executeCommand"
        hint="Enter JavaScript command..."
      />
      <Button col="1" class="send-button" text="Send" @tap="executeCommand" />
    </GridLayout>

    <!-- Scroll to bottom button (shown conditionally) -->
    <Button
      v-show="!isAtBottom"
      class="scroll-bottom-button"
      text="↓"
      @tap="scrollToBottom"
    />
  </GridLayout>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { isAndroid } from '@nativescript/core/platform';
import store from "@/store";

export default {
  data() {
    return {
      command: '',
      isAtBottom: true,
      scrollTimeout: null
    }
  },

  computed: {
    ...mapState({
      logs: state => state.debug.logs,
      commandHistory: state => state.debug.commandHistory,
      historyPosition: state => state.debug.historyPosition
    })
  },

  methods: {
    ...mapActions('debug', [
      'clearLogs',
      'addCommand',
      'navigateHistory'
    ]),

    // Format timestamp to display time with milliseconds
    formatTimestamp(timestamp) {
      if (!timestamp) return '';

      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      return `${hours}:${minutes}:${seconds}`;
    },

    // Execute JavaScript command in WebView
    executeCommand() {
      if (!this.command || this.command.trim() === '') return;

      // Get the command as string
      const cmdString = this.command;

      // Clear the input first to prevent issues with history
      this.command = '';

      // Store command in history
      this.addCommand(cmdString);

      // Emit event to parent component
      this.$emit('execute-command', cmdString);

      // Scroll to bottom
      this.scrollToBottom();
    },

    // Handle scroll events to detect if we're at the bottom
    handleScroll(args) {
      // Clear previous timeout if it exists
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      // Set a timeout to check if we're at the bottom after scrolling stops
      this.scrollTimeout = setTimeout(() => {
        if (!this.$refs.logsList || !this.$refs.logsList.nativeView) return;

        const listView = this.$refs.logsList.nativeView;

        if (isAndroid) {
          // Android implementation
          try {
            const layoutManager = listView.getLayoutManager();
            const itemCount = layoutManager.getItemCount();
            const lastVisiblePosition = layoutManager.findLastVisibleItemPosition();
            this.isAtBottom = lastVisiblePosition >= itemCount - 2;
          } catch (e) {
            console.log("Error checking scroll position:", e);
            this.isAtBottom = true;
          }
        } else {
          // iOS implementation
          try {
            const indexPathsArray = listView.indexPathsForVisibleRows;
            if (indexPathsArray && indexPathsArray.count > 0) {
              const lastVisibleIndex = indexPathsArray.objectAtIndex(indexPathsArray.count - 1).row;
              this.isAtBottom = lastVisibleIndex >= this.logs.length - 2;
            }
          } catch (e) {
            console.log("Error checking scroll position:", e);
            this.isAtBottom = true;
          }
        }
      }, 200);
    },

    // Scroll to the bottom of the list
    scrollToBottom() {
      if (!this.logs.length || !this.$refs.logsList || !this.$refs.logsList.nativeView) return;

      this.$nextTick(() => {
        try {
          const listView = this.$refs.logsList.nativeView;

          if (isAndroid) {
            // Android implementation using scrollToIndex
            if (typeof listView.scrollToIndex === 'function') {
              listView.scrollToIndex(this.logs.length - 1);
            } else if (listView.scrollToPosition) {
              listView.scrollToPosition(this.logs.length - 1);
            }
          } else {
            // iOS implementation
            const indexPath = NSIndexPath.indexPathForItemInSection(this.logs.length - 1, 0);
            listView.scrollToIndexPathAtScrollPositionAnimated(indexPath, 2, true);
          }

          this.isAtBottom = true;
        } catch (e) {
          console.log("Error scrolling to bottom:", e);
        }
      });
    },

    // Navigate up through command history
    async navigateHistoryUp() {
      const result = await this.$store.dispatch('debug/navigateHistory', -1);
      if (result) {
        this.command = result;
      }
    },

    // Navigate down through command history
    async navigateHistoryDown() {
      const result = await this.$store.dispatch('debug/navigateHistory', 1);
      this.command = result || '';
    }
  },

  watch: {
    // Auto-scroll when new logs are added and we're at the bottom
    logs() {
      if (this.isAtBottom) {
        // Use setTimeout to ensure we're outside of the current rendering cycle
        setTimeout(() => {
          this.scrollToBottom();
        }, 0);
      }
    }
  },

  mounted() {
    // Initial scroll to bottom when component is mounted
    this.$nextTick(() => {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    });
  }
}
</script>

<style scoped lang="scss">
@import '@/app';

.debug-console {
  background-color: $accent;
  width: 100%;
  height: 100%;
}

.logs-list {
  background-color: $accent;
}

.log-item {
  padding: 4 8;
  border-bottom-width: 1;
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.log-timestamp {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12;
  padding-right: 8;
  font-family: monospace;
}

.log-message {
  color: #ffffff;
  font-size: 14;
  font-family: monospace;
}

.log-error .log-message {
  color: #ff5252;
}

.log-warn .log-message {
  color: #ffd740;
}

.log-info .log-message {
  color: #40c4ff;
}

.log-debug .log-message {
  color: #b0bec5;
}

.log-result .log-message {
  color: #69f0ae;
}

.controls-panel {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 4;
}

.control-button {
  font-size: 14;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4;
  margin: 0 2;
  padding: 4 8;
  height: 32;
}

.command-input-container {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 8;
}

.command-input {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4;
  padding: 8;
  font-family: monospace;
  font-size: 14;
  height: auto;
  min-height: 40;
  max-height: 100;
}

.send-button {
  background-color: $primary;
  color: white;
  border-radius: 4;
  margin-left: 8;
  font-size: 16;
  height: 40;
  width: 50;
  text-align: center;
}

.scroll-bottom-button {
  width: 40;
  height: 40;
  border-radius: 20;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18;
  vertical-align: bottom;
  horizontal-align: right;
  margin: 16;
  text-align: center;
}
</style>
