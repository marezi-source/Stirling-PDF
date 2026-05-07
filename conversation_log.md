# My PDF — Project Checkpoint

**Last updated:** 2026-05-07 (Session 9)
**Branch:** main  
**Base:** Stirling-PDF (open-source fork)  
**Status: RUNNING** — backend on port 8080, frontend on port 5173

---

## Goal

Build "My PDF" — an editor-first, web-based collaborative PDF editor forked from Stirling-PDF. Four phases:

1. **Phase 1** — Rename/brand + curate tools (remove low-value tools)
2. **Phase 2** — Add a real-time collaboration layer (WebSocket, comments, review)
3. **Phase 3** — Reorder tool categories to lead with editing workflows
4. **Phase 4** — Sidebar UI redesign (modern, unified active state + brand mark)

All four phases are complete. The app is running.

---

## How to Run

### Prerequisites (all installed)
| Tool | Version | How installed |
|---|---|---|
| Java | Zulu 21.0.11 (x86-64) | Azul `.dmg` from azul.com |
| Node.js | v24.15.0 | nodejs.org `.pkg` |
| npm | 11.12.1 | bundled with Node |
| task | 3.50.0 | binary from GitHub releases → `/usr/local/bin/task` |

> macOS 12 (Intel x86-64) — Homebrew not usable for installing new packages (Tier 3 / build failures). Use direct binary/installer downloads instead.

### Start the app
```bash
cd "/Users/user/Downloads/Cloned Git-Hub Projects/PDF-Editor/Stirling-PDF"

# Terminal 1 — backend (port 8080)
task backend:dev

# Terminal 2 — frontend (port 5173)
# NOTE: must use 127.0.0.1 — "localhost" DNS resolution is broken on this machine
BACKEND_URL=http://127.0.0.1:8080 task frontend:dev
```

Open **http://127.0.0.1:5173** in the browser.

Default login: **admin / stirling** (created on first boot by `InitialSecuritySetup`).

---

## Phase 1: Branding & Feature Curation

### Branding

| File | Change |
|---|---|
| `frontend/index.html` | `<title>` → "OnePDF", meta description updated |
| `frontend/public/manifest.json` | `short_name` + `name` → "OnePDF" |

### Tools Removed (Frontend)

Removed from `CORE_REGULAR_TOOL_IDS` in `frontend/src/core/types/toolId.ts`:
- `scannerImageSplit`, `scannerEffect`, `autoRename`, `pageLayout`, `adjustContrast`, `pdfToSinglePage`, `replaceColor`, `showJS`, `bookletImposition`

Removed from `CORE_LINK_TOOL_IDS` (kept only `devApi`):
- `devFolderScanning`, `devSsoGuide`, `devAirgapped`

Removed entries from `frontend/src/core/data/useTranslatedToolRegistry.tsx`:
- Tool entries: `pageLayout`, `bookletImposition`, `pdfToSinglePage`, `autoRename`, `adjustContrast`, `scannerImageSplit`, `replaceColor`, `scannerEffect`, `showJS`
- Link entries: `devFolderScanning`, `devSsoGuide`, `devAirgapped`
- Operation config imports: `adjustContrast`, `singleLargePage`, `bookletImposition`, `autoRename`, `replaceColor`, `scannerImageSplit`

### Backend Controllers Deleted

| File | Reason |
|---|---|
| `app/core/.../controller/api/BookletImpositionController.java` | Booklet tool removed |
| `app/core/.../controller/api/MultiPageLayoutController.java` | Page layout tool removed |
| `app/core/.../controller/api/ToSinglePageController.java` | Single-page tool removed |
| `app/core/.../controller/api/misc/AutoRenameController.java` | Auto rename removed |
| `app/core/.../controller/api/misc/ExtractImageScansController.java` | Scanner split removed |
| `app/core/.../controller/api/misc/ReplaceAndInvertColorController.java` | Color tools removed |
| `app/core/.../controller/api/misc/ScannerEffectController.java` | Scanner effect removed |
| `app/core/.../controller/api/misc/ShowJavascript.java` | Show JS removed |
| `app/core/.../controller/api/converters/ConvertPdfToVideoController.java` | PDF-to-video removed |

**Modified:** `app/core/.../controller/api/converters/ConvertImgPDFController.java`
- Removed 4 endpoint methods: `convertCbzToPdf`, `convertPdfToCbz`, `convertCbrToPdf`, `convertPdfToCbr`
- Removed associated imports, constants, and helpers (`EXTENSION_PATTERN`, `createConvertedFilename`, CBR/CBZ utils)

---

## Phase 2: Collaboration Layer

### Backend — New Package: `stirling.software.proprietary.collab.*`

**Why proprietary module?** The collab layer depends on `User`, `UserService`, and `JwtService` which all live in `app/proprietary`.

**`app/proprietary/build.gradle`** — Added:
```groovy
implementation 'org.springframework:spring-websocket'
implementation 'org.springframework:spring-messaging'
```
> Uses `spring-websocket` directly (not the starter) to avoid pulling in Tomcat, since the project runs on Jetty.

**`app/proprietary/.../security/configuration/DatabaseConfig.java`** — Added collab packages to both annotations:
```java
@EnableJpaRepositories(basePackages = {
    ...,
    "stirling.software.proprietary.collab.repository"   // added
})
@EntityScan({
    ...,
    "stirling.software.proprietary.collab.model"        // added
})
```
> Without this, Spring Data JPA does not scan the new repository/entity packages (they are listed explicitly, not auto-discovered).

#### New Files

