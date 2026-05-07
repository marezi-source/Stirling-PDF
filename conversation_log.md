# OnePDF — Project Checkpoint

**Last updated:** 2026-05-07 (Session 5)
**Branch:** main  
**Base:** Stirling-PDF (open-source fork)  
**Status: RUNNING** — backend on port 8080, frontend on port 5173

---

## Goal

Build "OnePDF" — an editor-first, web-based collaborative PDF editor forked from Stirling-PDF. Four phases:

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
