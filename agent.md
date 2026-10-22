# agent.md: Nawy Orders Restaurant Registration

This file holds the standing rules for any AI agent working on this project.
Read it before every task. The task prompt adds details on top of these rules.

## Stack (fixed, do not change)
- Next.js (latest, App Router) + TypeScript (strict mode) + Tailwind CSS
- React state with useState and props only
- Leaflet + react-leaflet for the map (OpenStreetMap tiles only)
- Nominatim for address search and reverse geocoding
- No paid APIs, no API keys, no database, no auth in this version

## Forbidden
- No Redux, Zustand, Context API, or custom hooks
- No new libraries beyond the ones listed in the task prompt
- No Google Maps or any map service that needs a key
- No hardcoded hex colors inside components (colors live in lib/theme.ts)
- No hardcoded UI text inside components (text lives in lib/i18n.ts)
- No `any` type. No `@ts-ignore` unless there is a written reason in a comment
- No network request on every keystroke or mouse move
- No sending of files (logo, menu) to any server yet
- No extra pages, features, or sections not in the task prompt

## Code style
- Each file does one job and stays under about 150 lines.
- Every file starts with a short comment in simple English explaining what it does.
- Every prop and function has an explicit type. Shared types go in lib/types.ts.
- Prefer small, repeated code over clever abstractions.
- Use Tailwind logical classes (ms-, me-, ps-, pe-, start-, end-) so layouts flip correctly in RTL and LTR.

## Source of truth
1. The task prompt (latest version wins over older instructions)
2. The Figma screenshots for the form steps (layout and wording)
3. lib/theme.ts for colors, and lib/i18n.ts for all text
4. When two sources conflict, stop and report it instead of guessing.

## Working method
- Build one step at a time. After each step, run the type check and the dev server, and confirm the step works before moving on.
- Keep the form state in RegisterWizard only. Pass data down as props and changes back as callbacks.
- When something is unclear, do the part that is clear, mark the unclear part with a TODO comment, and list it in the final summary.

## Done means
- `npm run build` and the type check pass with no errors.
- Language toggle works on every step, and no data is lost when switching.
- Preview shows every entered value and updates instantly.
- README.md is updated with: what the app does, how to run it, what is mocked, and where the theme and text live.