**`collab/config/WebSocketConfig.java`**
- `@EnableWebSocketMessageBroker`
- STOMP endpoint: `/ws` with SockJS fallback
- Message broker prefixes: `/topic`, `/queue`
- App destination prefix: `/app`
- Registers `WebSocketAuthChannelInterceptor`

**`collab/security/WebSocketAuthChannelInterceptor.java`**
- Intercepts `StompCommand.CONNECT`
- Extracts `Bearer` token from `Authorization` header
- Validates via `JwtService.extractUsername()`, loads `UserDetails`, sets `SecurityContext` principal

**`collab/model/CollabSession.java`** (`@Entity`, table: `collab_sessions`)
- `id` (UUID string), `documentId`, `documentName`
- `owner` (`@ManyToOne User`)
- `participants` (`@ManyToMany Set<User>`)
- `status` (enum: `OPEN | IN_REVIEW | APPROVED | CHANGES_REQUESTED | CLOSED`)
- `annotations` (`@OneToMany CollabAnnotation`)
- `createdAt`, `closedAt`

**`collab/model/CollabAnnotation.java`** (`@Entity`, table: `collab_annotations`)
- `id` (UUID string), `session` (`@ManyToOne`), `author` (`@ManyToOne User`)
- `type` (enum: `HIGHLIGHT | NOTE | DRAWING | SHAPE | COMMENT`)
- `pageNumber`, `coords` (TEXT), `content` (TEXT)
- `resolved`, `createdAt`, `updatedAt`

> Tables are auto-created by Hibernate (`spring.jpa.hibernate.ddl-auto=update`) — no migration files needed.

**`collab/repository/CollabSessionRepository.java`**
- Custom query uses `LEFT JOIN` (not `MEMBER OF` subquery — invalid HQL):
```java
@Query("SELECT DISTINCT s FROM CollabSession s LEFT JOIN s.participants p WHERE s.owner.username = :username OR p.username = :username")
List<CollabSession> findByParticipantUsername(@Param("username") String username);
```

**`collab/repository/CollabAnnotationRepository.java`**
- `findBySessionIdOrderByCreatedAtAsc(String sessionId)`

**`collab/dto/` — Java Records**
- `AnnotationPayload`, `WsMessage<T>`, `PresencePayload`, `SessionDto`

**`collab/service/CollabSessionService.java`**
- `createSession`, `getSession`, `inviteUser`, `getAnnotations`, `addAnnotation`, `updateAnnotation`, `deleteAnnotation`, `changeStatus`

**`collab/controller/CollabSessionWsController.java`** (STOMP)
- Handles annotation add/update/delete + presence broadcasts to `/topic/session/{id}`

**`collab/controller/CollabSessionRestController.java`**
- `POST /api/v1/collab/sessions`
- `GET /api/v1/collab/sessions/{id}`
- `POST /api/v1/collab/sessions/{id}/invite`
- `GET /api/v1/collab/sessions/{id}/annotations`
- `POST /api/v1/collab/sessions/{id}/review/submit|approve|request-changes`

---

### Frontend — New Files

**`frontend/package.json`** — Added:
```json
"@stomp/stompjs": "^7.0.0",
"sockjs-client": "^1.6.1",
"@types/sockjs-client": "^1.5.4"
```

**`frontend/src/core/hooks/collab/collabTypes.ts`** — TypeScript interfaces for all collab types

**`frontend/src/core/hooks/collab/useCollabSession.ts`** — STOMP WebSocket hook

**`frontend/src/core/components/collab/CollabPresence.tsx`** — Avatar presence bar

**`frontend/src/core/components/collab/CollabCommentThread.tsx`** — Threaded comment sidebar

**`frontend/src/core/components/collab/CollabReviewPanel.tsx`** — Review workflow panel

**`frontend/src/core/components/collab/CollabBar.tsx`** — Orchestrator shown in toolbar

**Modified: `frontend/src/core/components/viewer/PdfViewerToolbar.tsx`**
- Added `documentId?` and `documentName?` props
- Renders `<CollabBar>` when `documentId` is present

**Modified: `frontend/src/core/components/viewer/EmbedPdfViewer.tsx`**
- Passes `documentId` and `documentName` to `<PdfViewerToolbar>`

---

## Phase 3: Tool Category Reorder

**`frontend/src/core/data/toolsTaxonomy.ts`** — `SUBCATEGORY_ORDER`:

```
GENERAL → DOCUMENT_REVIEW → PAGE_FORMATTING → EXTRACTION → REMOVAL →
SIGNING → DOCUMENT_SECURITY → VERIFICATION → AUTOMATION → ADVANCED_FORMATTING → DEVELOPER_TOOLS
```

---

## Phase 4: Sidebar UI Redesign

Inspired by a clean two-panel navigation reference (dark active pills, muted inactive icons, brand mark at top).

### New CSS Variables — `frontend/src/core/styles/theme.css`

| Variable | Light | Dark |
|---|---|---|
| `--nav-btn-active-bg` | `#0f172a` (near-black) | `#e2e8f0` (near-white) |
| `--nav-btn-active-color` | `#f8fafc` | `#0f172a` |
| `--nav-btn-inactive-color` | `#374151` | `#9ca3af` |
| `--nav-btn-hover-bg` | `rgba(15,23,42,0.07)` | `rgba(226,232,240,0.1)` |

### `QuickAccessBar.ts` — Unified Active State

`getNavButtonStyle()` now returns the same dark pill for every button type (Reader, Files, Automate, Settings, etc.) instead of per-button accent colors. Inactive state is `transparent` background with muted icon color.

