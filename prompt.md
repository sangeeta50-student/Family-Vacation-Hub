# Master Prompt: Family Travel Hub

You are working on the Family Travel Hub app, a React + TypeScript + Vite app for managing shared family trip details. The app lives at:

`/Users/bhatnagars/Documents/Codex/2026-06-05/can-u-access-https-chatgpt-com/work/family-travel-hub-clone`

Do not modify the original Dropbox project unless explicitly asked. Work in this clone.

## Product Goal

Build a mobile-friendly family travel planning app where family members can sign in, complete MFA, and share the same trip details across their phones. Any family member should be able to add, edit, import, or delete trip information, and changes should sync through Supabase.

## Current Stack

- React 19
- TypeScript
- Vite
- Supabase Auth
- Supabase Row Level Security
- GitHub Pages deployment workflow
- Local dev server: `http://localhost:5173/`

## Supabase Setup

The local app uses `.env.local` with project-specific values. Do not commit `.env.local`.

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_FAMILY_ID=...
```

Only use the publishable/anon key in the frontend. Never put a service-role key in the app or GitHub.

Supabase schema and RLS policies are in:

`supabase/schema.sql`

The schema creates:

- `families`
- `family_members`
- `family_trips`

RLS requires:

- signed-in user
- membership in `family_members`
- MFA session level `aal2`

Family IDs and member emails should be stored in Supabase and GitHub Actions secrets, not committed to the repository.

## Authentication and Sync Behavior

The app flow is:

1. If Supabase env vars are missing, show setup screen.
2. If not signed in, show `AuthScreen`.
3. If signed in but MFA is not complete, show `MfaGate`.
4. After MFA, load shared trips from Supabase.
5. If Supabase is empty but local trips exist, migrate local trips to Supabase.
6. If Supabase load fails but local trips exist, show cached trips with the header message:
   `Showing saved trips; sync will retry`

Important files:

- `src/lib/supabase.ts`
- `src/lib/tripStore.ts`
- `src/hooks/useCloudTrips.ts`
- `src/components/AuthScreen.tsx`
- `src/components/MfaGate.tsx`
- `src/components/SupabaseSetupMissing.tsx`

## Implemented Trip Features

Each trip supports:

- Flights
- Hotels
- Cars
- Activities

Each type has:

- add button
- import details button
- modal form
- parser from pasted itinerary/reservation text
- card display
- edit button
- delete button with in-app confirmation modal

Native `prompt()` and `confirm()` were replaced with custom modals.

## Data Shape

Trip type is in:

`src/types/Trip.ts`

Flights:

`src/types/Flight.ts`

Activities:

`src/types/Activity.ts`

Cars and hotels are currently typed in `Trip.ts`.

## Existing Parsers

Flights:

`src/parsers/flightParser.ts`

Hotels:

`src/parsers/hotelParser.ts`

Activities:

`src/parsers/activityParser.ts`

Cars:

`src/parsers/carParser.ts`

Parser behavior should be conservative: only extract fields that exist in the matching manual form. Extra useful text should go into `notes`.

## Current Import Samples

Hotel sample parses:

- hotel name
- address
- phone if present
- check-in date/time
- check-out date/time
- notes

Activity sample parses:

- name
- date
- time
- location if present
- notes

Car rental sample parses:

- vehicle type
- vehicle/model
- pickup location
- pickup date
- pickup time
- drop-off location
- drop-off date
- drop-off time
- notes such as passenger count, mileage, bag limit, transmission, open hours

## UI Patterns

Keep UI consistent with the existing simple card/modal style:

- Inline styles are currently used throughout.
- Trip action buttons sit in the expanded trip card action bar.
- Import buttons follow add buttons.
- Modals use `src/components/Modal.tsx`.
- Cards use simple bordered panels.
- Notes should be displayed as a distinct notes block when they are long or multi-line.

Important current card files:

- `src/components/FlightCard.tsx`
- `src/components/HotelCard.tsx`
- `src/components/CarCard.tsx`
- `src/components/ActivityCard.tsx`
- `src/components/TripCard.tsx`

For car cards, display pickup/drop-off location separately from date and time, similar to flight cards:

- pickup location
- drop-off location
- date range
- time range

## Deployment

GitHub Pages workflow exists at:

`.github/workflows/deploy.yml`

The workflow uses GitHub Actions secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_FAMILY_ID`

The repo currently had no GitHub remote at the time this prompt was written. Deployment still requires pushing to GitHub and adding those secrets.

## Commands

Use these before considering work complete:

```bash
npm run build
npm run lint
```

If the local app needs testing:

```bash
npm run dev
```

The dev server should run at:

`http://localhost:5173/`

## Known Notes

- User wants no paid services. Use free-tier Supabase and GitHub Pages.
- MFA is desired for added security and should stay required.
- The user is comfortable using Chrome/Supabase with guidance, but do not handle passwords or secret service-role keys.
- If adding users, add their email to `family_members` after they create an app account.
- Do not remove or overwrite existing user trip data unless explicitly asked.
- Be careful with localStorage migration: it may copy temporary local trips into Supabase.

## Future Work Style

When adding new reservation types or importers:

1. Add/extend the TypeScript type.
2. Add a parser in `src/parsers`.
3. Add a card component in `src/components`.
4. Add state and handlers in `src/App.tsx`.
5. Add Add and Import buttons to the expanded trip toolbar.
6. Add manual form modal and import modal.
7. Add display section below the relevant trip.
8. Run parser checks on sample text.
9. Run `npm run build` and `npm run lint`.
