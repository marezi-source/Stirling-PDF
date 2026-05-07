# My PDF — Project Checkpoint

**Last updated:** 2026-05-07  
**Branch:** main  
**Base:** Stirling-PDF (open-source fork)  
**Status: RUNNING** — backend on port 8080, frontend on port 5173

---

## Goal

Build "My PDF" — an editor-first, web-based collaborative PDF editor forked from Stirling-PDF. Three phases:

1. **Phase 1** — Rename/brand + curate tools (remove low-value tools)
2. **Phase 2** — Add a real-time collaboration layer (WebSocket, comments, review)
3. **Phase 3** — Reorder tool categories to lead with editing workflows

All three phases are complete. The app is running.

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
task frontend:dev
```

Open **http://localhost:5173** in the browser.

Default login: **admin / stirling** (created on first boot by `InitialSecuritySetup`).

---

## Phase 1: Branding & Feature Curation

### Branding

| File | Change |
|---|---|
| `frontend/index.html` | `<title>` → "My PDF", meta description updated |
| `frontend/public/manifest.json` | `short_name` + `name` → "My PDF" |

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

## Bugs Fixed During Startup

| Error | Root Cause | Fix |
|---|---|---|
| `processResources` failed — could not set file mode 644 | pdfjs-legacy locale files had wrong permissions | `find ... -exec chmod 644/755 {}` + `./gradlew clean` |
| `CollabSessionRepository` bean not found | `@EnableJpaRepositories` in `DatabaseConfig` had explicit package list missing collab | Added `stirling.software.proprietary.collab.repository` and `collab.model` to both annotations |
| Bad HQL grammar in `findByParticipantUsername` | `MEMBER OF (SELECT ...)` subquery is invalid HQL | Rewrote as `LEFT JOIN s.participants p WHERE p.username = :username` |

---

## Manual Test Checklist

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