### `QuickAccessButton.tsx` — Full-Width Pill

- `backgroundColor` moved from the Mantine `ActionIcon` to the outer wrapper `div`
- Active state: wrapper gets `--nav-btn-active-bg` fill, `borderRadius: 10px`, full `width: 100%`
- Inactive state: transparent wrapper, icon/label colored with `--nav-btn-inactive-color`
- Hover on inactive: `--nav-btn-hover-bg` via CSS class `.qab-pill:not(.qab-pill--active):hover`
- Icon no longer scales up on active (size stays `"md"` always) — contrast comes from the background fill instead

### `ActiveToolButton.tsx`

Updated inline styles to use `--nav-btn-active-bg` / `--nav-btn-active-color` / `--nav-btn-hover-bg` instead of the old `--icon-tools-bg` vars.

### `QuickAccessBar.tsx` — Brand Mark

Added a `<div class="qab-brand">` block at the very top of the sidebar (above the header section) containing `<span class="qab-brand__text">My PDF</span>`.

### `QuickAccessBar.css` — New Rules

```css
.qab-brand { ... }           /* Centers the brand text at sidebar top */
.qab-brand__text { ... }     /* 0.6rem, 800 weight, uppercase, letter-spaced */
.qab-pill { ... }            /* Full-width wrapper base */
.qab-pill:not(.qab-pill--active):hover { background-color: var(--nav-btn-hover-bg) }
```

### Remaining Branding Fixes

| File | Change |
|---|---|
| `frontend/src/core/components/tools/ToolPanelModePrompt.tsx` | "Stirling PDF tools" → "OnePDF tools" |
| `frontend/src/core/components/fileEditor/AddFileCard.tsx` | `alt="Stirling PDF"` → `alt="OnePDF"` |

---

## Bugs Fixed During Startup

| Error | Root Cause | Fix |
|---|---|---|
| `processResources` failed — could not set file mode 644 | pdfjs-legacy locale files had wrong permissions | `find ... -exec chmod 644/755 {}` + `./gradlew clean` |
| `CollabSessionRepository` bean not found | `@EnableJpaRepositories` in `DatabaseConfig` had explicit package list missing collab | Added `stirling.software.proprietary.collab.repository` and `collab.model` to both annotations |
| Bad HQL grammar in `findByParticipantUsername` | `MEMBER OF (SELECT ...)` subquery is invalid HQL | Rewrote as `LEFT JOIN s.participants p WHERE p.username = :username` |

---

## Manual Test Checklist

### Phase 1–3
- [ ] Removed tools no longer appear in tool picker
- [ ] Kept tools still work (merge, split, compress, annotate, sign, etc.)
- [ ] Tool category order: General → Review → Page Formatting → ... → Automation
- [ ] "Collaborate" button appears in PDF viewer toolbar
- [ ] Create session → session ID shown in modal
- [ ] Invite user → second browser tab joins session
- [ ] Add annotation in Tab 1 → appears in Tab 2 in real time
- [ ] Comment thread filters (All / Open / Mine) work
- [ ] Submit for review in Tab 1 → status updates in Tab 2
- [ ] Approve / Request Changes flow works (owner only)
- [ ] Unauthenticated WebSocket connection is rejected (401)

### Phase 4 — Sidebar UI
- [ ] "ONEPDF" brand mark visible at top of left sidebar
- [ ] Active nav button shows dark near-black full-width pill (light mode)
- [ ] Active nav button shows near-white full-width pill (dark mode)
- [ ] Inactive nav buttons have no background, muted gray icon/label
- [ ] Hovering an inactive nav button shows a subtle dark tint
- [ ] All active states (Tools, Reader, Files, Automate, Settings) use the same unified color
- [ ] "OnePDF tools" text appears in the layout-picker modal

### Session 5 — Login Redesign + Landing Page + Brand Rename
- [ ] `http://localhost:5173/` shows the OnePDF marketing landing page (not the app)
- [ ] Logged-in users see "Open App" button in the landing page nav
- [ ] Unauthenticated users see "Login" and "Sign Up" buttons in the landing page nav
- [ ] Clicking "Upload file" or "Login" navigates to `/login`
- [ ] After logging in, user is redirected to `/app` (not `/`)
- [ ] `/app` route shows the full tool dashboard when authenticated
- [ ] Unauthenticated visit to `/app` redirects to `/login`
- [ ] Login page has full-screen black background
- [ ] OnePDF logo appears above the login form
- [ ] Top nav on login page has "← Back to home" and "Sign Up" button
- [ ] All visible "Stirling PDF" / "My PDF" references replaced with "OnePDF"
- [ ] `frontend/public/images/onepdf-login-logo.png` is the correct logo file

### Session 6 — Auth Fixes + Auth Layout Redesign + Dashboard
- [ ] "Login" nav button on landing page always opens `/login` (even when already logged in)
- [ ] "Sign up" nav button on landing page always opens `/signup` (even when already logged in)
- [ ] Login page shows the form without auto-redirecting to dashboard when session exists
- [ ] Signup page shows the form without auto-redirecting to landing page when session exists
- [ ] Login and Signup pages use two-panel card layout (left branding + right form)
- [ ] Left panel shows OnePDF logo (large), tagline, and 3 feature items
- [ ] Right panel shows title, subtitle, form fields, divider, and bottom cross-link
- [ ] Login bottom link: "Don't have an account? Sign up" navigates to `/signup`
- [ ] Signup bottom link: "Already have an account? Log in" navigates to `/login`
- [ ] After successful login, user lands at `/app/home` (dashboard)
- [ ] Dashboard shows sidebar with Home, Tools, Recent, Starred, Trash nav items
- [ ] Dashboard shows correct username and email in the top-right user chip
- [ ] Dashboard shows 8 Quick Tools in a 4-column grid
- [ ] Clicking any tool card navigates to `/app` (PDF workspace)
- [ ] Recent Files table shows up to 5 files from IndexedDB (or empty state)
- [ ] Direct navigation to `/app` still opens the PDF workspace as before

