// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import * as Clipboard from 'nativescript-clipboard';
import { Toasty } from '@triniwiz/nativescript-toasty';
import { detectClipboardUrl, readClipboardText } from './platform';

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
    console.error('Error copying to clipboard:', error);
    if (toastMessage) {
      const toast = new Toasty({ text: 'Failed to copy to clipboard' });
      toast.show();
    }
  }
};

/**
 * Check whether the clipboard contains a URL. Uses native detection APIs
 * when available to avoid triggering paste prompts on iOS 14+ and Android 12+.
 *
 * On platforms without detection support (iOS <14, Android <12), falls back
 * to reading clipboard content and running a basic URL regex.
 *
 * @returns True if a URL is detected
 */
export const hasClipboardUrl = async (): Promise<boolean> => {
  const detected = await detectClipboardUrl();
  if (detected !== null) return detected;
  const text = readClipboardText();
  return !!text && /^https?:\/\//i.test(text);
};

/**
 * Read clipboard URL if it matches a pattern.
 *
 * Uses native URL detection first (iOS 14+ / Android 12+) to skip reading
 * when no URL is present - avoiding the paste banner/toast in that case.
 *
 * When a URL is detected (or detection is unavailable), reads content and
 * matches it against the supplied regex.
 *
 * @param pattern - RegExp to test against clipboard URL
 * @returns Matching clipboard URL or null
 */
export const getClipboardURLIfMatches = async (pattern: RegExp): Promise<string | null> => {
  const detected = await detectClipboardUrl();
  if (detected === false) return null;
  const text = readClipboardText();
  if (!text) return null;
  return pattern.test(text) ? text : null;
};
