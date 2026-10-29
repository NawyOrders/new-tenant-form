# Nawy Orders – Restaurant Registration

A bilingual (Arabic and English) restaurant registration web app. It is a 4-step wizard for a new restaurant, with a live mobile preview of the restaurant's customer page beside the form.

## Features
- 4-step wizard: Main Info, Restaurant Identity, Branches, Package
- Bilingual (Arabic/English) with RTL/LTR layout
- Live phone preview updates instantly as you fill the form
- Branches on OpenStreetMap (Leaflet + Nominatim) with two-way sync between address, coordinates and map
- Max 2 branches, at least 1 required
- Logo and menu are uploaded to the backend as soon as they are chosen
- Brand palettes computed in the browser from the logo, with WCAG contrast checks
- Real submit with an idempotency key, a success screen with the request id, duplicate and validation handling

## Packages
The package step loads the active subscription offers from the backend (`GET /api/v1/onboarding-requests/offers`). Package names, durations, prices and currency all come from the offer, nothing is hardcoded in the app. Offers are grouped by `packageCode` (`start` shows as Starter, `growth` shows as Growth), with one option per `durationMonths`.

## Uploads and submit
The logo is uploaded from step 1 and from step 2 through the same helper (`uploadLogo`). In step 2 the "Change" button opens a file input right there, and the current logo stays on screen until the new upload is confirmed; a failure keeps the old logo and offers a retry. A menu is uploaded from step 1.

Every upload asks for an upload URL (`POST /api/v1/onboarding-requests/upload-urls`, type 1 = logo, type 2 = menu). The slot is read from `data.uploads[0]`. The raw file is put on `uploadUrl` with exactly the returned `Content-Type` (the storage signs that header), then the asset is confirmed (`POST /api/v1/onboarding-requests/assets/{assetId}/confirm` with `X-Onboarding-Upload-Token`). The asset ids are stored only after the confirm succeeds. The form keeps the file when an upload fails, shows the message of the failed step, and retries; the menu retry resumes at the failed step, so the upload URL is requested again only when it is missing or past `expiresAtUtc`. Files above the local size limit are rejected before the upload URL request, and files above `maximumSizeBytes` are rejected before the PUT.

The last step validates every step before sending `POST /api/v1/onboarding-requests` with an `Idempotency-Key` header (generated once per submit attempt and reused on retry). `201` shows the request id, `409` means the request was already sent, `422` maps the backend errors to the form fields when possible, and network or 5xx failures keep all the data for a retry with the same key.

## Logo palette
The palettes are computed in the browser, with no backend call. `lib/palette/extractPalette.ts` draws the logo on a canvas of 64×64 at most, drops the transparent, near white, near black and grey pixels, and keeps the six biggest color groups with a small k-means. `lib/palette/buildPalettes.ts` then builds exactly three palettes: the brand colors, a dark mode and a high contrast set. Every palette keeps the text at 4.5:1 or more and the primary color at 3:1 or more against its background, and only the background is adjusted for that, never the primary color. The three cards are UI state of step 2 and are recomputed when the logo changes. A manual color edit keeps the value and clears the selected card. When the logo has no usable color, the general swatches from `lib/constants.ts` are shown with a short message.

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
  identity/
    PaletteSuggestions.tsx   # no longer used (the palettes come from lib/palette)
lib/
  types.ts
  theme.ts        # ALL colors and shadows (only place for colors)
  i18n.ts         # ALL text in Arabic and English (only place for text)
  constants.ts    # steps, palettes, features, helpers
  validation.ts   # validation per step
  palette/
    extractPalette.ts  # the dominant colors of the logo, read on a canvas
    buildPalettes.ts   # brand, dark and contrast palettes with contrast checks
  api/
    client.ts     # the only place that calls fetch
    types.ts      # the response wrapper and upload types
    offers.ts     # GET the active subscription offers
    uploads.ts    # upload URLs, presigned PUT, asset confirm, uploadLogo
    palette.ts    # no longer used (the palettes are computed in the browser)
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
- **Restaurant names:** Step 1 and step 2 both collect the Arabic name (Arabic letters only) and the English name (Latin letters only); the two steps read and write the same fields. The preview shows the Arabic name as the title and the English one directly under it.
- **Logo:** step 1 uploads it, and step 2 can change it in place with the "Change" button, no navigation back to step 1.
- **Colors:** the light palette in `lib/theme.ts` is confirmed. The brand palettes of step 2 are read from the logo and never stored in `lib/theme.ts`.
- **Menu:** upload is required in Step 1 (`error.menuMissing`); the file is sent with the upload flow and the submit, and no extraction runs on it.
- **Validation:** restaurant names must be 2 to 60 characters; the Arabic name may only use Arabic letters, spaces, hyphen, apostrophe or dot, and the English name only Latin letters with the same separators. Owner and branch names accept both scripts. Emails must match the strict email pattern. A branch closing time must differ from its opening time (overnight hours are allowed). Errors show on blur and on Next, and the preview shows a placeholder instead of an invalid value.
- **Branches in the request:** the branch phone is the owner phone for now (TODO), and `workingHours` is sent as `null` until the `DayOfWeek` format is confirmed.
- **Mocked parts:** features and map styling. Uploads, submit and the logo palettes (in the browser) are real.
- **Map:** OpenStreetMap tiles and Nominatim geocoding. Nominatim allows at most 1 request per second. The address search runs on the button, on Enter, or automatically while typing (800 ms after the last keystroke, at least 3 characters).
- **Language:** switch between Arabic and English in the top bar. Switching language never clears form data. All text lives in `lib/i18n.ts`. To add a language, add its keys to `lib/i18n.ts` and update the helpers.
- **Theme:** all colors live in `lib/theme.ts` and are mirrored in `tailwind.config.ts`.
