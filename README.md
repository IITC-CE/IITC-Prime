# IITC Prime

A new and modern way to use IITC on mobile

---

IITC Prime is a modern cross-platform mobile application for IITC (Ingress Intel Total Conversion) available on Android and iOS.
IITC Prime is built with NativeScript and Vue.js, using a single JavaScript/TypeScript codebase for both Android and iOS.
The app uses native UI components on each platform and features a clean, modern look inspired by Material 3 You.
The app supports in‑app updates of the IITC core and lets you switch effortlessly between stable, beta, and custom build channels — no reinstall needed.
IITC Prime simply makes using IITC on mobile easier and more enjoyable.

Status: Beta testing.

This app is not affiliated with Niantic Labs.

## Getting started

How to prepare your environment to work with NativeScript is described here: https://docs.nativescript.org/environment-setup.html

## Build Commands

Run the app:
```bash
npm run run:android
# or
npm run run:ios
```

## Version Management

Update version and sync:
```bash
npm run version:patch  # Increment patch version
npm run version:minor  # Increment minor version
npm run version:major  # Increment major version
```

## Environment Variables

- `BUILD_TYPE`: Set build variant (`debug` (default), `beta`, `release`)
- `APP_ID_SUFFIX`: Add custom suffix to application ID (e.g., `gplay`, `fdroid`)

## Development

Clean build:
```bash
npm run clean
```
