// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * Maps legacy ic_* icons from old IITC Mobile app to FontAwesome equivalents.
 * These icons were used in the original Android IITC Mobile app.
 */
const LEGACY_ICON_MAP = {
  ic_action_about: 'fa-info-circle',
  ic_action_add_to_queue: 'fa-plus-circle',
  ic_action_cc_bcc: 'fa-envelope',
  ic_action_copy: 'fa-copy',
  ic_action_data_usage: 'fa-chart-bar',
  ic_action_error_red: 'fa-exclamation-circle',
  ic_action_error: 'fa-exclamation-triangle',
  ic_action_full_screen: 'fa-expand',
  ic_action_group: 'fa-users',
  ic_action_location_follow: 'fa-crosshairs',
  ic_action_location_found: 'fa-map-marker-alt',
  ic_action_new_event: 'fa-calendar-plus',
  ic_action_new: 'fa-plus',
  ic_action_paste: 'fa-paste',
  ic_action_place: 'fa-map-pin',
  ic_action_refresh: 'fa-sync',
  ic_action_return_from_full_screen: 'fa-compress',
  ic_action_save: 'fa-save',
  ic_action_search: 'fa-search',
  ic_action_share: 'fa-share-alt',
  ic_action_star: 'fa-star',
  ic_action_view_as_list_compact: 'fa-th-list',
  ic_action_view_as_list: 'fa-list',
  ic_action_warning_yellow: 'fa-exclamation-triangle',
  ic_action_warning: 'fa-exclamation-triangle',
  ic_action_web_site: 'fa-globe',
  ic_drawer: 'fa-bars',
  ic_iitcm: 'fa-map',
  ic_missions: 'fa-flag',
};

/**
 * Convert legacy icon name to FontAwesome equivalent.
 * Only transforms ic_* icons; all other formats pass through unchanged.
 * @param {string} icon - Icon name (ic_* legacy or any other format)
 * @returns {string} Mapped icon name
 */
export function mapIcon(icon) {
  if (!icon) return 'fa-question-circle';
  if (icon.startsWith('ic_')) {
    if (LEGACY_ICON_MAP[icon]) return LEGACY_ICON_MAP[icon];
    console.warn(`[PaneIconCompat] Unknown legacy icon: ${icon}`);
    return 'fa-question-circle';
  }
  return icon;
}
