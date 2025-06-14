//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import {Application, Utils, isAndroid, isIOS, Dialogs} from "@nativescript/core";

// Back button handler management
let currentBackHandler = null;

// Compass management
let compassManager = null;
let compassCallback = null;
let compassUpdateInterval = 200;

export const getStatusBarHeight = () => {
  let result = 0;
  if (Application.android) {
    const activity = Application.android.foregroundActivity || Application.android.startActivity;
    if(!activity) return 0;
    const resourceId = activity.getResources().getIdentifier('status_bar_height', 'dimen', 'android');
    if(!resourceId) return 0;
    result = activity.getResources().getDimensionPixelSize(resourceId);
    result = Utils.layout.toDeviceIndependentPixels(result);
  }
  return result;
}

export const getNavigationBarHeight = () => {
  let result = 0;
  if (Application.android) {
    const activity = Application.android.foregroundActivity || Application.android.startActivity;
    if(!activity) return 0;
    const resourceId = activity.getResources().getIdentifier('navigation_bar_height', 'dimen', 'android');
    if(!resourceId) return 0;
    result = activity.getResources().getDimensionPixelSize(resourceId);
    result = Utils.layout.toDeviceIndependentPixels(result);
  }
  return result;
}

/**
 * Check if compass hardware is available on device
 * @returns {boolean} True if compass is available
 */
export const isCompassAvailable = () => {
  try {
    if (isIOS) {
      return CLLocationManager.headingAvailable();
    } else if (isAndroid) {
      const activity = Application.android.foregroundActivity || Application.android.startActivity;
      if (!activity) return false;

      const sensorManager = activity.getSystemService(android.content.Context.SENSOR_SERVICE);
      const magnetometer = sensorManager.getDefaultSensor(android.hardware.Sensor.TYPE_MAGNETIC_FIELD);
      const accelerometer = sensorManager.getDefaultSensor(android.hardware.Sensor.TYPE_ACCELEROMETER);

      return magnetometer !== null && accelerometer !== null;
    }
    return false;
  } catch (error) {
    console.error('Error checking compass availability:', error);
    return false;
  }
};

/**
 * Start compass tracking with specified callback and update interval
 * @param {Function} callback - Function to call with heading updates (0-360 degrees)
 * @param {number} updateInterval - Update interval in milliseconds (default: 200ms)
 * @returns {boolean} True if compass started successfully
 */
export const startCompass = (callback, updateInterval = 200) => {
  if (!callback || typeof callback !== 'function') {
    console.error('Compass callback must be a function');
    return false;
  }

  if (!isCompassAvailable()) {
    console.log('Compass not available on this device');
    return false;
  }

  // Stop any existing compass tracking
  stopCompass();

  compassCallback = callback;
  compassUpdateInterval = updateInterval;

  try {
    if (isIOS) {
      return startCompassIOS();
    } else if (isAndroid) {
      return startCompassAndroid();
    }
    return false;
  } catch (error) {
    console.error('Error starting compass:', error);
    return false;
  }
};

/**
 * Stop compass tracking and cleanup resources
 * @returns {boolean} True if compass stopped successfully
 */
export const stopCompass = () => {
  try {
    if (isIOS && compassManager) {
      compassManager.stopUpdatingHeading();
      compassManager.delegate = null;
      compassManager = null;
    } else if (isAndroid && compassManager) {
      const activity = Application.android.foregroundActivity || Application.android.startActivity;
      if (activity) {
        const sensorManager = activity.getSystemService(android.content.Context.SENSOR_SERVICE);
        sensorManager.unregisterListener(compassManager.listener);
      }
      compassManager = null;
    }

    compassCallback = null;
    return true;
  } catch (error) {
    console.error('Error stopping compass:', error);
    return false;
  }
};

