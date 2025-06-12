//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import store from "@/store";
import { GPS } from '@nativescript-community/gps';
import { startCompass, stopCompass, isCompassAvailable } from './platform';

const gps = new GPS();

export default class UserLocation {
  constructor() {
    this.watchId = undefined;
    this.lastLocation = null;
    this.persistentZoom = false;
    this.compassEnabled = false;

    // Compass filtering properties
    this.filteredHeading = null;
    this.filterStrength = 0.85; // Higher value = more smoothing (0.0 - 1.0)
    this.lastCompassUpdate = 0;
    this.compassThrottleInterval = 100; // Minimum time between updates in ms

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
   * Apply low-pass filter to compass heading for smoother movement
   * Handles 0°/360° boundary correctly
   */
  filterCompassHeading(rawHeading) {
    // Initialize filter with first reading
    if (this.filteredHeading === null) {
      this.filteredHeading = rawHeading;
      return rawHeading;
    }

    // Calculate shortest angular distance between readings
    let delta = rawHeading - this.filteredHeading;

    // Handle 360°/0° boundary crossing
    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }

    // Apply exponential smoothing filter
    this.filteredHeading += delta * (1 - this.filterStrength);

    // Normalize to 0-360 range
    if (this.filteredHeading < 0) {
      this.filteredHeading += 360;
    } else if (this.filteredHeading >= 360) {
      this.filteredHeading -= 360;
    }

    return this.filteredHeading;
  }

  /**
   * Handle compass heading updates with filtering and throttling
   */
  handleCompassUpdate(heading) {
    const currentTime = Date.now();

    // Throttle updates to prevent too frequent calls
    if (currentTime - this.lastCompassUpdate < this.compassThrottleInterval) {
      return;
    }

    this.lastCompassUpdate = currentTime;

    // Apply smoothing filter to reduce jitter
    const smoothedHeading = this.filterCompassHeading(heading);
    store.dispatch('map/userLocationOrientation', { smoothedHeading }).then();
  }

  /**
   * Start orientation/compass tracking
   */
  startOrientationTracking() {
    if (!isCompassAvailable()) {
      console.log('Compass not available on this device - orientation tracking disabled');
      return;
    }

    const compassStarted = startCompass(
      (heading) => this.handleCompassUpdate(heading),
      200
    );

    if (compassStarted) {
      this.compassEnabled = true;
    } else {
      console.error('Failed to start compass tracking');
    }
  }

  /**
   * Stop orientation tracking
   */
  stopOrientationTracking() {
    if (this.compassEnabled) {
      const compassStopped = stopCompass();
      if (compassStopped) {
        this.compassEnabled = false;
        this.filteredHeading = null;
        this.lastCompassUpdate = 0;
      }
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
