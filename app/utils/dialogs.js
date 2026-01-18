// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isAndroid } from '@nativescript/core';
import {
  confirm as confirmMaterial,
  alert as alertMaterial,
  action as actionMaterial,
} from '@nativescript-community/ui-material-dialogs';
import {
  confirm as confirmNative,
  alert as alertNative,
  action as actionNative,
} from '@nativescript/core/ui/dialogs';

/**
 * Show confirmation dialog
 * Uses Material Dialogs on Android, native dialogs on iOS
 *
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog message
 * @param {string} [options.okButtonText='OK'] - OK button text
 * @param {string} [options.cancelButtonText='Cancel'] - Cancel button text
 * @returns {Promise<boolean>} True if OK was pressed, false otherwise
 */
export function confirm(options) {
  const confirmDialog = isAndroid ? confirmMaterial : confirmNative;
  return confirmDialog(options);
}

/**
 * Show alert dialog
 * Uses Material Dialogs on Android, native dialogs on iOS
 *
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog message
 * @param {string} [options.okButtonText='OK'] - OK button text
 * @returns {Promise<void>}
 */
export function alert(options) {
  const alertDialog = isAndroid ? alertMaterial : alertNative;
  return alertDialog(options);
}

/**
 * Show action sheet dialog
 * Uses Material Dialogs on Android, native dialogs on iOS
 *
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string} [options.message] - Dialog message
 * @param {string} [options.cancelButtonText='Cancel'] - Cancel button text
 * @param {string[]} options.actions - Array of action button texts
 * @returns {Promise<string>} Selected action text or cancelButtonText
 */
export function action(options) {
  const actionDialog = isAndroid ? actionMaterial : actionNative;
  return actionDialog(options);
}