---

## Key Architecture Notes

| Concern | Decision |
|---|---|
| WebSocket server | `spring-websocket` + `spring-messaging` (no starter — avoids Tomcat conflict with Jetty) |
| DB schema | Hibernate `ddl-auto=update` auto-creates `collab_sessions` / `collab_annotations` |
| Auth on WS | `ChannelInterceptor` validates JWT on `CONNECT` frame |
| Collab package location | `app/proprietary` (depends on `User`, `UserService`, `JwtService`) |
| JPA scanning | Must be explicitly listed in `DatabaseConfig` `@EnableJpaRepositories` / `@EntityScan` |
| Frontend WS client | `@stomp/stompjs` + `sockjs-client` |
| JWT decode (frontend) | Inline `atob(token.split(".")[1])` — no extra library |
| Import paths | All new frontend files use `@app/*` as required by CLAUDE.md |
| macOS 12 constraint | No Homebrew for new packages — use direct binary downloads/installers |
| localhost DNS | `localhost` doesn't resolve on this machine — always use `127.0.0.1` instead |

---

## Session 5: Login Page Redesign + Marketing Landing Page + Full Brand Rename

### Login Page — Dark Theme Redesign

Redesigned the login/auth pages to a full-screen black theme matching a clean minimal reference design.

**`frontend/src/proprietary/routes/authShared/AuthLayout.tsx`** — Complete rewrite:
- Removed forced Mantine light-mode override
- Full-screen black layout with fixed top nav (← Back to home, Not a member? / Sign Up)
- OnePDF logo rendered above the form for all auth pages
- Logo loaded from `${BASE_PATH}/images/onepdf-login-logo.png`

**`frontend/src/proprietary/routes/authShared/AuthLayout.module.css`** — Complete rewrite:
- Overrides all `--auth-*-light-only` CSS variables to dark values on `.authContainer`
- Black background (`#000000`), white text, translucent input fields
- Fixed top nav with back-link and sign-up button

**`frontend/src/proprietary/routes/authShared/auth.css`** — Updated:
- `.auth-fields` gap increased to 1rem
- Labels: uppercase, 0.6875rem, letter-spaced
- Input border-radius tightened to 0.375rem
- Added Mantine-specific dark overrides for `TextInput` / `PasswordInput`
- `.auth-cta-button` uses `var(--auth-button-bg-light-only)` instead of hardcoded red

**`frontend/src/proprietary/routes/login/LoginHeader.tsx`** — Simplified:
- Removed Wordmark SVG + h1 title (logo moved to AuthLayout)
- Now only renders subtitle `<p>` if provided, otherwise returns null

**`frontend/src/proprietary/routes/login/EmailPasswordForm.tsx`** — Updated:
- `authInputStyles` label updated with uppercase, letter-spacing, 0.6875rem font-size

**`frontend/public/images/onepdf-login-logo.png`** — Added:
- Directory `frontend/public/images/` created
- Logo file placed here (replace with actual OnePDF logo PNG)

---

### Marketing Landing Page

Created a new public-facing marketing landing page at `/` (always shown regardless of auth).

**`frontend/src/proprietary/routes/MarketingLanding.tsx`** — New file:
- Top nav: OnePDF logo + brand name, Features/Tools links, Login + Sign Up buttons
- If logged in: shows "Open App" button instead of Login/Sign Up
- Hero section: large bold heading, subtitle, description, "Upload file" CTA, security note
- Right side: CSS-only PDF document illustration with 5 floating tool icon cards
- Bottom section: "Powerful tools. Easy to use." + 6 tool cards (Edit, Convert, Merge, Split, Compress, Sign)
- All inline SVG icons — no external icon library

**`frontend/src/proprietary/routes/MarketingLanding.module.css`** — New file:
- White/light background, sticky nav with border
- Responsive: stacks to single-column on mobile, tool grid collapses from 3→2→1 columns

---

### Routing Changes

| Route | Before | After |
|---|---|---|
| `/` | Smart router → app if logged in, `/login` redirect if not | Always `MarketingLanding` (no auth check) |
| `/app` | Did not exist | Smart router → app if logged in, `/login` redirect if not |
| Post-login redirect | `/` | `/app` |

**Files modified:**

| File | Change |
|---|---|
| `frontend/src/proprietary/App.tsx` | Added explicit `<Route path="/" element={<MarketingLanding />} />` before `/*` catch-all |
| `frontend/src/proprietary/routes/Landing.tsx` | Final unauthenticated fallback changed from `<MarketingLanding />` to `<Navigate to="/login" />` ; all `navigate("/")` → `navigate("/app")` |
| `frontend/src/proprietary/routes/Login.tsx` | Post-auth redirect changed from `"/"` to `"/app"` |

---

### Full Brand Rename: "My PDF" / "Stirling PDF" → "OnePDF"

Renamed all user-visible brand references across the entire frontend codebase.

