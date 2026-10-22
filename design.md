> **Superseded (AH-237):** colors, typography, radius and components now follow `Nawy-Order-DESIGN.md`. Values below are the older draft and kept only for history.

# design.md — Nawy Orders Super Admin Dashboard

Visual system derived from `screen.png` (style only) and spec §11 (colors). Content/IA follows the spec, not the screenshot.

## 1. Tokens

### Color (from spec)
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FDF8F3` | page background |
| `--bg-2` | `#FFEFE3` | secondary bg: selected rows, selection bar, soft panels |
| `--card` | `#FFFFFF` | cards, table, dialogs, sidebar |
| `--primary` | `#E43820` | primary buttons, active nav, links, focus ring |
| `--primary-dark` | `#B8251A` | hover/pressed, high-contrast text on tinted bg |
| `--primary-light` | `#FF6B4A` | accents, gradient end, icon tints |

### Color (derived from screenshot — functional, not in spec)
| Token | Hex | Use |
|---|---|---|
| `--text` | `#1B1410` | headings, body |
| `--text-muted` | `#7A6F69` | secondary text, table headers |
| `--border` | `#F0E6DD` | card/table dividers |
| `--success-bg / fg` | `#E6F6EC / #167A3E` | Active / Published / Healthy |
| `--warning-bg / fg` | `#FFF4D6 / #9A6200` | Pending / Expiring soon / In preparation |
| `--danger-bg / fg` | `#FDE7E4 / #B8251A` | Inactive / Expired / Error |
| `--neutral-bg / fg` | `#F3EEE9 / #5E544D` | Not tracked / Not started / Draft |
| `--info-bg / fg` | `#E8F0FE / #1F4FB4` | Submitted to store / info |
Verify contrast ≥ 4.5:1 for all fg/bg pairs; adjust fg darker if it fails.

### Typography
- Font: **Inter** (fallback `system-ui, sans-serif`). Numerals tabular in tables and KPIs (`font-variant-numeric: tabular-nums`).
- Scale: Page title 24/32 semibold • Section title 20/28 semibold • KPI value 32/36 bold • Body 14/20 • Table cell 14/20 • Caption/meta 12/16 • Table header 12/16 medium, muted, no uppercase.
- IDs (Tenant ID) in monospace 13px.

### Shape & elevation
- Radius: cards 20px, inner panels/inputs/buttons 12px, pills 8px, avatar tiles 10px.
- Shadow: cards `0 1px 2px rgba(120,60,30,.04), 0 8px 24px rgba(120,60,30,.05)`; primary button `0 6px 16px rgba(228,56,32,.25)`.
- Spacing base 4px; page padding 24–32px; card padding 24px; grid gap 24px.

## 2. App shell
- **Sidebar** (width 280, white card-like, full height): logo tile (rounded square, primary gradient with white bowl/flame glyph) + "Nawy Orders" wordmark on the left of the top. Nav items 48px high, 12px radius, icon + label, muted by default; **active item = solid `--primary` background, white text, trailing chevron**, with soft shadow. Items (spec §3.2): Overview, Restaurants, Subscriptions, Packages & Features, Activity Logs, Platform Settings. No sub-chevrons unless a section actually has children. Bottom: account block (avatar, name, role "Super Admin", chevron → menu with Sign out). **No upgrade/PRO card. No version tag.**
- **Top bar** (inside content area, transparent over `--bg`): left = greeting/page title + one-line subtitle in muted text; right = search field (white, 12px radius, search icon, placeholder "Search restaurants…"), notification bell (white icon button; disabled with no dot until notifications are decided), settings icon button, primary button **"+ Add Restaurant"** (icon + label).
- "Demo data" pill next to the title while mock provider is active (warning style).
- Content max width fluid; sidebar collapses to icon rail 768–1279 (icons + tooltip on hover/focus), and becomes an off-canvas drawer below 768.
- **Mobile sidebar (<768):** opened from a hamburger button at the start of the top bar. The drawer shows **full text labels next to every icon** (same 48px nav items, same active style: solid primary, white text, chevron). Never icon-only on mobile. Drawer width `min(85vw, 320px)`, with a dimmed backdrop, close button, closes on backdrop tap / Esc / route change, focus trapped while open. The account block (avatar, name, "Super Admin", Sign out) stays pinned at the bottom of the drawer with its text visible. Labels must be `nowrap` and never clipped.

