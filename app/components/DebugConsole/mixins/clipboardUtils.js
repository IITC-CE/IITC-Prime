// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import * as Clipboard from 'nativescript-clipboard';
import { Toasty } from "@triniwiz/nativescript-toasty";

export default {
  methods: {
    // Copy log text to clipboard on long press
    copyLogToClipboard(item) {
      const fullText = this.getFullLogText(item);

      // Copy to clipboard
      Clipboard.setText(fullText)
        .then(() => {
          this.showToast("Log copied to clipboard");
        })
        .catch(error => {
          console.error("Error copying to clipboard:", error);
          this.showToast("Failed to copy log");
        });
    },

    // Show toast notification
    showToast(message) {
      const toast = new Toasty({ text: message });
      toast.show();
    }
  }
};
