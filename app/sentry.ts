import { Application, Page, Trace, TraceErrorHandler } from '@nativescript/core';
import * as Sentry from '@nativescript-community/sentry';

declare const __SENTRY_DIST__: string;
declare const __SENTRY_RELEASE__: string;
declare const __SENTRY_ENVIRONMENT__: string;
declare const __ENABLE_SENTRY__: boolean;
declare const __SENTRY_PREFIX__: string;
declare const __SENTRY_DSN_IOS__: string;
declare const __SENTRY_DSN_ANDROID__: string;

let initialized = false;
export function initSentry() {
  if (initialized || !__ENABLE_SENTRY__) return;
  initialized = true;

  Sentry.init({
    dsn: __APPLE__ ? __SENTRY_DSN_IOS__ : __SENTRY_DSN_ANDROID__,
    debug: __DEV__,
    enableAppHangTracking: false,
    enableNativeCrashHandling: true,
    enableAutoPerformanceTracking: false,
    enableAutoSessionTracking: false,
    attachScreenshot: false,
    dist: __SENTRY_DIST__,
    release: __SENTRY_RELEASE__,
    environment: __SENTRY_ENVIRONMENT__,
    appPrefix: __SENTRY_PREFIX__,
    beforeSend: event => {
      // Strip IP address for privacy
      event.user = { ...event.user, ip_address: '0.0.0.0' };

      // debugsymbolicator.js sets platform='android' for .mjs files (NativeScript uses .mjs, not .js).
      // Fix: override to 'javascript' so Sentry's JS symbolication engine processes these frames.
      if (!__APPLE__ && event.exception?.values) {
        for (const ex of event.exception.values) {
          if (ex.stacktrace?.frames) {
            for (const frame of ex.stacktrace.frames) {
              if (frame.filename?.includes('/files/app/')) {
                frame.platform = 'javascript';
              }
            }
          }
        }
      }
      return event;
    },
  });

  Page.on('navigatedTo', event => {
    const page = event.object as Page;
    const name = page.actionBar?.title || 'Main';
    Sentry.addBreadcrumb({
      category: 'navigation',
      type: 'navigation',
      message: `Navigate to ${name}`,
      data: { isBackNavigation: (event as any).isBackNavigation },
    });
  });

  Application.on('uncaughtError', event => Sentry.captureException(event.error));
  Application.on('discardedError', event => Sentry.captureException(event.error));
  Trace.setErrorHandler(errorHandler);
}

// Call this after createApp() to capture errors thrown inside Vue components.
export function setupVueErrorHandler(app: { config: { errorHandler: unknown } }) {
  if (!__ENABLE_SENTRY__) return;
  app.config.errorHandler = (err: Error) => {
    Sentry.captureException(err);
  };
}

const errorHandler: TraceErrorHandler = {
  handlerError(error: Error) {
    if (__DEV__) {
      console.error(error);
      Trace.write(error, Trace.categories.Error);
      throw error;
    }
    Sentry.captureException(error);
  },
};