## 3. Overview page
### KPI cards (4, grid 4→2→1)
White card, 20px radius, padding 24. Layout: left a 64px circular icon tile tinted per card; right the label (muted 14px, **single line**) over the value (32 bold). Optional small caption line only if backed by data (e.g. "Expiring within 30 days").
1. Total Restaurants — store icon, primary tint
2. Active Restaurants — check-circle, success tint
3. Active Subscriptions — badge-check/credit-card, info tint
4. Expiring Soon — clock, warning tint
No trend arrows, no percentages, no uptime. The KPI cards stay exactly as they are; the analysis section is added below them.

### Analysis section (below KPI cards, above the table)
Two-column grid on ≥1280 (chart left, recent contracts right), stacked below.

**A. Contracts per month (bar chart)**
- Card title "New Contracts per Month", subtitle "Last 6 months".
- Vertical bars, one per calendar month for the last 6 months (current month included), count of restaurants whose contract start date falls in that month. Show the value above each bar, and month labels (e.g. "Oct 26") on the x-axis.
- Tooltip on hover/focus: month, count, and the restaurant names in that month (max 5, then "+N more").
- Empty month = zero-height bar with the "0" label (never hide months).
- Chart has a text table alternative for screen readers (visually hidden) and a "View as table" toggle.

**B. Total sales card — DISABLED by default**
- A slot reserved for a sales total. Rendered only when `FEATURES.overviewRevenue` is true in `config/`. Default false. Reason: revenue/sales figures are out of scope until approved (agent.md §2, §4 rule 11).
- When disabled, nothing is shown in its place (the grid reflows to the chart only). Do not render a placeholder with a number.

**C. Recent contracts table — "Latest 8 restaurants"**
- Card title "Latest Contracts", subtitle "8 most recently signed restaurants".
- Columns: Restaurant (logo tile + name), Tenant ID (mono), Package pill, Duration, Contract Date, Restaurant Status pill, Subscription Status pill.
- Sorted by contract date descending, then by Tenant ID descending as a tie-breaker. Shows exactly 8 rows, or fewer with an empty-state note if there are fewer restaurants.
- "View all" link → Restaurants list pre-filtered by newest.

**D. Expiring within 2 weeks table — "Ending Soon"**
- Card title "Subscriptions Ending Within 14 Days", subtitle "Still active, expires in 0 to 14 days".
- Includes subscriptions where `0 ≤ daysRemaining ≤ 14` (today counts; already expired ones are NOT in this table, they show as Expired in the Subscriptions page).
- Columns: Restaurant, Tenant ID, Package pill, Expiry Date, Days Remaining (number + text "3 days left"), Subscription Status pill, action "Renew" (opens Edit subscription, permission-gated).
- Sorted by days remaining ascending (most urgent first).
- Empty state: "No subscriptions ending in the next 14 days."
- Days remaining text uses warning color AND the text; ≤ 3 days uses danger style with text.

Both tables: nowrap cells, horizontal scroll inside their card, same row height and styles as the Restaurants table.

### Restaurants table card
- Card header: title "All Restaurants" (20 semibold) + subtitle in `--primary` ("Directory & subscriptions"); right-aligned toolbar: search (Name or Tenant ID), Sort-by dropdown ("Sort by: Newest"), Filter button with count badge (primary-tinted circle), Export button. All toolbar controls white/`--bg` tinted, 44px high, nowrap.
- **Filters panel/popover:** Package, Restaurant Status, Subscription Status, Expiring soon (toggle), Growth only (toggle). Applied filters shown as removable chips.
- **Selection bar** (appears when ≥1 row selected): `--bg-2` background, 1px primary-light border, 12px radius, "N items selected" • "Deselect all" underlined link • actions on the right: **Export** (white outlined). No Delete/Deactivate in V1.
- **Columns (in order):** checkbox • Restaurant (initials/logo tile 40px + name semibold + meta line muted) • Tenant ID (mono) • Package (Start/Growth pill) • Restaurant Status (pill) • Subscription Status (pill) • Start Date • Expiry Date (warning-colored text + icon if within threshold; danger if expired) • Branches (`2 / 4`) • Website/PWA (small pill or "Not tracked") • Mobile Apps (Growth: Android/iOS mini-pills with their own state; Start: "—") • Actions (kebab → View details, Edit subscription, Manage features, Activity log).
- Rows ~72px, hairline `--border` dividers, hover = very light `--bg`, selected row = `--bg-2`. Header row muted, sortable columns show up/down icon.
- Table lives in `overflow-x:auto` container; first two columns sticky on horizontal scroll; **all cells `white-space:nowrap`** except the restaurant name/meta which may truncate with ellipsis + title tooltip.
- Footer: "Showing 1 to 8 of N entries" muted • "Rows per page" select (8/16/32) • pagination: prev, numbered buttons (36px, 10px radius; active = solid primary white text), ellipsis, last page, next.

