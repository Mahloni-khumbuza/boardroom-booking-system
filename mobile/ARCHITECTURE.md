# Mobile App Architecture

## Folder Structure

```
mobile/
├── src/
│   ├── api/                  # RTK Query base slice + per-domain endpoint injections
│   ├── config/               # Environment config (env.ts) — single source of truth
│   ├── design-system/        # Color, typography, spacing tokens — no components here
│   ├── features/             # One folder per product domain
│   │   └── <feature>/
│   │       ├── screens/      # React components mounted by the navigator
│   │       ├── components/   # Feature-private presentational components
│   │       ├── services/     # Business logic that orchestrates API + Redux
│   │       └── hooks/        # Custom hooks scoped to this feature
│   ├── navigation/           # Navigator definitions and param-list types
│   ├── shared/               # Cross-feature UI components, utils, and services
│   │   ├── components/       # Buttons, inputs, layout, feedback, modals
│   │   ├── services/         # Cross-cutting services (push notifications)
│   │   └── utils/            # Pure utility functions (format, validation)
│   └── store/                # Redux store, slices, typed hooks
├── app.json                  # Expo config
├── eas.json                  # EAS Build profiles (development / preview / production)
├── metro.config.js           # Metro bundler — mirrors tsconfig @/ alias
└── babel.config.js           # Babel — module-resolver for @/ alias
```

## Layer Rules

These rules enforce separation of concerns and prevent coupling between layers.

### 1. Screens do not call APIs directly

Screens may only:
- Call RTK Query hooks (from `@/api` or a feature's own api file)
- Read from the Redux store via `useAppSelector`
- Call feature service functions

Screens must NOT:
- Import from `api.slice.ts` directly
- Call `fetch` or `axios`
- Contain business logic beyond formatting for display

### 2. Feature services orchestrate, not render

Services in `features/<name>/services/` coordinate API calls, storage, and Redux dispatch. They are plain TypeScript objects/functions — no JSX, no hooks.

### 3. Shared components are presentation-only

Components under `src/shared/components/` must not:
- Import from any feature folder
- Call API hooks
- Access the Redux store

They receive everything they need via props.

### 4. Design system provides tokens, not layout

`src/design-system/` exports primitive values (colors, spacing numbers, font sizes). It does not export React components. Components live in `src/shared/components/`.

### 5. Import from barrels, not deep paths

| From | Import via |
|------|-----------|
| API hooks | `@/api` or the feature's `*.api.ts` |
| Shared UI | `@/shared` |
| Design tokens | `@/design-system` |
| Store hooks | `@/store/hooks` |

Avoid deep imports like `@/shared/components/buttons/PrimaryButton` — use `@/shared`.

## Environment Variables

All env vars are accessed through `src/config/env.ts`. Never read `process.env.*` anywhere else.

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | Yes | Full API base URL including `/api` suffix |
| `EXPO_PUBLIC_APP_ENV` | No | `development` \| `staging` \| `production` (defaults to `development`) |

EAS injects `EXPO_PUBLIC_APP_ENV` per build profile. `EXPO_PUBLIC_API_BASE_URL` must be set in the EAS environment secrets for preview/production builds.

## EAS Build Profiles

| Profile | Channel | Distribution | Purpose |
|---------|---------|-------------|---------|
| `development` | development | Internal (APK) | Local dev with Expo Dev Client |
| `preview` | staging | Internal | QA / stakeholder testing |
| `production` | production | Store | App Store / Play Store release |

## Adding a New Feature

1. Create `src/features/<name>/screens/<Name>Screen.tsx`
2. Create `src/features/<name>/services/<name>.api.ts` injecting into `apiSlice`
3. Add the screen to the relevant navigator in `src/navigation/`
4. Export new API hooks from `src/api/index.ts`
5. Add Redux slice to `src/store/` if the feature needs local state beyond cache

## State Management

- **Server state** — RTK Query (cached, auto-invalidated via tags)
- **Auth state** — `auth.slice` (token, isAuthenticated)
- **User profile** — `user.slice` (current user details)
- **Feature UI state** — local `useState`/`useReducer` inside the feature; promote to a slice only if needed across features
