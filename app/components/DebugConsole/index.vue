// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout rows="*, auto" class="debug-console">
    <!-- Logs list -->
    <CollectionView
      ref="logsList"
      row="0"
      class="logs-list"
      :items="displayLogs"
      @scroll="handleScroll"
      @scrollStarted="handleScrollStarted"
      @scrollEnd="handleScrollEnd"
      @loaded="onCollectionViewLoaded"
    >
      <template #default="{ item }">
        <MDRipple
          class="log-item"
          :class="'log-' + item.type"
          @longPress="copyLogToClipboard(item)"
        >
          <!-- Header row with timestamp, log level and source -->
          <Label :text="formatLogHeader(item)" once="true" class="log-header" />

          <!-- Message content -->
          <Label :text="item.message" textWrap="true" class="log-message" once="true" />
        </MDRipple>
      </template>
    </CollectionView>

    <!-- Controls panel wrapper to handle translation -->
    <StackLayout
      ref="controlsWrapper"
      row="1"
      :paddingBottom="navBarPadding"
      class="controls-wrapper"
    >
      <ControlsPanel
        v-model:command="command"
        :commandHistory="commandHistory"
        :historyPosition="historyPosition"
        @clear="clearLogs"
        @command-executed="onCommandExecuted"
        @history-navigate="handleHistoryNavigation"
        @close="closeDebugConsole"
        ref="controlsPanel"
      />
    </StackLayout>

    <MDRipple
      ref="scrollBottomBtn"
      v-show="!isAtBottom"
      class="fab scroll-bottom-button"
      @tap="scrollToBottom"
    >
      <Label
        class="fa"
        :text="$filters.fonticon('fa-arrow-down')"
        horizontalAlignment="center"
        verticalAlignment="center"
      />
    </MDRipple>
  </GridLayout>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import logFormattingMixin from './mixins/logFormatting';
import { copyToClipboard } from '@/utils/clipboard';
import ControlsPanel from './ControlsPanel.vue';
import { isAndroid, isIOS, Application, CoreTypes } from '@nativescript/core';

