// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { FontIcon } from '@nativescript-community/fonticon';

/**
 * Maps legacy ic_* icons from old IITC Mobile app to Material Symbols equivalents.
 * These icons were used in the original Android IITC Mobile app.
 */
const LEGACY_ICON_MAP = {
  ic_action_about: 'ms-info',
  ic_action_add_to_queue: 'ms-add-circle',
  ic_action_cc_bcc: 'ms-mail',
  ic_action_copy: 'ms-content-copy',
  ic_action_data_usage: 'ms-bar-chart',
  ic_action_error_red: 'ms-error',
  ic_action_error: 'ms-warning',
  ic_action_full_screen: 'ms-fullscreen',
  ic_action_group: 'ms-group',
  ic_action_location_follow: 'ms-my-location',
  ic_action_location_found: 'ms-location-on',
  ic_action_new_event: 'ms-event',
  ic_action_new: 'ms-add',
  ic_action_paste: 'ms-content-paste',
  ic_action_place: 'ms-place',
  ic_action_refresh: 'ms-sync',
  ic_action_return_from_full_screen: 'ms-fullscreen-exit',
  ic_action_save: 'ms-save',
  ic_action_search: 'ms-search',
  ic_action_share: 'ms-share',
  ic_action_star: 'ms-star',
  ic_action_view_as_list_compact: 'ms-view-list',
  ic_action_view_as_list: 'ms-list',
  ic_action_warning_yellow: 'ms-warning',
  ic_action_warning: 'ms-warning',
  ic_action_web_site: 'ms-public',
  ic_drawer: 'ms-menu',
  ic_iitcm: 'ms-map',
  ic_missions: 'ms-flag',
};

/**
 * Convert a pane icon to a Material Symbols fonticon name.
 * Legacy ic_* icons are mapped; anything else is a Material Symbols name (`view_list`).
 * @param {string} icon - Legacy ic_* or Material Symbols icon name
 * @returns {string} Fonticon name with the `ms-` prefix
 */
export function mapIcon(icon) {
  if (!icon) return 'ms-help';
  const name = LEGACY_ICON_MAP[icon] || `ms-${icon.replace(/_/g, '-')}`;
  if (!FontIcon.css.ms?.[name]) {
    console.warn(`[PaneIconCompat] Unknown icon: ${icon}`);
    return 'ms-help';
  }
  return name;
}
