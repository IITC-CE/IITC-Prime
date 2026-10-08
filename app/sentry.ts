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
    // 5xx from third-party plugin hosts are not actionable; the native iOS SDK captures them by default
    enableCaptureFailedRequests: false,
    dist: __SENTRY_DIST__,
    release: __SENTRY_RELEASE__,
    environment: __SENTRY_ENVIRONMENT__,
    appPrefix: __SENTRY_PREFIX__,
    beforeSend: event => {
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

  // Mask IP address for privacy
  Sentry.setUser({ ip_address: '0.0.0.0' });

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
  Trace.setErrorHandler(errorHandler);
}

// Report a non-fatal anomaly with context; logged locally when Sentry is disabled.
export function captureWarning(message: string, data?: Record<string, unknown>) {
  console.warn(`[Sentry] ${message}`, data ? JSON.stringify(data) : '');
  if (!__ENABLE_SENTRY__ || !initialized) return;
  Sentry.captureMessage(message, { level: 'warning', extra: data });
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