**Scope of changes:**
- `frontend/index.html` — `<title>`
- `frontend/public/manifest.json` + `manifest-classic.json` — PWA names
- `frontend/public/locales/en-GB/translation.toml` — all 48+ translation values
- All proprietary routes: `Login`, `Signup`, `InviteAccept`, `ShareLinkPage`, `LoggedInState`, `AuthLayout`, `MarketingLanding`
- All proprietary admin sections: `AdminGeneralSection`, `AdminFeaturesSection`, `AdminAdvancedSection`, `AdminLegalSection`
- Core components: `QuickAccessBar`, `AddFileCard`, `EmptyFilesState`, `ToolPanelModePrompt`, `FullscreenToolSurface`, `HomePage`, `Tooltip`, `ShareManagementModal`, onboarding slides
- Core hooks: `useDocumentMeta`, `useCookieConsent`, `pdfPageHelpers`
- Desktop layer: `DefaultAppBanner`, `DefaultAppSettings`, `ServerSelection`, `authService`, `defaultAppService`
- SaaS layer: `GuestUserBanner`, `FreeTrialSlide`, `TrialStatusBanner`, `Signup`
- Backend static files: `manifest.json`, `site.webmanifest`

**Logo file renamed:** `my-pdf-login-logo.png` → `onepdf-login-logo.png`

**Not changed (intentional):**
- Other locale files (`fr-FR`, `de-DE`, etc.) — per project convention, only `en-GB` is maintained
- Java package names (`stirling.software.*`)
- Internal type names (`StirlingFile`)
- External URLs (`stirlingpdf.com`)
- Technical identifiers (`stirling_sso_*` session storage keys)

---

## Session 6: Auth Page Fixes + Auth Layout Redesign + Dashboard

### Auth Page Navigation Fixes

**Problem 1 — Login button went straight to dashboard:**
`Login.tsx` had a `useEffect` that detected an existing session and immediately called `navigate("/app", { replace: true })`, plus an early return that rendered `<LoggedInState />` instead of the form. Both bypassed the login page for already-authenticated users.

**Fix:** Removed the session-check `useEffect`, removed the `<LoggedInState />` early return, and removed the now-unused `LoggedInState` import from `Login.tsx`.

**Problem 2 — Signup button blinked then went back to landing page:**
`Signup.tsx` had a `useEffect` that detected an existing session and called `navigate("/", { replace: true })`, bouncing the user back to the marketing page.

**Fix:** Removed the session-check `useEffect`, removed unused `useEffect`, `useAuth`, and `LoginHeader` imports from `Signup.tsx`.

**Problem 3 — Landing page nav buttons conditionally routed based on session:**
The "Login" and "Sign up" buttons in `MarketingLanding.tsx` used `navigate(session ? "/app" : "/login")`, so authenticated users were taken to the dashboard instead of the auth pages.

**Fix:** Changed both to always navigate directly — `navigate("/login")` and `navigate("/signup")`.

---

### Auth Layout Redesign (Login & Signup pages)

Redesigned both pages to a two-panel card layout matching a clean mockup.

**`frontend/src/proprietary/routes/authShared/AuthLayout.tsx`** — Complete rewrite:
- Two-panel card: left branding panel (260px) + right form panel (flex: 1)
- Left panel: logo, "OnePDF" brand text, tagline, 3 feature items with inline SVG icons
- Right panel: title + subtitle props, then `{children}`
- Props interface: `{ children, title?, subtitle? }`
- Logo is a clickable button: `navigate("/")`
- Light-only CSS variables override the dark theme defaults

**`frontend/src/proprietary/routes/authShared/AuthLayout.module.css`** — Complete rewrite:
- Page background: `#e8e8e8`; card: `max-width: 700px`, `border-radius: 1.25rem`, subtle shadow
- Left panel: `background: #f5f5f5`, `border-right: 1px solid #e8e8e8`
- Light CSS variables: white inputs, `#0a0a0a` labels/borders/buttons
- Mobile (<640px): card stacks vertically; tagline + feature list hidden

**`frontend/src/proprietary/routes/Login.tsx`** — Updated:
- `<AuthLayout title="Welcome back" subtitle="Log in to your account to continue">`
- Removed `<LoginHeader />` from render
- Added "Don't have an account? Sign up" bottom link

**`frontend/src/proprietary/routes/Signup.tsx`** — Updated:
- `<AuthLayout title="Create your account" subtitle="Start your 7-day free trial. No credit card required.">`
- Removed `<LoginHeader />` from render
- Added "Already have an account? Log in" bottom link

---

### Auth Layout Logo Tweak

Logo size in the left panel increased from `5.5rem` to `8rem` (mobile: `3.5rem` → `5rem`).
"OnePDF" brand text (`<span className={styles.brand}>`) removed from `AuthLayout.tsx` — logo alone represents the brand.

---

### Dashboard — `/app/home`

Created a new post-login dashboard matching a mockup (sidebar + topbar + tools grid + recent files table).

#### New Files

**`frontend/src/proprietary/pages/AppDashboard.tsx`**
- Left sidebar (240px): logo + "OnePDF", nav items (Home, Tools, Recent, Starred, Trash), Settings + Help & Support pinned at bottom
- Top bar (4rem): search input, sun/theme icon button, user avatar (initials) + username + email + chevron — all pulled from `session.user`
- Welcome heading: "Welcome back, [FirstName]!" — first name derived from `username` or `email`
- Quick Tools grid (4 columns, 2 rows): Edit PDF, Convert PDF, Merge PDF, Split PDF, Compress PDF, Delete Pages, Extract Pages, Sign PDF — each click navigates to `/app`
- Recent Files table: reads `fileStorage.getAllStirlingFileStubs()` from IndexedDB, sorted by `lastModified` desc, top 5; shows name / size / modified date / star + dots action buttons; empty state shown when no files
- Auth guard: redirects to `/login` if no session

