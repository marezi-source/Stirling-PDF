# My PDF — Project Checkpoint

**Date:** 2026-05-06  
**Branch:** main  
**Base:** Stirling-PDF (open-source fork)

---

## Goal

Build "My PDF" — an editor-first, web-based collaborative PDF editor forked from Stirling-PDF. Three phases:

1. **Phase 1** — Rename/brand + curate tools (remove low-value tools)
2. **Phase 2** — Add a real-time collaboration layer (WebSocket, comments, review)
3. **Phase 3** — Reorder tool categories to lead with editing workflows

---

## Phase 1: Branding & Feature Curation

### Branding

| File | Change |
|---|---|
| `frontend/index.html` | `<title>` → "My PDF", meta description updated |
| `frontend/public/manifest.json` | `short_name` + `name` → "My PDF" |

### Tools Removed (Frontend)

Removed from `CORE_REGULAR_TOOL_IDS` in `frontend/src/core/types/toolId.ts`:

- `scannerImageSplit`
- `scannerEffect`
- `autoRename`
- `pageLayout`
- `adjustContrast`
- `pdfToSinglePage`
- `replaceColor`
- `showJS`
- `bookletImposition`

Removed from `CORE_LINK_TOOL_IDS` (kept only `devApi`):

- `devFolderScanning`
- `devSsoGuide`
- `devAirgapped`

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
- Extends `JpaRepository<CollabSession, String>`
- Custom query: `findByParticipantUsername(String username)`

**`collab/repository/CollabAnnotationRepository.java`**
- `findBySessionIdOrderByCreatedAtAsc(String sessionId)`

**`collab/dto/` — Java Records**
- `AnnotationPayload` — all annotation fields
- `WsMessage<T>` — `type` + `payload`, static `of()` factory
- `PresencePayload` — `username` + `action`, static `join()` / `leave()` factories
- `SessionDto` — session summary, static `from(CollabSession)` factory

**`collab/service/CollabSessionService.java`**
- `createSession`, `getSession`, `inviteUser`, `getAnnotations`
- `addAnnotation`, `updateAnnotation`, `deleteAnnotation`, `changeStatus`
- Auth helpers: `requireUser()`, `requireOwnerOrParticipant()`

**`collab/controller/CollabSessionWsController.java`** (STOMP)
- `@MessageMapping("/session/{id}/annotation/add")` → persist + broadcast `ANNOTATION_ADD`
- `@MessageMapping("/session/{id}/annotation/update")` → update + broadcast `ANNOTATION_UPDATE`
- `@MessageMapping("/session/{id}/annotation/delete")` → delete + broadcast `ANNOTATION_DELETE`
- `@MessageMapping("/session/{id}/presence")` → broadcast `PRESENCE`
- Sends to `/topic/session/{id}` via `SimpMessagingTemplate`

**`collab/controller/CollabSessionRestController.java`**
- `POST /api/v1/collab/sessions` — create session
- `GET /api/v1/collab/sessions/{id}` — get session info
- `POST /api/v1/collab/sessions/{id}/invite` — invite user by username
- `GET /api/v1/collab/sessions/{id}/annotations` — fetch all annotations
- `POST /api/v1/collab/sessions/{id}/review/submit|approve|request-changes`
- Broadcasts WebSocket events on invite and review status changes

---

### Frontend — New Files

**`frontend/package.json`** — Added:
```json
"@stomp/stompjs": "^7.0.0",
"sockjs-client": "^1.6.1",
"@types/sockjs-client": "^1.5.4"
```
> Added directly to `package.json` (npm not available in build environment; `task frontend:install` will install them).

**`frontend/src/core/hooks/collab/collabTypes.ts`**
- TypeScript interfaces: `AnnotationType`, `AnnotationPayload`, `PresencePayload`, `SessionDto`, `WsMessageType`, `WsMessage<T>`

**`frontend/src/core/hooks/collab/useCollabSession.ts`**
- Fetches initial session + annotations from REST API
- Creates STOMP `Client` with SockJS transport, connects with JWT `Authorization` header
- Subscribes to `/topic/session/{sessionId}`, dispatches all `WsMessage` types
- Returns: `{ session, annotations, participants, connected, addAnnotation, updateAnnotation, deleteAnnotation, sendPresence }`

