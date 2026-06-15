// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { Application, Frame, Utils, isAndroid } from '@nativescript/core';

// Back-press handler registered by attachBackHandler; null when no screen is active
let currentBackHandler = null;

/**
 * Dismiss the topmost visible DialogFragment (e.g. a bottom sheet opened via $showBottomSheet).
 * Returns true when a dialog was found and dismissed, false otherwise.
 *
 * On Android <=15 (API <=35), activityBackPressedEvent fires before the dialog's own
 * OnBackPressedCallback, so the dialog never gets a chance to close itself. Callers must
 * invoke this explicitly and cancel the event - relying on super.onBackPressed() is not enough.
 * @returns {boolean}
 */
export const dismissVisibleDialog = () => {
  if (!isAndroid) return false;
  const activity = Application.android.foregroundActivity;
  if (!activity) return false;
  const fm = activity.getSupportFragmentManager();
  const frags = fm.getFragments();
  for (let i = 0; i < frags.size(); i++) {
    const f = frags.get(i);
    if (f instanceof androidx.fragment.app.DialogFragment && f.isVisible()) {
      f.dismiss();
      return true;
    }
  }
  return false;
};

/**
 * Register a back-press handler for the current screen (Android only).
 * Replaces any previously registered handler to prevent accumulation.
 * If a DialogFragment is visible when back is pressed, it is dismissed and
 * callback is not called - the dialog takes priority.
 * @param {Function} callback
 * @returns {boolean}
 */
export const attachBackHandler = callback => {
  if (!isAndroid) return false;

  detachBackHandler();

  currentBackHandler = args => {
    args.cancel = true;
    if (!dismissVisibleDialog()) callback();
  };

  Application.android.on(Application.android.activityBackPressedEvent, currentBackHandler);

  return true;
};

/**
 * Navigate back in the topmost frame, guarding against double-triggers
 */
export const goBack = () => {
  Utils.dismissSoftInput();
  const frame = Frame.topmost();
  if (frame?.canGoBack() && frame.navigationQueueIsEmpty()) {
    frame.goBack();
  }
};

/**
 * Remove the handler registered by attachBackHandler.
 * @returns {boolean}
 */
export const detachBackHandler = () => {
  if (!isAndroid || !currentBackHandler) return false;

  Application.android.off(Application.android.activityBackPressedEvent, currentBackHandler);

  currentBackHandler = null;
  return true;
};