// iOS compass implementation using Core Location
const startCompassIOS = () => {
  try {
    // Create location manager for compass readings
    compassManager = CLLocationManager.alloc().init();

    // Create delegate to handle compass updates
    const CompassDelegate = NSObject.extend({
      locationManagerDidUpdateHeading: function(manager, heading) {
        if (heading.headingAccuracy >= 0 && compassCallback) {
          // Use true heading if available, otherwise magnetic heading
          const compassHeading = heading.trueHeading >= 0 ? heading.trueHeading : heading.magneticHeading;
          compassCallback(compassHeading);
        }
      },

      locationManagerDidFailWithError: function(manager, error) {
        console.error('iOS compass error:', error.localizedDescription);
      }
    }, {
      protocols: [CLLocationManagerDelegate]
    });

    compassManager.delegate = CompassDelegate.alloc().init();

    // Set heading filter for update sensitivity (1 degree)
    compassManager.headingFilter = 1.0;

    // Start compass updates
    compassManager.startUpdatingHeading();

    return true;
  } catch (error) {
    console.error('Error starting iOS compass:', error);
    return false;
  }
};

// Android compass implementation using sensor fusion
const startCompassAndroid = () => {
  try {
    const activity = Application.android.foregroundActivity || Application.android.startActivity;
    if (!activity) return false;

    const sensorManager = activity.getSystemService(android.content.Context.SENSOR_SERVICE);
    const magnetometer = sensorManager.getDefaultSensor(android.hardware.Sensor.TYPE_MAGNETIC_FIELD);
    const accelerometer = sensorManager.getDefaultSensor(android.hardware.Sensor.TYPE_ACCELEROMETER);

    // Store sensor readings for fusion calculation
    let magnetometerReading = null;
    let accelerometerReading = null;

    // Calculate compass heading from sensor fusion
    const calculateHeading = () => {
      if (!magnetometerReading || !accelerometerReading || !compassCallback) {
        return;
      }

      try {
        // Create rotation matrix from accelerometer and magnetometer data
        const rotationMatrix = Array.create('float', 9);
        const orientationAngles = Array.create('float', 3);

        const success = android.hardware.SensorManager.getRotationMatrix(
          rotationMatrix, null,
          accelerometerReading,
          magnetometerReading
        );

        if (success) {
          android.hardware.SensorManager.getOrientation(rotationMatrix, orientationAngles);

          // Convert azimuth to degrees and normalize to 0-360
          let azimuth = orientationAngles[0] * (180 / Math.PI);
          let heading = (azimuth + 360) % 360;

          compassCallback(heading);
        }
      } catch (error) {
        console.error('Error calculating compass heading:', error);
      }
    };

    // Create sensor event listener using correct NativeScript syntax
    const listener = new android.hardware.SensorEventListener({
      onSensorChanged: (event) => {
        if (event.sensor.getType() === android.hardware.Sensor.TYPE_MAGNETIC_FIELD) {
          // Store magnetometer readings
          magnetometerReading = [event.values[0], event.values[1], event.values[2]];
          calculateHeading();
        } else if (event.sensor.getType() === android.hardware.Sensor.TYPE_ACCELEROMETER) {
          // Store accelerometer readings
          accelerometerReading = [event.values[0], event.values[1], event.values[2]];
          calculateHeading();
        }
      },

      onAccuracyChanged: (sensor, accuracy) => {
        // Log calibration status for debugging
        if (accuracy < android.hardware.SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM) {
          console.log('Compass may need calibration - low accuracy detected');
        }
      }
    });

    // Use appropriate sensor delay based on update interval
    let sensorDelay;
    if (compassUpdateInterval >= 500) {
      sensorDelay = android.hardware.SensorManager.SENSOR_DELAY_NORMAL; // ~200ms
    } else if (compassUpdateInterval >= 150) {
      sensorDelay = android.hardware.SensorManager.SENSOR_DELAY_UI; // ~60ms
    } else if (compassUpdateInterval >= 50) {
      sensorDelay = android.hardware.SensorManager.SENSOR_DELAY_GAME; // ~20ms
    } else {
      sensorDelay = android.hardware.SensorManager.SENSOR_DELAY_FASTEST; // 0ms
    }

    // Register sensors with Android predefined delay constants
    const registered1 = sensorManager.registerListener(listener, magnetometer, sensorDelay);
    const registered2 = sensorManager.registerListener(listener, accelerometer, sensorDelay);

    if (registered1 && registered2) {
      compassManager = { listener };
      return true;
    } else {
      console.error('Failed to register compass sensors');
      return false;
    }

  } catch (error) {
    console.error('Error starting Android compass:', error);
    return false;
  }
};

