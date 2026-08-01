<p align="center">
  <img src="src/assets/LogoLight.png" alt="LazyCalAI logo" width="200">
</p>


# LazyCalAI

Free* OpenSource AI-powered calorie tracking for the lazy. Take a photo of your meal and LLM will break it down into calories, protein, carbohydrates, fat and fiber. No manual searching, no barcode scanning, no weighing.

Bring your own API key from any supported provider. Everything is stored on-device.

**Free means the app itself is free — no subscriptions or service charges. For Android you can use free API provider limits (FreeTier for Gemini, sharing data for OpenAI, and free models for OpenRouter) or use paid APIs if you want more freedom. iOS only supports FreeTier API keys for Gemini.*

## Built with AI under human supervision

This app was written using AI under close human supervision. The effort splits roughly 80/20 (AI/human). Ideas, prompts, code reviews, and edits were all done manually.

## Features

- **Onboarding**: enter your stats (age, height, weight, etc) to get a BMI/obesity reading and a personalized daily calorie goal with a chosen pace.
- **AI food recognition**: photograph or pick a meal image and get a per-item nutrition breakdown.
- **Multi-provider AI**: choose between OpenAI, Claude, Gemini, Grok, Qwen, and OpenRouter, with a model picker per provider.
- **Daily tracking**: a calorie ring shows progress against your goal; edit or delete recognized items.
- **History**: browse past days and drill into any day's meals.
- **Analytics**: charts of intake over time.
- **Export / import**: back up and restore your data (zip archive with photos).
- **Theming**: light and dark modes.
- **9 languages**: English, Russian, French, Spanish, Chinese, Japanese, German, Portuguese, Arabic.

## Stack

React Native 0.86 (New Architecture: Turbo Modules + Fabric), React 19, TypeScript.

- **State**: Zustand
- **Local DB**: WatermelonDB (SQLite)
- **Storage**: MMKV (settings/keys)
- **Filesystem**: react-native-fs-turbo
- **Camera**: react-native-vision-camera
- **Library**: react-native-image-picker, @react-native-documents/picker
- **Navigation**: React Navigation v6
- **i18n**: i18next
- **Backup**: react-native-zip-archive
- **OTA updates**: @bravemobile/react-native-code-push (Soomgo fork), hosted on Cloudflare R2

## Requirements

- Node >= 22.11.0
- Android SDK 26+ (targets SDK 36)
- Xcode + CocoaPods (via Bundler) for iOS
- An API key for at least one supported AI provider

## Setup
with `npm`:
```sh
npm install
```
with `yarn`:
```sh
yarn install
```

For iOS, install pods after any native dependency change:

with `npm`:
```sh
npm run pod:install
```
with `yarn`:
```sh
yarn pod:install
```

## Run
with `npm`:
```sh
npm start            # start Metro
npm run ios          # build and launch iOS
npm run android      # build and launch Android
```
with `yarn`:
```sh
yarn start           # start Metro
yarn ios             # build and launch iOS
yarn android         # build and launch Android
```

## API Key

The app needs an API key for a vision-capable model from one of the supported providers. Enter it during onboarding or in Settings, then pick a provider and model. Keys are stored locally via MMKV and never leave the device except in requests to your chosen provider.

## Project Layout

```
src/
  api/           multi-provider LLM clients; selection via providerFactory.ts
  components/    reusable UI (CalorieRing, MealCard, CameraView, charts, ...)
  db/            WatermelonDB schema, models, operations
  hooks/         custom hooks (useAnalyzeFood, useDB)
  i18n/          i18next translations (en.json is source of truth)
  navigation/    React Navigation stacks
  screens/       screens, including onboarding/
  store/         Zustand stores (ai, meal, settings, toast)
  theme/         theming via context + hook
  types/         shared TypeScript types
  utils/         calorie/BMI math, image compression, export/import
```

## Development
with `npm`:
```sh
npm run lint         # eslint
npx tsc --noEmit     # type check
```
with `yarn`:
```sh
yarn lint            # eslint
yarn tsc --noEmit    # type check
yarn test            # jest
```

### Adding an AI provider

Add a client in `src/api/`, wire it into `providerFactory.ts`, and extend `AIProviderType` in `src/types/index.ts`. Register its models in `PROVIDER_MODELS` and a default in `PROVIDER_DEFAULT_MODEL`.

### Unlocking all providers on iOS (demo builds only)