### Status pill spec
Height 28, padding 0 12, radius 8, 13px medium, leading 6px dot. Always text. Mapping:
- Restaurant Status: Active→success, Pending→warning, Inactive→danger (labels come from the confirmed enum; if the enum is extended, add a neutral fallback)
- Subscription Status: Active→success, Expiring soon→warning, Expired→danger, Not started→neutral
- Website/PWA: Ready→success, In setup→warning, Not tracked→neutral
- App: Published→success, Submitted to store→info, In preparation→warning, Not started→neutral

## 4. Restaurant Details
Header: back link, logo tile, name, Tenant ID (mono + copy), package pill, status pills, primary action "Edit subscription". Tabs (underline style, active = primary): **Overview • Subscription • Website & PWA • Mobile Apps • Branches • Activity Logs**.
- Overview: two-column cards (Brand: logo + color swatches • Contact • Current package • Statuses • Branch usage "n of 4").
- Subscription: package, duration (3/6/12), start/end, status, change history, reference price table (with the "tax/payment terms not confirmed" note).
- Website & PWA: URL, setup status, PWA status, applied brand data, preview link (only if exists).
- Mobile Apps: eligibility row (entitled by package) + per-platform status stepper `Not started → In preparation → Submitted → Published` + store links when published. Start restaurants: locked state explaining Growth-only.
- Branches: list + status + "n of 4 included" progress + note about extra-branch fee TBD.
- Activity Logs: filtered table for this tenant.

## 5. Create Restaurant (multi-step, dialog or full page)
Stepper at top (4 steps): **Basics → Subscription → Branches → Review**. Card layout, 2-column form grid, inline zod errors, Back/Next buttons, Next = primary.
- Basics: business name, restaurant name, contact (phone, email), logo upload, primary/secondary colors (color inputs + hex), social links (optional).
- Subscription: package (selectable cards: Start/Growth with their feature bullets), duration (segmented 3/6/12), restaurant status, start/end dates (manual).
- Branches: repeatable rows (name, address, phone), counter "n of 4 included".
- Review: read-only summary + "features that will be enabled" list → **Create restaurant**. After the mock API resolves: success state with "Open details" and "Back to list".
Do not include menu, delivery zones, offers or users.

## 6. Other pages
- **Subscriptions:** table of tenants with package, duration, start, expiry, status, days remaining; filters: status, package, expiring soon.
- **Packages & Features:** two package columns (Start, Growth) with feature matrix (Website, PWA, Restaurant Admin Panel, Android App, iOS App, Branches up to 4, Unlimited orders, No commission) + reference price table. Feature toggles per tenant are managed from the tenant's Manage features dialog; Android/iOS toggles disabled for Start.
- **Activity Logs:** table (Timestamp, Actor, Action, Target, Previous → New), filters by action type and date range, read-only, permission-gated.
- **Platform Settings:** simple placeholder page with "Not yet defined" empty state.

## 7. UI states (all required)
- **Loading:** skeleton rows/cards matching final layout.
- **Empty (no restaurants):** illustration/icon, "No restaurants yet", primary "Add your first restaurant".
- **No results:** "No restaurants match your search or filters" + "Clear filters".
- **Error:** inline error card with message + Retry.
- **Success:** toast bottom-end, success tint, auto-dismiss 4s, only after confirmed save.
- **Permission denied:** disabled action with tooltip + full-page "You don't have access" for gated routes.
- **Confirmation dialog:** title states the action, body states previous → new value, danger/primary confirm button, Cancel secondary.

## 8. Motion & interaction
150–200ms ease-out on hover/focus/dialog; no decorative animation; respect `prefers-reduced-motion`. Focus ring: 2px `--primary` with 2px offset on all interactive elements.

## 9. Responsive
- ≥1280: full layout, KPI 4 cols.
- 768–1279: sidebar icon-rail, KPI 2 cols, table scrolls inside card.
- <768: drawer sidebar **with icon + text labels** (see §2), KPI 1 col, toolbar stacks (search full width, then buttons), table scrolls inside card, "Add Restaurant" becomes icon-only FAB-style button in top bar.