export default {
  components: {
    ControlsPanel,
  },

  mixins: [logFormattingMixin],

  props: {
    isVisible: {
      type: Boolean,
      default: false,
    },
    isKeyboardOpen: {
      type: Boolean,
      default: false,
    },
    keyboardHeight: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      command: '',
      isAtBottom: true,
      isUserScrolling: false,
      logsVisible: false, // Controls whether logs should be shown or not
      localKeyboardHeight: 0,

      _collectionView: null,
      _keyboardObserver: null,
    };
  },

  computed: {
    // Keyboard padding is primarily used by the input panel translation.
    // On iOS we use real-time localKeyboardHeight; on Android we use the prop.
    keyboardPaddingBottom() {
      const height = isIOS ? this.localKeyboardHeight : this.keyboardHeight;
      if (height <= 0) return 0;

      if (isAndroid) return height;

      const safeAreaBottom = this.$store.state.ui.screenSafeArea.bottom;
      return Math.max(0, height - safeAreaBottom);
    },

    navBarPadding() {
      if (!isAndroid) return 0;
      return this.$store.state.ui.screenSafeArea.bottom;
    },

    ...mapState({
      logs: state => state.debug.logs,
      commandHistory: state => state.debug.commandHistory,
      historyPosition: state => state.debug.historyPosition,
    }),

    // Display logs only when both component is visible and logs should be shown
    displayLogs() {
      if (!this.isVisible || !this.logsVisible) return [];
      // Prevent CollectionView from mutating Vuex state
      return this.logs.map(log => ({ ...log }));
    },
  },

  watch: {
    isVisible(newValue) {
      if (newValue) {
        this.logsVisible = false;

        this.$nextTick(() => {
          this.$refs.controlsPanel?.focusInput();
        });

        // Add logs with delay to prevent UI freezing
        setTimeout(() => {
          this.logsVisible = true;
        }, 10);
      } else {
        this.logsVisible = false;
      }
    },

    displayLogs() {
      if (this.isVisible && this.isAtBottom && !this.isUserScrolling) {
        this.scrollToBottom();
      }
    },

    isKeyboardOpen(newValue) {
      if (newValue && this.isAtBottom && this.isVisible && this.logsVisible) {
        this.scrollToBottom();
      }

      if (isAndroid) {
        const targetY = newValue ? -(this.keyboardPaddingBottom - this.navBarPadding) : 0;
        this._animateAndroidTranslateY(this.$refs.controlsWrapper?.nativeView, targetY, newValue);
        this._animateAndroidTranslateY(this.$refs.scrollBottomBtn?.nativeView, targetY, newValue);
      }
    },

    keyboardPaddingBottom(newVal, oldVal) {
      if (!this._collectionView) return;

      if (isAndroid) {
        // Translate list by same amount as controls panel so they stay adjacent
        const translateY = -Math.max(0, newVal - this.navBarPadding);
        this._animateAndroidTranslateY(this._collectionView, translateY, newVal > oldVal);
        return;
      }

      if (!isIOS) return;
      const nativeView = this._collectionView.ios;

      // Update insets in real-time
      const insets = UIEdgeInsetsMake(0, 0, newVal, 0);
      nativeView.contentInset = insets;
      nativeView.scrollIndicatorInsets = insets;

      // Offset shift when opening
      if (newVal > oldVal && oldVal === 0 && !this.isAtBottom) {
        const current = nativeView.contentOffset;
        nativeView.setContentOffsetAnimated(CGPointMake(current.x, current.y + newVal), false);
      }

      // Clamp offset when closing
      if (newVal === 0 && oldVal > 0) {
        const maxOffset = Math.max(
          0,
          nativeView.contentSize.height - nativeView.bounds.size.height
        );
        const current = nativeView.contentOffset;
        if (current.y > maxOffset) {
          nativeView.setContentOffsetAnimated(CGPointMake(current.x, maxOffset), true);
        }
      }
    },
  },

  methods: {
    ...mapActions('debug', ['clearLogs', 'addCommand', 'navigateHistory']),

    // Handle executed command from ControlsPanel
    onCommandExecuted(cmdString) {
      // Add to command history
      this.addCommand(cmdString);

      // Emit event to parent component
      this.$emit('execute-command', cmdString);

      // Scroll to bottom
      this.scrollToBottom();
    },

    async handleHistoryNavigation(params) {
      const result = await this.navigateHistory(params);
      if (result !== undefined) this.command = result;
    },

    handleScroll() {
      if (!this.isVisible) return;
      requestAnimationFrame(() => this.checkScrollPosition());
    },

    handleScrollEnd() {
      this.isUserScrolling = false;
      if (this.isVisible) this.checkScrollPosition();
    },

    handleScrollStarted() {
      this.isUserScrolling = true;
    },

    // Check if the scroll position is at the bottom
    checkScrollPosition() {
      if (!this._collectionView || !this.displayLogs.length) return;

      try {
        const lastIndex = this.displayLogs.length - 1;
        const isLastVisible = this._collectionView.isItemAtIndexVisible(lastIndex);
        const isNearLastVisible = this._collectionView.isItemAtIndexVisible(
          Math.max(0, lastIndex - 1)
        );
        this.isAtBottom = isLastVisible || isNearLastVisible;
      } catch (e) {
        this.isAtBottom = true;
      }
    },

    // Scroll to the bottom of the list
    scrollToBottom() {
      // Skip if not visible or no logs
      if (!this.isVisible || !this.displayLogs.length || !this._collectionView) return;

      requestAnimationFrame(() => {
        if (!this._collectionView || !this.displayLogs.length) return;
        try {
          const count = this.displayLogs.length;
          if (isIOS) {
            const nativeView = this._collectionView.nativeView;
            if (nativeView && nativeView.numberOfItemsInSection(0) !== count) {
              setTimeout(() => this.scrollToBottom(), 32);
              return;
            }
          }
          this._collectionView.scrollToIndex(count - 1, true);
          this.isAtBottom = true;
        } catch (e) {}
      });
    },

    // Opening: decelerate (fast start, slow end) - matches Android IME open
    // Closing: accelerate (slow start, fast end) - matches Android IME close
    _animateAndroidTranslateY(view, targetY, isOpening) {
      if (!view) return;
      view.animate({
        translate: { x: 0, y: targetY },
        duration: 200,
        curve: isOpening
          ? CoreTypes.AnimationCurve.cubicBezier(0.0, 0.0, 0.2, 1.0)
          : CoreTypes.AnimationCurve.cubicBezier(0.4, 0.0, 1.0, 1.0),
      });
    },

    closeDebugConsole() {
      this.$refs.controlsPanel?.blurInput();
      this.$store.dispatch('ui/toggleDebugMode');
    },

    onCollectionViewLoaded(args) {
      this._collectionView = args.object;
      if (isIOS) {
        const nativeView = this._collectionView.ios;
        nativeView.keyboardDismissMode = 1;
        nativeView.automaticallyAdjustsContentInsets = false;
      }
    },

    // Copy log text to clipboard on long press
    async copyLogToClipboard(item) {
      const fullText = this.getFullLogText(item);
      await copyToClipboard(fullText, 'Log copied to clipboard');
    },
  },

  mounted() {
    if (isIOS) {
      if (this.isKeyboardOpen) {
        this.$nextTick(() => {
          const translateY = -this.keyboardPaddingBottom;
          const wrapper = this.$refs.controlsWrapper?.nativeView;
          if (wrapper) wrapper.translateY = translateY;
          const fab = this.$refs.scrollBottomBtn?.nativeView;
          if (fab) fab.translateY = translateY;
        });
      }

      this._keyboardObserver = Application.ios.addNotificationObserver(
        UIKeyboardWillChangeFrameNotification,
        notification => {
          const userInfo = notification.userInfo;
          const frame = userInfo.objectForKey(UIKeyboardFrameEndUserInfoKey).CGRectValue;
          const duration = userInfo.objectForKey(UIKeyboardAnimationDurationUserInfoKey);
          const curve = userInfo.objectForKey(UIKeyboardAnimationCurveUserInfoKey);
          const screenHeight = UIScreen.mainScreen.bounds.size.height;
          const height = Math.max(0, screenHeight - frame.origin.y);
          this.localKeyboardHeight = height;

          const safeAreaBottom = this.$store.state.ui.screenSafeArea.bottom;
          const translateY = -Math.max(0, height - safeAreaBottom);
          const wrapper = this.$refs.controlsWrapper?.nativeView;
          const fab = this.$refs.scrollBottomBtn?.nativeView;
          if (duration > 0) {
            UIView.animateWithDurationDelayOptionsAnimationsCompletion(
              duration,
              0,
              (curve << 16) | UIViewAnimationOptionBeginFromCurrentState,
              () => {
                if (wrapper?.ios)
                  wrapper.ios.transform = CGAffineTransformMakeTranslation(0, translateY);
                if (fab?.ios) fab.ios.transform = CGAffineTransformMakeTranslation(0, translateY);
              },
              null
            );
          } else {
            if (wrapper) wrapper.translateY = translateY;
            if (fab) fab.translateY = translateY;
          }
        }
      );
    } else if (isAndroid && this.isKeyboardOpen) {
      this.$nextTick(() => {
        const wrapper = this.$refs.controlsWrapper?.nativeView;
        if (wrapper) wrapper.translateY = -(this.keyboardPaddingBottom - this.navBarPadding);
      });
    }
  },

  beforeUnmount() {
    if (this._keyboardObserver) {
      Application.ios.removeNotificationObserver(
        this._keyboardObserver,
        UIKeyboardWillChangeFrameNotification
      );
    }
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.debug-console {
  background-color: $surface;
  width: 100%;
  height: 100%;
}

.logs-list {
  background-color: $surface;
}

.log-item {
  padding: 4 8;
  border-bottom-width: 1;
  border-bottom-color: rgba(255, 255, 255, 0.1);
  ripple-color: $ripple;
}

.log-header {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12;
  font-family: monospace;
  height: 20;
}

.log-message {
  color: #ffffff;
  font-size: 14;
  font-family: monospace;
  padding-left: 8;
}

.log-error .log-header {
  color: #ff5252;
}

.log-error .log-message {
  color: #ff5252;
}

.log-warn .log-header {
  color: #ffd740;
}

.log-warn .log-message {
  color: #ffd740;
}

.log-info .log-header {
  color: #40c4ff;
}

.log-info .log-message {
  color: #40c4ff;
}

.log-debug .log-header {
  color: #b0bec5;
}

.log-debug .log-message {
  color: #b0bec5;
}

.log-result .log-header {
  color: #69f0ae;
}

.log-result .log-message {
  color: #69f0ae;
}

.controls-wrapper {
  background-color: $surface;
}

.scroll-bottom-button {
  horizontal-align: right;
  margin: $spacing-l $spacing-m;
}
</style>
