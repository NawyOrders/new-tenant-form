# Nawy Orders – Restaurant Registration

A bilingual (Arabic and English) restaurant registration web app. It is a 4-step wizard for a new restaurant, with a live mobile preview of the restaurant's customer page beside the form.

## Features
- 4-step wizard: Main Info, Restaurant Identity, Branches, Package
- Bilingual (Arabic/English) with RTL/LTR layout
- Live phone preview updates instantly as you fill the form
- Branches on OpenStreetMap (Leaflet + Nominatim) with two-way sync between address, coordinates and map
- Max 2 branches, at least 1 required
- Local file preview for logo and menu (no server upload in this version)
- Mock submit with loading, success and error states

## Plans
The plans are mock data in `lib/constants.ts`. Each plan has three subscription durations.

| Plan | 3 months | 6 months | 12 months |
| --- | --- | --- | --- |
| Starter | 15,000 EGP | 32,000 EGP | 60,000 EGP |
| Growth | 17,000 EGP | 34,000 EGP | 62,000 EGP |

Both plans include: Android and iOS app, daily sales reports, menu and item management, and email support. Growth also includes AI features.

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
  constants.ts    # steps, palettes, plans, features, helpers
  validation.ts   # validation per step
  geocoding.ts    # Nominatim only (searchAddress / reverseGeocode)
  submitRegistration.ts
tailwind.config.ts
README.md
.env.example
```

## How to run
```bash
npm install
npm run dev
```

## Notes
- **Restaurant name:** can be edited in Step 1 and Step 2; both use the same `restaurantName` field and stay in sync.
- **Logo:** currently in Step 1 only (planned to move later). Step 2 shows it read-only with a "Change" button that goes back to Step 1.
- **Colors:** the light palette in `lib/theme.ts` is confirmed.
- **Menu:** upload is required in Step 1 (`error.menuMissing`).
- **Mocked parts:** recommended palettes, plans, features, submit flow, local logo/menu preview, and map styling.
- **Map:** OpenStreetMap tiles and Nominatim geocoding. Nominatim allows at most 1 request per second. Do not call it on every keystroke or mouse move.
- **Language:** switch between Arabic and English in the top bar. Switching language never clears form data. All text lives in `lib/i18n.ts`. To add a language, add its keys to `lib/i18n.ts` and update the helpers.
- **Theme:** all colors live in `lib/theme.ts` and are mirrored in `tailwind.config.ts`.