/**
 * Universal sharing function for different content types
 * @param {any} content - Content to share (object for geo, string for text/url)
 * @param {string} contentType - Type of content ('geo', 'text', 'url', 'prime')
 * @param {string} title - Optional title or description
 * @returns {boolean} Success status
 */
export const shareContent = (content, contentType, title = '') => {
  try {
    if (isAndroid) {
      const activity = Application.android.foregroundActivity || Application.android.startActivity;
      if (!activity) return false;

      const intent = new android.content.Intent();

      if (contentType === "geo") {
        // Share as geo-coordinates
        const lat = content.lat;
        const lng = content.lng;
        const geoUri = `geo:${lat},${lng}?q=${lat},${lng}${title ? `(${encodeURIComponent(title)})` : ''}`;

        intent.setAction(android.content.Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse(geoUri));
      }
      else if (contentType === "url" || contentType === "text") {
        // Share as text or URL
        intent.setAction(android.content.Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(android.content.Intent.EXTRA_TEXT, content);
        if (title) {
          intent.putExtra(android.content.Intent.EXTRA_SUBJECT, title);
        }
      }
      else if (contentType === "prime") {
        // Open in Ingress Prime
        intent.setAction(android.content.Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse(content));
      }

      // Show app chooser dialog
      const chooserTitle = {
        geo: "Open in maps",
        url: "Open URL",
        text: "Share text",
        prime: "Open in Ingress Prime"
      }[contentType] || "Share via";

      const chooser = android.content.Intent.createChooser(intent, chooserTitle);
      activity.startActivity(chooser);

      return true;
    }
    else if (isIOS) {
      const shareItems = [];

      if (contentType === "geo") {
        // Share as geo location with URL schemes
        const lat = content.lat;
        const lng = content.lng;
        const locationTitle = title || `${lat},${lng}`;

        // Add text and multiple URL schemes for map apps
        shareItems.push(`${locationTitle}\nCoordinates: ${lat},${lng}`);
        shareItems.push(`maps://?ll=${lat},${lng}&q=${encodeURIComponent(locationTitle)}`);
        shareItems.push(`comgooglemaps://?q=${lat},${lng}`);
        shareItems.push(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      }
      else if (contentType === "url" || contentType === "text") {
        // Share as text or URL
        shareItems.push(content);
      }
      else if (contentType === "prime") {
        // Open directly in Ingress Prime
        const url = NSURL.URLWithString(content);
        UIApplication.sharedApplication.openURL(url);
        return true;
      }

      // Create and show UIActivityViewController
      const controller = UIActivityViewController.alloc().initWithActivityItemsApplicationActivities(
        shareItems, null
      );

      const rootController = UIApplication.sharedApplication.keyWindow.rootViewController;
      rootController.presentViewControllerAnimatedCompletion(controller, true, null);

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error sharing content:", error);
    return false;
  }
};

/**
 * Attach back button handler (Android only)
 * @param {Function} callback - Function to call when back button is pressed
 * @returns {boolean} Success status
 */
export const attachBackHandler = (callback) => {
  if (!isAndroid) return false;

  // Remove existing handler first to prevent accumulation
  detachBackHandler();

  // Create and store new handler
  currentBackHandler = (args) => {
    args.cancel = true;
    callback();
  };

  Application.android.on(
    Application.android.activityBackPressedEvent,
    currentBackHandler
  );

  return true;
};

/**
 * Detach current back button handler
 * @returns {boolean} Success status
 */
export const detachBackHandler = () => {
  if (!isAndroid || !currentBackHandler) return false;

  Application.android.off(
    Application.android.activityBackPressedEvent,
    currentBackHandler
  );

  currentBackHandler = null;
  return true;
};