The published iOS build is locked to Gemini on a free-tier key. Two platform overrides do this, and Metro picks them up automatically for iOS because of the `.ios.ts` suffix:

- [src/api/providerPolicy.ios.ts](src/api/providerPolicy.ios.ts) sets `LOCKED_PROVIDER` / `LOCKED_MODEL`, which hides the provider and model pickers and pins the stored settings.
- [src/api/providerFactory.ios.ts](src/api/providerFactory.ios.ts) builds only `GeminiProvider` (wrapped in the free-tier guard), so no other provider client ends up in the iOS bundle.

To get the full provider list in a local build, delete both files:

```sh
rm src/api/providerFactory.ios.ts src/api/providerPolicy.ios.ts
```

Metro then falls back to the shared [providerFactory.ts](src/api/providerFactory.ts) and [providerPolicy.ts](src/api/providerPolicy.ts), where `LOCKED_PROVIDER` is `null`, and iOS behaves like Android: every provider and model is selectable with your own key. Restart Metro with a cleared cache (`npm start -- --reset-cache`) and rebuild the app. An existing install keeps its stored Gemini settings; pick another provider in Settings.

This is for local demonstration and development only. Keep the overrides in place for anything you submit to the App Store, since the restriction is what keeps that build compliant.

### Changing the DB schema

Bump `version` in `src/db/schema.ts` and add a matching migration. Never edit the schema without a migration.

### Adding a user-facing string

Add the key to all locale files in `src/i18n/`, not just `en.json`. Access strings through i18next; never hardcode.

## Over-the-air updates (CodePush)

The app ships JS-only updates without an app-store review using the Soomgo fork of CodePush (`@bravemobile/react-native-code-push`). This fork is serverless: there is no App Center. Release-history JSON and the JS bundles are hosted on Cloudflare R2, and the app fetches the release history for its binary at startup ([src/utils/codePush.ts](src/utils/codePush.ts)).

### Version model

There are two version numbers, and they must line up:

- The **native binary version** (`CFBundleShortVersionString` on iOS, `versionName` on Android) selects the history file:
  `history/{platform}/{bundleId}/{binaryVersion}.json`
- The **keys inside that file** are the OTA release versions (semver). The lowest key equals the binary version (the bundle baked into the store build); higher keys are OTA updates layered on that binary. The app picks the highest enabled key newer than what it is running.

When you ship a new store build, bump the binary version and start a fresh history file.

### Configuration

- `code-push.config.ts` (repo root) uploads bundles and reads/writes the history JSON on R2. It is a release-time CLI file, not bundled into the app.
- CLI secrets live in `.env.codepush` (gitignored), loaded via `process.loadEnvFile`:
  `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CODE_PUSH_CDN_BASE_URL`.
- The app reads only `CODE_PUSH_CDN_BASE_URL` (the public R2 URL) via `react-native-config` from `.env`. Never put the R2 secret keys in `.env`; `react-native-config` embeds `.env` values into the app binary.

### Releasing

Seed the baseline when a new store build goes out:

```sh
npx code-push create-history -b 1.0.0 -p ios
npx code-push create-history -b 1.0.0 -p android
```

Push an OTA update to devices on that binary:

```sh
npx code-push release -p ios     -b 1.0.0 -v 1.0.1 -e index.js
npx code-push release -p android -b 1.0.0 -v 1.0.1 -e index.js
```

- `-b / --binary-version` picks the history file; `-v / --app-version` is the new release key and must be greater than the binary version.
- `-e index.js` is required because the CLI defaults its entry file to `index.ts`.
- Useful flags: `-m true` (mandatory), `--rollout <0-100>` (staged rollout), `--enable false` (upload but keep off). To pull a bad release, re-run with `--enable false` or use `update-history`.

Only release builds apply updates; debug builds load from Metro.

## Troubleshooting

AI results are estimates, not measurements. Keep a few things in mind:

- **Food weights may be off.** The model infers portion size from a photo, so it can over- or under-estimate how much is on the plate.
- **Ingredients can be missed.** Items that are hidden, blended in, or hard to see (oils, sauces, sugar) may not be picked up.
- **Models disagree.** Different providers and models interpret the same meal differently, so switching models can change the breakdown.

If a result looks wrong, adjust the weight or calorie count manually on the item. The other values (protein, carbs, fat, fiber) scale proportionally.

## License

MIT