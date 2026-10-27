# Nawy Orders – Restaurant Registration

A bilingual (Arabic and English) restaurant registration web app. It is a 4-step wizard for a new restaurant, with a live mobile preview of the restaurant's customer page beside the form.

## Features
- 4-step wizard: Main Info, Restaurant Identity, Branches, Package
- Bilingual (Arabic/English) with RTL/LTR layout
- Live phone preview updates instantly as you fill the form
- Branches on OpenStreetMap (Leaflet + Nominatim) with two-way sync between address, coordinates and map
- Max 2 branches, at least 1 required
- Logo and menu are uploaded to the backend as soon as they are chosen
- Real submit with an idempotency key, a success screen with the request id, duplicate and validation handling

## Packages
The package step loads the active subscription offers from the backend (`GET /api/v1/onboarding-requests/offers`). Package names, durations, prices and currency all come from the offer, nothing is hardcoded in the app. Offers are grouped by `packageCode` (`start` shows as Starter, `growth` shows as Growth), with one option per `durationMonths`.

## Uploads and submit
When a logo or a menu is chosen, step 1 asks for an upload URL (`POST /api/v1/onboarding-requests/upload-urls`, type 1 = logo, type 2 = menu). The slot is read from `data.uploads[0]`. The raw file is put on `uploadUrl` with exactly the returned `Content-Type` (the storage signs that header), then the asset is confirmed (`POST /api/v1/onboarding-requests/assets/{assetId}/confirm` with `X-Onboarding-Upload-Token`). The asset ids are stored only after the confirm succeeds. The form keeps the file when an upload fails, shows the message of the failed step, and retries only that step; the upload URL is requested again only when it is missing or past `expiresAtUtc`. Files above the local size limit are rejected before the upload URL request, and files above `maximumSizeBytes` are rejected before the PUT.

The last step validates every step before sending `POST /api/v1/onboarding-requests` with an `Idempotency-Key` header (generated once per submit attempt and reused on retry). `201` shows the request id, `409` means the request was already sent, `422` maps the backend errors to the form fields when possible, and network or 5xx failures keep all the data for a retry with the same key.

## Tech stack
- Next.js (App Router), TypeScript (strict), Tailwind CSS
- leaflet, react-leaflet
- Fonts: Noto Kufi Arabic (Arabic) and Inter (English) via next/font/google

## Project structure
```
app/
  layout.tsx
  page.tsx
  register/
    page.tsx
components/
  RegisterWizard.tsx
  TopBar.tsx
  StepIndicator.tsx
  steps/
    Step1MainInfo.tsx
    Step2Identity.tsx
    Step3Branches.tsx
    Step4Package.tsx
  branches/
    BranchCard.tsx
    BranchMap.tsx
  preview/
    PhonePreview.tsx
    PreviewBranch.tsx
  ui/
    TextInput.tsx
    Button.tsx
    FileUpload.tsx
lib/
  types.ts
  theme.ts        # ALL colors and shadows (only place for colors)
  i18n.ts         # ALL text in Arabic and English (only place for text)
  constants.ts    # steps, palettes, features, helpers
  validation.ts   # validation per step
  api/
    client.ts     # the only place that calls fetch
    types.ts      # the response wrapper and upload types
    offers.ts     # GET the active subscription offers
    uploads.ts    # upload URLs, presigned PUT, asset confirm
    onboarding.ts # POST the registration and map the backend errors
  geocoding.ts    # Nominatim only (searchAddress / reverseGeocode)
tailwind.config.ts
.env.example
README.md
```

## How to run
```bash
npm install
npm run dev
```

## Environment
Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to the backend base URL (for example `https://api.example.com`). There is no fallback: when the variable is missing or empty, the package step shows an error and the rest of the form keeps working. Restart the dev server after changing `.env.local`.

## Notes
- **Restaurant names:** Step 1 collects the Arabic name (Arabic letters only) and the English name (Latin letters only). The preview shows the Arabic name as the title and the English one directly under it.
- **Logo:** currently in Step 1 only (planned to move later). Step 2 shows it read-only with a "Change" button that goes back to Step 1.
- **Colors:** the light palette in `lib/theme.ts` is confirmed.
- **Menu:** upload is required in Step 1 (`error.menuMissing`).
- **Validation:** restaurant names must be 2 to 60 characters; the Arabic name may only use Arabic letters, spaces, hyphen, apostrophe or dot, and the English name only Latin letters with the same separators. Owner and branch names accept both scripts. Emails must match the strict email pattern. A branch closing time must differ from its opening time (overnight hours are allowed). Errors show on blur and on Next, and the preview shows a placeholder instead of an invalid value.
- **Branches in the request:** the branch phone is the owner phone for now (TODO), and `workingHours` is sent as `null` until the `DayOfWeek` format is confirmed.
- **Mocked parts:** recommended palettes, features, and map styling. Uploads and submit are real backend calls.
- **Map:** OpenStreetMap tiles and Nominatim geocoding. Nominatim allows at most 1 request per second. Do not call it on every keystroke or mouse move.
- **Language:** switch between Arabic and English in the top bar. Switching language never clears form data. All text lives in `lib/i18n.ts`. To add a language, add its keys to `lib/i18n.ts` and update the helpers.
- **Theme:** all colors live in `lib/theme.ts` and are mirrored in `tailwind.config.ts`.
