# E2E tests

Appium + WebdriverIO tests that drive the debug build on a running emulator or
simulator. They start from a fresh install, which opens the Intel welcome page,
so no Ingress account is needed. The panel tests switch to the public demo server
(demo.iitc.app) to get a booted IITC.

```bash
npm --prefix e2e install

npm run build:android:debug
npm run e2e:android          # Android emulator with Google Chrome

ns build ios
npm run e2e:ios              # booted iOS simulator (or IOS_UDID=...)
```

`APP=/path/to/app` tests another build. Screenshots of failed tests go to
`e2e/artifacts/`. The first iOS run builds WebDriverAgent, the first Android
run downloads a Chromedriver matching the emulator's WebView.
