// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { l } from '@nativescript-community/l';

const ERROR_MESSAGES = {
  network: 'manager.server_not_available',
  http: 'manager.server_error',
  invalid: 'manager.invalid_response',
  'not-in-catalog': 'manager.not_in_catalog',
};

/** Text for a lib-iitc-manager error; none (a check that threw) reads as a network error */
export function managerErrorText(error) {
  return l(ERROR_MESSAGES[error?.kind] ?? ERROR_MESSAGES.network, error?.status);
}
