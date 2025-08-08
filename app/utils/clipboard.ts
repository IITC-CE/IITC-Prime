// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import * as Clipboard from 'nativescript-clipboard';
import { Toasty } from "@triniwiz/nativescript-toasty";

/**
 * General function to copy text to clipboard with toast notification
 * @param text - Text to copy to clipboard
 * @param toastMessage - Toast message to show (optional)
 */
export const copyToClipboard = async (text: string, toastMessage?: string): Promise<void> => {
  try {
    await Clipboard.setText(text);
    if (toastMessage) {
      const toast = new Toasty({ text: toastMessage });
      toast.show();
    }
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    if (toastMessage) {
      const toast = new Toasty({ text: "Failed to copy to clipboard" });
      toast.show();
    }
  }
};
