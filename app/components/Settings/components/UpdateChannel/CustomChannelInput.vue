//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <StackLayout class="custom-url-container">
    <GridLayout columns="*, auto" rows="auto" class="url-input-container">
      <TextField
        col="0"
        class="url-input"
        :text="url"
        hint="Enter custom channel URL"
        @textChange="onTextChange"
        returnKeyType="done"
      />
      <Label
        col="1"
        class="fa url-status-icon"
        :class="urlStatusClass"
        :text="urlStatusIcon"
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
    customUrl(newValue) {
      this.url = newValue;
      this.checkCustomUrl();
    }
  },

  methods: {
    /**
     * Handle text change in input field
     */
    onTextChange(event) {
      this.url = event.value;
      this.checkCustomUrl();
    },

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
          this.url = urlToCheck;
        }

        // Check if URL is accessible
        const metaUrl = urlToCheck.endsWith('/') ?
          `${urlToCheck}meta.json` : `${urlToCheck}/meta.json`;

        const response = await fetch(metaUrl, {
          method: 'HEAD',
          timeout: 2000
        });

        if (response.ok) {
          this.urlStatus = 'success';
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
      this.checkCustomUrl();
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
  margin: 8 16;
}

.url-input-container {
  border-width: 1;
  border-color: $surface-variant;
  border-radius: 4;
  padding: 0 8;
  background-color: $surface-bright;
  margin-bottom: 12;
}

.url-input {
  height: 50;
  font-size: 16;
  padding: 0 8;
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
  color: $surface-variant;
}

.examples-container {
  margin: 0 -4;
}

.example-button {
  background-color: $surface-variant;
  color: $on-surface;
  margin: 4;
  padding: 8;
  border-radius: 4;
  font-size: 12;
}
</style>
