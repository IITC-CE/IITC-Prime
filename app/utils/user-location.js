// Copyright (C) 2022-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import store from '@/store';
import { CoreTypes } from '@nativescript/core';
import { GPS } from '@nativescript-community/gps';
import { Compass } from 'nativescript-compass';
import { isFineLocationGranted } from '@/utils/platform/system';

const gps = new GPS();

const BASE_LOCATION_OPTIONS = {
  timeout: 6000,
  minimumUpdateTime: 1000,
};

// Continuous tracking: fresh fixes only
const WATCH_LOCATION_OPTIONS = {
  ...BASE_LOCATION_OPTIONS,
  maximumAge: 3000,
};

// Single locate button. Both need an explicit timeout: without it the library
// falls back to a 5-minute default, so a stalled attempt would never hand off.
const APPROXIMATE_LOCATION_OPTIONS = {
  maximumAge: 30000,
  timeout: 6000,
  provider: 'network',
  desiredAccuracy: CoreTypes.Accuracy.any,
};

const GPS_LOCATION_OPTIONS = {
  maximumAge: 30000,
  timeout: 8000,
  desiredAccuracy: CoreTypes.Accuracy.high,
};

// Hard cap for the whole locate flow. getCurrentLocation only arms its own
// timeout after the permission/enable step resolves, so a stuck permission
// dialog can hang indefinitely - this bounds the UI regardless.
const LOCATE_OVERALL_TIMEOUT = 20000;

export default class UserLocation {
  constructor() {
    this.watchId = undefined;
    this.lastLocation = null;
    this.persistentZoom = false;
    this.compassEnabled = false;

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
      state => state.settings.showLocation,
      async enabled => {
        if (enabled) {
          await this.toggleUserLocationPlugin(true);
          this.startContinuousTracking().then();
        } else {
          await this.toggleUserLocationPlugin(false);
          this.stopTracking();
        }
      }
    );

    // Watcher for persistentZoom
    store.watch(
      state => state.settings.persistentZoom,
      enabled => {
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
        position => this.locationReceived(position),
        error => this.locationError(error),
        WATCH_LOCATION_OPTIONS
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
    } catch (error) {
      this.locationError(error);
      return null;
    }

    // Approximate (network) first, then GPS; getCurrentLocation resolves null on timeout.
    // Skip the GPS attempt without FINE permission - it can only time out.
    const attempts = [APPROXIMATE_LOCATION_OPTIONS];
    if (isFineLocationGranted()) {
      attempts.push(GPS_LOCATION_OPTIONS);
    }
    for (const options of attempts) {
      try {
        const position = await gps.getCurrentLocation(options);
        if (position) {
          return this.toLocation(position);
        }
      } catch (error) {
        this.locationError(error);
      }
    }

    // Fresh-fix attempts failed; fall back to the last known location
    try {
      const lastKnown = gps.getLastKnownLocation();
      if (lastKnown) {
        return this.toLocation(lastKnown);
      }
    } catch (error) {
      this.locationError(error);
    }

    console.warn('User location: no fix from network, GPS, or last known location');
    return null;
  }

  /**
   * Normalize a GPS position into the app's location shape
   */
  toLocation(position) {
    return {
      lat: position.latitude,
      lng: position.longitude,
      accuracy: position.horizontalAccuracy,
    };
  }

  /**
   * Trigger map movement to current location
   */
  async triggerLocateOnce(persistentZoom = false) {
    const position = await this.getCurrentLocationOnce();
    if (!position) return false;
    const { lat, lng } = position;
    await store.dispatch('map/locateMapOnce', { lat, lng, persistentZoom });
    return true;
  }