**`frontend/src/proprietary/pages/AppDashboard.module.css`**
- Full-height flex layout; sidebar with hover/active nav pill states
- Tool cards: bordered, hover shadow; table: bordered wrapper, row hover
- Responsive: tool grid collapses to 2-col at 1100px; sidebar hidden on mobile

#### Routing Changes

| File | Change |
|---|---|
| `frontend/src/proprietary/App.tsx` | Added `<Route path="/app/home" element={<AppDashboard />} />` before `/*` catch-all |
| `frontend/src/proprietary/routes/Login.tsx` | On sign-in success: `navigate("/app/home", { replace: true })` instead of relying on Landing auto-redirect |

#### Flow After This Session

| Action | Result |
|---|---|
| Click "Login" on landing page | `/login` form (always, regardless of session) |
| Click "Sign up" on landing page | `/signup` form (always, regardless of session) |
| Successful login | → `/app/home` (dashboard) |
| Click tool card on dashboard | → `/app` (PDF workspace) |
| Direct `/app` URL | PDF workspace via Landing → `<HomePage />` (unchanged) |

---

## Session 7: Brand Rename to "My PDF" + Edit PDF Page Redesign + Infinite Loop Fix

### Brand Rename: "OnePDF" → "My PDF"

All user-visible brand references updated from "OnePDF" to "My PDF" across the frontend codebase. Internal type names and Java package names unchanged.

---

### Edit PDF Page — Standalone Three-Panel Layout

Created a new full-page editor route at `/app/edit-pdf` matching a mockup design, replacing the existing tool-panel flow for the Edit PDF action.

**`frontend/src/proprietary/pages/EditPdfPage.tsx`** — New file:
- Top navbar: back button → `/app/home`, "My PDF" logo + brand, "Tools > Edit PDF" breadcrumb, undo/redo buttons (disabled), cloud save status indicator, download button wired to `viewData.onGeneratePdf()`, "Apply & Save" button wired to `viewData.onSaveToWorkbench()`, user initials avatar
- Secondary toolbar: 5 category tabs (Edit | Annotate | Page | Protect | Convert) with active underline; Edit shows 13 tool icon buttons (Select, Text, Image, Link, Rectangle, Rounded, Circle, Line, Arrow, Check, Cross, Star, More); other tabs show "coming soon"
- Left panel (180px): page thumbnail list from `viewData.pagePreviews`, A4 aspect ratio (`0.707`), amber dirty dot for edited pages, `+ Add page` disabled
- Center panel: `<Workbench />` renders `PdfTextEditorView` when workbench is `"custom:pdfTextEditor"`
- Right panel (260px): `<ToolRenderer selectedToolKey="pdfTextEditor" />` mounts `PdfTextEditor` → renders `PdfTextEditorSidebar`
- Auth guard: redirects to `/login` if unauthenticated
- Mount effect: `selectTool("pdfTextEditor")` → triggers `PdfTextEditor`'s auto-navigate to workbench; cleanup deselects tool

**`frontend/src/proprietary/pages/EditPdfPage.module.css`** — New file:
- `.page`: `height: 100%; display: flex; flex-direction: column; overflow: hidden`
- `.topnav`: `height: 3.25rem; border-bottom: 1px solid #e8e8e8`
- `.toolbar`: `height: 2.75rem; background: #fafafa`; `.toolbarCatActive`: `border-bottom: 2px solid #0a0a0a`
- `.panels`: `flex: 1; display: flex; flex-direction: row; overflow: hidden; min-height: 0`
- `.pagesPanel`: `width: 180px; border-right: 1px solid #e8e8e8; background: #fafafa`
- `.canvas`: `flex: 1; min-width: 0`
- `.propertiesPanel`: `width: 260px; border-left: 1px solid #e8e8e8`
- Page thumbnails: `aspect-ratio: 0.707`; active state: `border: 1.5px solid #0a0a0a`
- `.shareBtn` (Apply & Save): `background: #0a0a0a; color: #fff; border-radius: 0.5rem`

**`frontend/src/proprietary/App.tsx`** — Modified:
- Added `import EditPdfPage from "@app/pages/EditPdfPage"`
- Added `<Route path="/app/edit-pdf" element={<EditPdfPage />} />` before the `/*` catch-all

**`frontend/src/proprietary/pages/AppDashboard.tsx`** — Modified:
- Added `path` property to each `QUICK_TOOLS` entry; "Edit PDF" gets `path: "/app/edit-pdf"`, all others keep `path: "/app"`
- Tool card `onClick` now uses `navigate(path)` per-tool instead of always `navigate("/app")`

---

### Edit PDF Infinite Loop Fix

**Error:** "Maximum update depth exceeded" — React hit its 50-render nested update limit immediately on mounting `/app/edit-pdf`.

**Root cause chain:**
1. `EditPdfPage` rendered `<ToolRenderer onComplete={() => {}} onError={() => {}} />`
2. Inline arrow functions → **new references on every render** of `EditPdfPage`
3. Inside `PdfTextEditor`, `handleDownloadJson`, `handleGeneratePdf`, and `handleSaveToWorkbench` are `useCallback`s with `onComplete` / `onError` in their deps → **new callbacks** on every parent render
4. `viewData` is a `useMemo` whose deps include those callbacks → **new `viewData` object** every render
5. The sync effect `useEffect(() => { setCustomWorkbenchViewData(id, viewData) }, [viewData])` fires on every `viewData` change → updates `customViewData` in context
6. Context update causes `EditPdfPage` to re-render → new inline functions → **loop**

