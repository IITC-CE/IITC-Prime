// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isAndroid, Utils } from '@nativescript/core';
import { l } from '@nativescript-community/l';
import {
  confirm as confirmNative,
  alert as alertNative,
  action as actionNative,
} from '@nativescript/core/ui/dialogs';

// The core builds framework dialogs on Android, which take no Material 3 theme
const showMaterialDialog = ({
  title,
  message,
  items,
  okButtonText,
  cancelButtonText,
  ok,
  dismissed,
}) =>
  new Promise(resolve => {
    const { DialogInterface } = android.content;
    const builder = new com.google.android.material.dialog.MaterialAlertDialogBuilder(
      Utils.android.getCurrentActivity()
    );
    if (title) builder.setTitle(title);
    // A message would hide the items
    if (items) {
      builder.setItems(
        items,
        new DialogInterface.OnClickListener({ onClick: (d, i) => resolve(items[i]) })
      );
    } else if (message) {
      builder.setMessage(message);
    }
    if (okButtonText) {
      builder.setPositiveButton(
        okButtonText,
        new DialogInterface.OnClickListener({ onClick: () => resolve(ok?.()) })
      );
    }
    // Closes the dialog without a listener
    if (cancelButtonText) builder.setNegativeButton(cancelButtonText, null);
    // Also fires after OK, which has resolved by then
    builder.setOnDismissListener(
      new DialogInterface.OnDismissListener({ onDismiss: () => resolve(dismissed) })
    );
    builder.show();
  });

/**
 * Show confirmation dialog
 *
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog message
 * @param {string} [options.okButtonText='OK'] - OK button text
 * @param {string} [options.cancelButtonText='Cancel'] - Cancel button text
 * @returns {Promise<boolean>} True if OK was pressed, false otherwise
 */
export function confirm(options) {
  options = { okButtonText: l('dialog.ok'), cancelButtonText: l('dialog.cancel'), ...options };
  if (!isAndroid) return confirmNative(options);
  return showMaterialDialog({ ...options, ok: () => true, dismissed: false });
}

/**
 * Show alert dialog
 *
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog message
 * @param {string} [options.okButtonText='OK'] - OK button text
 * @returns {Promise<void>}
 */
export function alert(options) {
  options = { okButtonText: l('dialog.ok'), ...options };
  return isAndroid ? showMaterialDialog(options) : alertNative(options);
}

/**
 * Show action sheet dialog
 *
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string} [options.message] - Dialog message, iOS only
 * @param {string} [options.cancelButtonText='Cancel'] - Cancel button text
 * @param {string[]} options.actions - Array of action button texts
 * @returns {Promise<string>} Selected action text or cancelButtonText
 */
export function action(options) {
  options = { cancelButtonText: l('dialog.cancel'), ...options };
  if (!isAndroid) return actionNative(options);
  return showMaterialDialog({
    ...options,
    items: options.actions,
    dismissed: options.cancelButtonText,
  });
}
