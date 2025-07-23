# IITC Prime

IITC Prime is a new Android/iOS mobile application for IITC (Ingress Intel Total Conversion), built with NativeScript and Vue.js.

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