**Fixes (both in `EditPdfPage.tsx`):**

| Fix | Detail |
|---|---|
| Stable callback constants | Defined `NOOP_COMPLETE = (_files: File[]) => {}` and `NOOP_ERROR = (_msg: string) => {}` at **module level** (outside component); passed as `onComplete={NOOP_COMPLETE}` / `onError={NOOP_ERROR}` to `ToolRenderer` |
| Page-preview effect guard | Added `previewRequestedForCountRef = useRef(0)`; page preview effect returns early if `previewRequestedForCountRef.current === pageCount`, preventing re-requesting previews on every `viewData` update (which fires as each preview is generated) |

---

### Session 7 — Test Checklist

- [ ] Visiting `/app/edit-pdf` no longer shows "Maximum update depth exceeded"
- [ ] Clicking "Edit PDF" on the dashboard navigates to `/app/edit-pdf`
- [ ] All other dashboard tool cards still navigate to `/app`
- [ ] Three-panel layout renders: pages sidebar | canvas | properties panel
- [ ] Top navbar shows "My PDF" brand, breadcrumb "Tools > Edit PDF", user initials
- [ ] Edit category toolbar shows all 13 tool icon buttons
- [ ] Annotate / Page / Protect / Convert categories show "coming soon" message
- [ ] Back button returns to `/app/home`
- [ ] Uploading a PDF shows page thumbnails in the left panel
- [ ] Apply & Save button is disabled until a document with changes is loaded
- [ ] Download button is disabled until a document is loaded

---

## Session 8: Full UI Replacement — Stirling PDF → My PDF Design

Completed a comprehensive pass replacing every remaining Stirling PDF UI element with the custom My PDF design language.

### Shared Tool Components (affects all 40+ tools)

**`frontend/src/core/components/tools/shared/OperationButton.tsx`** — Modified:
- Primary action button replaced from Mantine blue → OnePDF dark pill
- When `variant="filled"` and `color="blue"` (default), injects CSS variables: `--button-bg: var(--nav-btn-active-bg)`, `--button-hover`, `--button-color: var(--nav-btn-active-color)`, `borderRadius: 0.5rem`
- Non-default colors/variants are untouched — no regression for callers passing explicit colors

**`frontend/src/core/components/tools/shared/ToolWorkflowTitle.tsx`** — Modified:
- Description background changed from `var(--color-gray-200)` → `var(--bg-muted)` with `border: 1px solid var(--border-default)`
- Text color changed to `var(--text-secondary)` for better contrast hierarchy
- Border-radius set to `0.5rem` to match OnePDF card style

**`frontend/src/core/components/tools/shared/ToolStep.tsx`** — Modified:
- Step divider changed from hardcoded `#E2E8F0` → `var(--border-default)` (supports both light and dark mode)

**`frontend/src/core/components/tools/shared/NavigationControls.tsx`** — Complete rewrite:
- Removed Mantine `ActionIcon` + MUI icon dependencies entirely
- Custom prev/next buttons using CSS variables: `var(--bg-surface)`, `var(--border-default)`, `var(--text-primary)`
- Uses `‹` / `›` text chevrons for zero-dependency implementation

### Workspace Switcher

**`frontend/src/core/components/shared/TopControls.tsx`** — Modified:
- Removed `color="blue"` from `SegmentedControl`
- Active indicator now uses `background: var(--nav-btn-active-bg)` — matches sidebar nav pills in both light/dark mode

### Viewer Sidebar CSS

**`frontend/src/core/components/viewer/SidebarBase.css`** — Modified:
- Header icon color: `var(--mantine-color-blue-6)` → `var(--text-secondary)`

**`frontend/src/core/components/viewer/LayerSidebar.css`** — Modified:
- Dirty badge color: `var(--mantine-color-orange-5)` → `var(--color-yellow-500)` (theme-owned token)

**`frontend/src/core/components/viewer/AttachmentSidebar.css`** — Modified:
- Download icon hover color: `var(--mantine-color-blue-6)` → `var(--text-primary)`

**`frontend/src/core/components/tools/toolPicker/ToolPicker.css`** — Modified:
- Scrollbar thumb colors: `var(--mantine-color-gray-4/5)` → `var(--color-gray-300/400)` (theme-owned tokens)

### Brand Text — All Remaining "Stirling" References Replaced

Replaced every user-visible "Stirling" string with "My PDF" across the entire frontend.

**Translation file:** `frontend/public/locales/en-GB/translation.toml`
| Key | Old | New |
|---|---|---|
| `config.apiKeys.description` | "Stirling's suite of PDF tools" | "My PDF's suite of PDF tools" |
| `connectionMode.status.saas` | "Connected to Stirling Cloud" | "Connected to My PDF Cloud" |
| `localMode.toolUnavailable` | "Sign in to Stirling Cloud" | "Sign in to My PDF Cloud" |
| `onboarding.desktopInstall.body` | "Stirling works best as a desktop app" | "My PDF works best as a desktop app" |
| `onboarding.planOverview.adminBody*` | "use Stirling free of charge" | "use My PDF free of charge" |
| `onboarding.serverLicense.freeBody` | "Stirling Server plan" | "My PDF Server plan" |
| `onboarding.serverLicense.overLimitBody` | "Stirling users" / "Stirling Server plan" | "My PDF users" / "My PDF Server plan" |
| `onboarding.welcomeSlide.title` | "Welcome to Stirling" | "Welcome to My PDF" |
| `settings.connection.mode.saas` | "Stirling Cloud" | "My PDF Cloud" |
| `settings.planBilling.notAvailable` | "Stirling Cloud (SaaS mode)" | "My PDF Cloud (SaaS mode)" |
| `setup.mode.saas.description/title` | "Stirling account" / "Stirling Cloud" | "My PDF account" / "My PDF Cloud" |
| `setup.saas.subtitle/title` | "Stirling account" / "Sign in to Stirling" | "My PDF account" / "Sign in to My PDF" |

