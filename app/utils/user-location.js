//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import store from "@/store";
import { GPS } from '@nativescript-community/gps';
const gps = new GPS();

export default class userLocation {
  constructor() {
    this.watchId = undefined;
    this.is_target = false;

    if (gps.isEnabled()) {
      this.locate(false);
    }
  }

  locate(is_target = true) {
    if (is_target) this.is_target = is_target;
    if (this.watchId !== undefined) gps.clearWatch(this.watchId);

    this.enableLocation()
      .then(() => {
        const self = this;
        gps.watchLocation(
          function(position) {
            self.locationReceived(position)
          },
          this.error,
          {
            timeout: 10000,
            minimumUpdateTime: 1000
          }
        ).then(watchId => (this.watchId = watchId));
      })
      .catch(this.error);

  }

  enableLocation() {
    if (!gps.isEnabled()) {
      return gps
        .authorize(true)
        .then(() => gps.enable())
        .then(() => gps.isEnabled());
    } else {
      return Promise.resolve(true);
    }
  }

  locationReceived(position) {
    store.dispatch(
      'setLocation',
      {
        lat: position.latitude,
        lng: position.longitude,
        accuracy: position.horizontalAccuracy,
        is_target: this.is_target
      });
    this.is_target = false;
  };

  error(err) {
    console.log('Error: ' + JSON.stringify(err));
  }
}
