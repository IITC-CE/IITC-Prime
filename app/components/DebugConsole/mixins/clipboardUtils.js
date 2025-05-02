//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import * as Clipboard from 'nativescript-clipboard';
import { Toasty } from "@triniwiz/nativescript-toasty";

export default {
  methods: {
    // Copy log text to clipboard on long press
    copyLogToClipboard(item) {
      // Reset touch state to clear any highlights
      this.resetTouchState();

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