**Onboarding slides:**
- `ServerLicenseSlide.tsx` — `defaults` fallback strings updated
- `PlanOverviewSlide.tsx` — `defaults` fallback strings updated
- `DesktopInstallSlide.tsx` — `defaults` fallback string updated
- `WelcomeSlide.tsx` — `defaults` fallback string updated

**Desktop components:**
- `ConnectionSettings.tsx` — saas mode label fallback
- `RightRailFooterExtensions.tsx` — connection status label fallback
- `SaasPlanSection.tsx` — plan/billing unavailable message fallback
- `SaaSLoginScreen.tsx` — login screen title fallback
- `operationRouter.ts` — two error message fallbacks
- `desktopNotificationService.ts` — `APP_TITLE` constant
- `useGroupEnabled.ts` — offline reason fallback constant

**Core/SaaS components:**
- `fullscreen/shared.ts` — offline server error message fallback
- `useCertSignTooltips.ts` — cert sign tooltip text
- `saas/ApiKeys.tsx` — API key description fallback

**Not changed (intentional):**
- GitHub URLs (`github.com/Stirling-Tools/...`) — functional links to upstream releases
- Java package names (`stirling.software.*`)
- Internal identifiers (`StirlingFile`, `StirlingPDF_Automations`, `stirling_sso_*`)
- Logo SVG filenames (`StirlingPDFLogo*.svg`) — physical asset files not renamed
- Test files and code comments

---

### Session 8 — Test Checklist

- [ ] Primary action button in all tools is dark/near-black pill (not Mantine blue)
- [ ] Button switches to near-white pill in dark mode
- [ ] Tool description boxes show `var(--bg-muted)` background with border
- [ ] Dividers inside tool steps respect dark mode (no hardcoded light gray)
- [ ] Prev/Next file navigation buttons in ReviewToolStep show OnePDF styled buttons
- [ ] View switcher active indicator (Viewer / Page Editor / File Manager) is dark, not blue
- [ ] Layer sidebar icon is gray, not blue
- [ ] Attachment download icon hover is gray, not blue
- [ ] No "Stirling" text visible anywhere in the UI (tools, onboarding, settings, desktop app)
- [ ] "Welcome to My PDF" shows in onboarding welcome slide
- [ ] "My PDF Cloud" shows in connection settings / SaaS mode labels
- [ ] Desktop app notifications use "My PDF" as the app title

---

## Session 9: Bug Fixes — sockjs-client Crash + Edit PDF Blank Canvas

### Bug 1: `global is not defined` (sockjs-client)

**Symptom:** Any page that triggered loading of the collab feature threw `ReferenceError: global is not defined`, crashing the page. First noticed when uploading a PDF to convert to xlsx.

**Root cause:** `sockjs-client` uses the Node.js global `global` at module load time (in `browser-crypto.js`). Vite does not polyfill `global` for the browser by default.

**Fix:** Added `define: { global: "globalThis" }` to `frontend/vite.config.ts`.

```typescript
// inside the returned config object:
define: {
  global: "globalThis",
},
```

This tells Vite to replace all references to `global` with `globalThis` at build/dev time — the standard fix for this library in browser environments.

---

### Bug 2: Edit PDF page shows blank canvas after uploading a document

**Symptom:** On `/app/edit-pdf`, uploading a PDF showed nothing — the canvas area remained blank after the file was selected.

**Root cause:** The center canvas panel was rendering `<Workbench />`. The `Workbench` component is designed to be the full app main content area — it includes `TopControls` (a viewer/fileEditor tabs switcher), `DismissAllErrorsButton`, a scrollable content box, and a `Footer`. When embedded inside the 3-panel `EditPdfPage` layout these elements stole height, broke the flex layout, and introduced workbench-ID / context-guard race conditions that prevented `PdfTextEditorView` from rendering correctly.

**Fix:** Replaced `<Workbench />` with a direct render of `<PdfTextEditorView data={viewData} />` in `EditPdfPage.tsx`. `EditPdfPage` already reads `viewData` from context, so this is straightforward.

**Files changed:**

| File | Change |
|---|---|
| `frontend/src/proprietary/pages/EditPdfPage.tsx` | Replaced `Workbench` import with `PdfTextEditorView`; replaced `<Workbench />` with `{viewData && <PdfTextEditorView data={viewData} />}` in the canvas panel |

**Why the null-guard:** `PdfTextEditor` (mounted in the right panel via `ToolRenderer`) registers and sets `viewData` asynchronously on mount. Until it does, `viewData` is `undefined` and the canvas is empty — this is correct and imperceptible since both panels mount concurrently.

---

### Session 9 — Test Checklist

- [ ] PDF-to-xlsx conversion works without `global is not defined` error
- [ ] All other tool conversions work without errors
- [ ] `/app/edit-pdf` — uploading a PDF shows the conversion progress bar
- [ ] After conversion, the document canvas renders the PDF pages
- [ ] Page thumbnails appear in the left panel after upload
- [ ] Drop zone shows before any file is uploaded
- [ ] Error message appears (red alert) if conversion fails