  /**
   * Trigger locate action in plugin
   */
  async triggerLocate(persistentZoom = false) {
    if (this.lastLocation) {
      // Use GPS data with plugin
      const { lat, lng, accuracy } = this.lastLocation;
      await store.dispatch('map/userLocationLocate', { lat, lng, accuracy, persistentZoom });
      return true;
    }
    // Fallback to built-in locate
    return this.triggerLocateOnce(persistentZoom);
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
    const location = this.toLocation(position);
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
   * Handle compass heading updates from plugin
   */
  handleCompassUpdate(reading) {
    store.dispatch('map/userLocationOrientation', { direction: reading.heading }).then();
  }

  /**
   * Start orientation/compass tracking
   */
  async startOrientationTracking(retryCount = 0) {
    if (!Compass.isAvailable()) {
      // On startup, compass might not be ready yet - try again with delay
      if (retryCount < 3) {
        console.log(
          `UserLocation: Compass not available yet, retrying in ${1000 * (retryCount + 1)}ms... (attempt ${retryCount + 1}/3)`
        );
        setTimeout(
          () => {
            this.startOrientationTracking(retryCount + 1);
          },
          1000 * (retryCount + 1)
        );
        return;
      }

      console.log(
        'UserLocation: Compass not available on this device - orientation tracking disabled'
      );
      return;
    }

    try {
      const compassStarted = await Compass.startUpdating(
        {},
        reading => this.handleCompassUpdate(reading),
        error => {
          console.error('UserLocation: Compass error:', error);
        }
      );

      if (compassStarted) {
        this.compassEnabled = true;
        console.log('UserLocation: Compass tracking started successfully');
      } else {
        console.error('UserLocation: Failed to start compass tracking');
      }
    } catch (error) {
      console.error('UserLocation: Error starting compass:', error);
    }
  }

  /**
   * Stop orientation tracking
   */
  stopOrientationTracking() {
    if (this.compassEnabled) {
      try {
        const compassStopped = Compass.stopUpdating();
        if (compassStopped) {
          this.compassEnabled = false;
        }
      } catch (error) {
        console.error('UserLocation: Error stopping compass:', error);
      }
    }
  }

  /**
   * Toggle user-location plugin
   */
  async toggleUserLocationPlugin(enable) {
    try {
      let plugins = store.getters['manager/plugins'];
      if (!plugins || Object.keys(plugins).length === 0) {
        await store.dispatch('manager/loadPlugins');
        plugins = store.getters['manager/plugins'];
      }

      const userLocationPlugin = Object.values(plugins).find(
        plugin =>
          plugin.uid &&
          plugin.uid === 'User Location+https://github.com/IITC-CE/ingress-intel-total-conversion'
      );

      const targetStatus = enable ? 'on' : 'off';
      const action = enable ? 'on' : 'off';

      if (userLocationPlugin && userLocationPlugin.status !== targetStatus) {
        await store.dispatch('manager/managePlugin', {
          uid: userLocationPlugin.uid,
          action,
        });
      }
    } catch (error) {
      console.error(`Failed to ${enable ? 'enable' : 'disable'} user-location plugin:`, error);
    }
  }

  /**
   * Public method for locate button
   */
  async locate() {
    const showLocationEnabled = store.getters['settings/isShowLocation'];

    await store.dispatch('map/setLocationRequestState', 'locating');
    try {
      const work = showLocationEnabled
        ? this.triggerLocate(this.persistentZoom) // Use `user-location` plugin
        : this.triggerLocateOnce(this.persistentZoom); // Single locate without tracking
      const success = await this.withTimeout(work, LOCATE_OVERALL_TIMEOUT);
      await store.dispatch('map/setLocationRequestState', success ? 'idle' : 'error');
    } catch (error) {
      this.locationError(error);
      await store.dispatch('map/setLocationRequestState', 'error');
    }
  }

  /**
   * Reject if the wrapped promise does not settle within `ms`
   */
  withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Location request timed out')), ms);
      promise.then(
        value => { clearTimeout(timer); resolve(value); },
        error => { clearTimeout(timer); reject(error); }
      );
    });
  }
}
