// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="custom-url-container">
    <GridLayout columns="*, auto" rows="auto" class="url-input-container">
      <TextField
        col="0"
        class="url-input"
        v-model="url"
        hint="Enter custom channel URL"
        returnKeyType="done"
      />
      <Label
        col="1"
        class="fa url-status-icon"
        :class="urlStatusClass"
        :text="$filters.fonticon(urlStatusIcon)"
      />
    </GridLayout>

    <Label text="Examples:" class="examples-label" once="true" />
    <WrapLayout class="examples-container">
      <MDButton
        text="localhost:8000"
        class="example-button"
        @tap="setExampleUrl('http://localhost:8000')"
        once="true"
      />
      <MDButton
        text="iitc.app/build/artifact/PR"
        class="example-button"
        @tap="setExampleUrl('https://iitc.app/build/artifact/PR')"
        once="true"
      />
    </WrapLayout>
  </StackLayout>
</template>

<script>
import { MDButton } from '@nativescript-community/ui-material-button';
import { mapActions } from 'vuex';

export default {
  name: 'CustomChannelInput',

  components: {
    MDButton
  },

  props: {
    customUrl: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      url: this.customUrl,
      urlStatus: 'unknown', // 'success', 'error', 'unknown'
    };
  },

  computed: {
    // URL status icon based on validation state
    urlStatusIcon() {
      if (this.urlStatus === 'success') return 'fa-check';
      if (this.urlStatus === 'error') return 'fa-times';
      return 'fa-question';
    },

    urlStatusClass() {
      return {
        'status-success': this.urlStatus === 'success',
        'status-error': this.urlStatus === 'error',
        'status-unknown': this.urlStatus === 'unknown'
      };
    }
  },

  watch: {
    url(newValue) {
      this.checkCustomUrl();
    }
  },

  methods: {
    ...mapActions('manager', ['checkCustomChannelUrl']),

    /**
     * Check if custom URL is valid
     */
    async checkCustomUrl() {
      if (!this.url) {
        this.urlStatus = 'unknown';
        return;
      }

      this.urlStatus = 'unknown';

      try {
        // Try to add http:// prefix if missing
        let urlToCheck = this.url;
        if (!/^https?:\/\//i.test(urlToCheck)) {
          urlToCheck = 'http://' + urlToCheck;
        }

        const isValid = await this.checkCustomChannelUrl(urlToCheck);

        if (isValid) {
          this.urlStatus = 'success';
          if (this.url !== urlToCheck) {
            this.url = urlToCheck;
            await this.$nextTick();
          }
          this.$emit('urlChanged', urlToCheck);
        } else {
          this.urlStatus = 'error';
        }
      } catch (error) {
        console.error('Error checking custom URL:', error);
        this.urlStatus = 'error';
      }
    },

    /**
     * Set example URL
     */
    setExampleUrl(url) {
      this.url = url;
    }
  },

  mounted() {
    // Check URL status on mount
    this.checkCustomUrl();
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.custom-url-container {
  padding-bottom: $spacing-m;
}

.url-input-container {
  border-width: 1;
  border-color: $surface-variant;
  border-radius: 4;
  background-color: $surface-bright;
  margin-bottom: $spacing-s;
}

.url-input {
  margin: 0;
  width: 100%;
  border-radius: 0;
  padding: $spacing-s;
  font-size: 14;
  height: 50;
  color: #ffffff;
  placeholder-color: #aaaaaa;
}

.url-status-icon {
  font-size: 18;
  width: 40;
  height: 40;
  padding: 8;
  text-align: center;
  vertical-alignment: center;

  &.status-success {
    color: $state-success;
  }

  &.status-error {
    color: $state-error;
  }

  &.status-unknown {
    color: $state-disabled;
  }
}

.examples-label {
  margin: 4 0;
  font-size: 14;
  color: $on-surface-dark;
}

.examples-container {
  margin: 0 -4;
}

.example-button {
  background-color: $primary;
  color: $on-surface;
  margin: 4;
  padding: 8;
  border-radius: 4;
  font-size: 12;
  text-transform: none;
}
</style>
