//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import store from "@/store";
import { GPS } from '@nativescript-community/gps';

const gps = new GPS();

export default class UserLocation {
  constructor() {
    this.watchId = undefined;
    this.lastLocation = null;
    this.lastOrientation = null;
    this.persistentZoom = false;

    this.locationOptions = {
      timeout: 6000,
      minimumUpdateTime: 1000,
      maximumAge: 3000,
    };

    this.approximateLocationOptions = { ...this.locationOptions, provider: "network" }

    // Listen for settings changes
    this.setupStoreWatcher();

    // Initialize based on current settings
    this.initializeFromSettings();
  }

  /**
   * Setup store watcher for settings changes
   */
  setupStoreWatcher() {
    // Watcher for showLocation
    store.watch(
      (state) => state.settings.showLocation,
      (enabled) => {
        if (enabled) {
          this.startContinuousTracking().then();
        } else {
          this.stopTracking();
        }
      }
    );

    // Watcher for persistentZoom
    store.watch(
      (state) => state.settings.persistentZoom,
      (enabled) => {
        this.persistentZoom = enabled;
      }
    );
  }

  /**
   * Initialize GPS based on current settings
   */
  initializeFromSettings() {
    const showLocationEnabled = store.getters['settings/isShowLocation'];
    this.persistentZoom = store.getters['settings/isPersistentZoom'];

    if (showLocationEnabled && gps.isEnabled()) {
      this.startContinuousTracking().then();
    }
  }

  /**
   * Start continuous GPS and compass tracking
   */
  async startContinuousTracking() {
    if (this.watchId !== undefined) {
      this.stopTracking();
    }

    try {
      await this.enableLocation();

      const watchId = await gps.watchLocation(
        (position) => this.locationReceived(position),
        (error) => this.locationError(error),
        this.locationOptions
      );

      this.watchId = watchId;

      // Start orientation tracking
      this.startOrientationTracking();

    } catch (error) {
      this.locationError(error);
    }
  }

  /**
   * Stop GPS and compass tracking
   */
  stopTracking() {
    if (this.watchId !== undefined) {
      gps.clearWatch(this.watchId);
      this.watchId = undefined;
    }

    this.stopOrientationTracking();
    this.lastLocation = null;
  }

  /**
   * Get current location once (for showLocation: false + locate button)
   */
  async getCurrentLocationOnce() {
    try {
      await this.enableLocation();

      const position = await gps.getCurrentLocation(this.approximateLocationOptions);
      return {
        lat: position.latitude,
        lng: position.longitude,
        accuracy: position.horizontalAccuracy
      };
    } catch (error) {
      this.locationError(error);
      return null;
    }
  }

  /**
   * Trigger map movement to current location
   */
  async triggerLocateOnce(persistentZoom = false) {
    const position = await this.getCurrentLocationOnce();
    if (!position) return;
    const { lat, lng } = position;
    await store.dispatch('map/locateMapOnce', { lat, lng, persistentZoom });
  }

  /**
   * Trigger locate action in plugin
   */
  async triggerLocate(persistentZoom = false) {
    if (this.lastLocation) {
      // Use GPS data with plugin
      const { lat, lng, accuracy } = this.lastLocation;
      await store.dispatch('map/userLocationLocate', { lat, lng, accuracy, persistentZoom });
    } else {
      // Fallback to built-in locate
      await this.triggerLocateOnce(persistentZoom);
    }
  }

  /**
   * Enable GPS if not enabled
   */
  async enableLocation() {
    if (!gps.isEnabled()) {
      await gps.authorize(true);
      await gps.enable();
      return gps.isEnabled();
    }
    return true;
  }

  /**
   * Handle GPS location updates
   */
  locationReceived(position) {
    const location = {
      lat: position.latitude,
      lng: position.longitude,
      accuracy: position.horizontalAccuracy,
    };
    this.lastLocation = location;
    store.dispatch('map/setLocation', location).then();
  }

  /**
   * Handle GPS errors
   */
  locationError(error) {
    console.error('GPS Error:', error);
  }

  /**
   * Update orientation in plugin via Vuex
   */
  async userLocationOrientation(direction) {
    await store.dispatch('map/userLocationOrientation', { direction });
  }

  /**
   * Start orientation/compass tracking
   */
  startOrientationTracking() {
    // TODO: Implement compass tracking
  }

  /**
   * Stop orientation tracking
   */
  stopOrientationTracking() {
    // TODO: Stop compass tracking
  }

  /**
   * Public method for locate button
   */
  async locate() {
    const showLocationEnabled = store.getters['settings/isShowLocation'];

    if (showLocationEnabled) {
      // Use `user-location` plugin
      await this.triggerLocate(this.persistentZoom);
    } else {
      // Single locate without tracking
      await this.triggerLocateOnce(this.persistentZoom);
    }
  }
}
