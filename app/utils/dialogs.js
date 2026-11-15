// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { isAndroid, Utils } from '@nativescript/core';
import { l } from '@nativescript-community/l';
import {
  confirm as confirmNative,
  alert as alertNative,
  action as actionNative,
  prompt as promptNative,
} from '@nativescript/core/ui/dialogs';

// The core builds framework dialogs on Android, which take no Material 3 theme
const showMaterialDialog = ({
  title,
  message,
  items,
  view,
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
    const content = view?.(builder.getContext());
    if (content) builder.setView(content);
    if (okButtonText) {
      builder.setPositiveButton(
        okButtonText,
        new DialogInterface.OnClickListener({ onClick: () => resolve(ok?.(content)) })
      );
    }
    // Closes the dialog without a listener
    if (cancelButtonText) builder.setNegativeButton(cancelButtonText, null);
    // Also fires after OK, which has resolved by then
    builder.setOnDismissListener(
      new DialogInterface.OnDismissListener({ onDismiss: () => resolve(dismissed) })
    );
    const dialog = builder.create();
    // Otherwise the keyboard waits for a tap on the field
    if (content) {
      dialog
        .getWindow()
        .setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);
    }
    dialog.show();
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

/**
 * Show a dialog with a text field
 *
 * @param {Object} options - Dialog options
 * @param {string} [options.title] - Dialog title
 * @param {string} [options.message] - Dialog message
 * @param {string} [options.defaultText] - Initial text of the field
 * @param {string} [options.okButtonText='OK'] - OK button text
 * @param {string} [options.cancelButtonText='Cancel'] - Cancel button text
 * @returns {Promise<string|null>} The text if OK was pressed, null otherwise
 */
export function prompt(options) {
  options = {
    defaultText: '',
    okButtonText: l('dialog.ok'),
    cancelButtonText: l('dialog.cancel'),
    ...options,
  };
  if (!isAndroid) return promptNative(options).then(({ result, text }) => (result ? text : null));
  const { TextInputLayout, TextInputEditText } = com.google.android.material.textfield;
  return showMaterialDialog({
    ...options,
    view: context => {
      const layout = new TextInputLayout(context);
      // The dialog's own content inset
      const inset = Utils.layout.toDevicePixels(24);
      layout.setPadding(inset, 0, inset, 0);
      const input = new TextInputEditText(layout.getContext());
      input.setSingleLine(true);
      input.setText(options.defaultText);
      input.selectAll();
      layout.addView(input);
      input.requestFocus();
      return layout;
    },
    ok: layout => String(layout.getEditText().getText()),
    dismissed: null,
  });
}