**`frontend/src/core/components/collab/CollabPresence.tsx`**
- Avatar row with initials, deterministic color from username hash
- Green dot = connected, overflow count badge
- `Tooltip` with username on hover

**`frontend/src/core/components/collab/CollabCommentThread.tsx`**
- `ScrollArea` list of `NOTE`/`COMMENT` annotations
- Filter prop: `"all" | "unresolved" | "mine"`
- Inline edit, resolve toggle, delete (author/owner only)

**`frontend/src/core/components/collab/CollabReviewPanel.tsx`**
- Status badge with color mapping
- `Timeline` component: Draft → In Review → Approved
- Action buttons: Submit for Review, Approve, Request Changes (role-gated)
- Calls REST API directly, fires `onStatusChange` callback on success

**`frontend/src/core/components/collab/CollabBar.tsx`**
- Reads JWT from `localStorage.getItem("stirling_jwt")`
- Decodes username: `JSON.parse(atob(token.split(".")[1])).sub`
- "Collaborate" button → `POST /api/v1/collab/sessions` → shows share modal
- Active state shows: `CollabPresence` + icon buttons (Comments, Review, Invite)
- `Drawer` (right, sm): switches between `CollabCommentThread` and `CollabReviewPanel`
- `Modal`: displays session ID (click-to-copy) + invite by username form

**Modified: `frontend/src/core/components/viewer/PdfViewerToolbar.tsx`**
- Added optional props: `documentId?: string`, `documentName?: string`
- Renders `<CollabBar>` at the trailing end of toolbar when `documentId` is provided

**Modified: `frontend/src/core/components/viewer/EmbedPdfViewer.tsx`**
- Passes `documentId={activeFiles[activeFileIndex]?.fileId}` and `documentName={...}` to `<PdfViewerToolbar>`

---

## Phase 3: Tool Category Reorder

**`frontend/src/core/data/toolsTaxonomy.ts`** — `SUBCATEGORY_ORDER` updated to:

```typescript
[
  SubcategoryId.GENERAL,
  SubcategoryId.DOCUMENT_REVIEW,
  SubcategoryId.PAGE_FORMATTING,
  SubcategoryId.EXTRACTION,
  SubcategoryId.REMOVAL,
  SubcategoryId.SIGNING,
  SubcategoryId.DOCUMENT_SECURITY,
  SubcategoryId.VERIFICATION,
  SubcategoryId.AUTOMATION,
  SubcategoryId.ADVANCED_FORMATTING,
  SubcategoryId.DEVELOPER_TOOLS,
]
```

---

## Remaining Validation Steps

```bash
# Validate Java compilation (collab package + modified ConvertImgPDFController)
task backend:check

# Validate TypeScript types + lint (collab hooks, components, toolbar wiring)
task frontend:check

# Install newly added npm packages
task frontend:install

# End-to-end test
task dev
```

### Manual Test Checklist

- [ ] Removed tools no longer appear in tool picker
- [ ] Kept tools still work (merge, split, compress, annotate, sign, etc.)
- [ ] "Collaborate" button appears in PDF viewer toolbar
- [ ] Create session → session ID shown in modal
- [ ] Invite user → second browser tab joins session
- [ ] Add annotation in Tab 1 → appears in Tab 2 in real time
- [ ] Comment thread filters (All / Open / Mine) work
- [ ] Submit for review in Tab 1 → status updates in Tab 2
- [ ] Approve / Request Changes flow works (owner only)
- [ ] Unauthenticated WebSocket connection is rejected (401)
- [ ] Tool category order: General → Review → Page Formatting → ... → Automation

---

## Key Architecture Notes

| Concern | Decision |
|---|---|
| WebSocket server | `spring-websocket` + `spring-messaging` (no starter — avoids Tomcat conflict with Jetty) |
| DB schema | Hibernate `ddl-auto=update` auto-creates `collab_sessions` / `collab_annotations` |
| Auth on WS | `ChannelInterceptor` validates JWT on `CONNECT` frame |
| Collab package location | `app/proprietary` (depends on `User`, `UserService`, `JwtService`) |
| Frontend WS client | `@stomp/stompjs` + `sockjs-client` |
| JWT decode (frontend) | Inline `atob(token.split(".")[1])` — no extra library |
| Import paths | All new frontend files use `@app/*` as required by CLAUDE.md |
