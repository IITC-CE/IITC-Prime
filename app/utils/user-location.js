// Copyright (C) 2022-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import store from "@/store";
import { GPS } from '@nativescript-community/gps';
import { Compass } from 'nativescript-compass';

const gps = new GPS();

export default class UserLocation {
  constructor() {
    this.watchId = undefined;
    this.lastLocation = null;
    this.persistentZoom = false;
    this.compassEnabled = false;

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
      async (enabled) => {
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
        console.log(`UserLocation: Compass not available yet, retrying in ${1000 * (retryCount + 1)}ms... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          this.startOrientationTracking(retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      console.log('UserLocation: Compass not available on this device - orientation tracking disabled');
      return;
    }

    try {
      const compassStarted = await Compass.startUpdating(
        {},
        (reading) => this.handleCompassUpdate(reading),
        (error) => {
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

      const userLocationPlugin = Object.values(plugins).find(plugin =>
        plugin.uid && plugin.uid === "User Location+https://github.com/IITC-CE/ingress-intel-total-conversion"
      );

      const targetStatus = enable ? 'on' : 'off';
      const action = enable ? 'on' : 'off';

      if (userLocationPlugin && userLocationPlugin.status !== targetStatus) {
        await store.dispatch('manager/managePlugin', {
          uid: userLocationPlugin.uid,
          action
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

    if (showLocationEnabled) {
      // Use `user-location` plugin
      await this.triggerLocate(this.persistentZoom);
    } else {
      // Single locate without tracking
      await this.triggerLocateOnce(this.persistentZoom);
    }
  }
}
