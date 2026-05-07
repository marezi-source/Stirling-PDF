import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToolWorkflow } from "@app/contexts/ToolWorkflowContext";
import { useAuth } from "@app/auth/UseSession";
import PdfTextEditorView from "@app/components/tools/pdfTextEditor/PdfTextEditorView";
import ToolRenderer from "@app/components/tools/ToolRenderer";
import type { PdfTextEditorViewData } from "@app/tools/pdfTextEditor/pdfTextEditorTypes";
import styles from "./EditPdfPage.module.css";

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(raw: string): string {
  const clean = raw.split("@")[0];
  const parts = clean.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

// ── Icons ──────────────────────────────────────────────────────────────────

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.04" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-.49-3.04" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CloudIcon({ saved }: { saved: boolean }) {
  return saved ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.59 4.38 2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      <polyline points="16 8 20 12 16 16" />
      <line x1="8" y1="12" x2="20" y2="12" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ── Tool icons ─────────────────────────────────────────────────────────────

function SelectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3l14 9-7 1-4 7z" />
    </svg>
  );
}

function TypeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function RectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="0" />
    </svg>
  );
}

function RoundedRectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  );
}

function ArrowToolIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="12 5 19 5 19 12" />
    </svg>
  );
}

function CheckMarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function StarToolIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────

const TOOLBAR_CATEGORIES = ["Edit", "Annotate", "Page", "Protect", "Convert"];

const EDIT_TOOLS = [
  { id: "select", label: "Select", icon: <SelectIcon /> },
  { id: "text", label: "Text", icon: <TypeIcon /> },
  { id: "image", label: "Image", icon: <ImageIcon /> },
  { id: "link", label: "Link", icon: <LinkIcon /> },
  { id: "rectangle", label: "Rectangle", icon: <RectIcon /> },
  { id: "rounded", label: "Rounded", icon: <RoundedRectIcon /> },
  { id: "circle", label: "Circle", icon: <CircleIcon /> },
  { id: "line", label: "Line", icon: <LineIcon /> },
  { id: "arrow", label: "Arrow", icon: <ArrowToolIcon /> },
  { id: "check", label: "Check", icon: <CheckMarkIcon /> },
  { id: "cross", label: "Cross", icon: <CrossIcon /> },
  { id: "star", label: "Star", icon: <StarToolIcon /> },
  { id: "more", label: "More", icon: <MoreIcon /> },
];

const PDF_EDITOR_WORKBENCH_ID = "custom:pdfTextEditor";

// Stable no-op callbacks — must be outside the component so their references
// never change between renders. Inline `() => {}` would create a new function
// reference on every render, causing PdfTextEditor's viewData useMemo to
// recompute on every render, which triggers setCustomWorkbenchViewData, which
// causes a context update, which re-renders EditPdfPage — infinite loop.
const NOOP_COMPLETE = (_files: File[]) => {};
const NOOP_ERROR = (_msg: string) => {};

// ── Component ──────────────────────────────────────────────────────────────

export default function EditPdfPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { customWorkbenchViews, selectTool } = useToolWorkflow();
  const [activeCategory, setActiveCategory] = useState("Edit");
  const [activeTool, setActiveTool] = useState("text");

  const pdfView = customWorkbenchViews.find(v => v.workbenchId === PDF_EDITOR_WORKBENCH_ID);
  const viewData = pdfView?.data as PdfTextEditorViewData | undefined;

  const username = session?.user?.username || session?.user?.email || "User";
  const initials = getInitials(username);
  const pageCount = viewData?.document?.pages?.length ?? 0;

  // Auth guard
  useEffect(() => {
    if (!loading && !session) navigate("/login", { replace: true });
  }, [session, loading, navigate]);

  // Auto-select pdfTextEditor tool and deselect on unmount
  useEffect(() => {
    selectTool("pdfTextEditor");
    return () => {
      selectTool(null);
    };
  }, [selectTool]);

  // Track which page counts we've already requested previews for, so we don't
  // re-request on every viewData update (viewData changes when previews arrive).
  const previewRequestedForCountRef = useRef(0);

  useEffect(() => {
    if (!viewData || pageCount === 0) return;
    if (previewRequestedForCountRef.current === pageCount) return;
    previewRequestedForCountRef.current = pageCount;
    for (let i = 0; i < pageCount; i++) {
      viewData.requestPagePreview(i, 0.2);
    }
  }, [viewData, pageCount]);

  const savedLabel = viewData
    ? viewData.isSavingToWorkbench
      ? "Saving…"
      : viewData.hasChanges
        ? "Unsaved changes"
        : "Saved"
    : null;

  const isSaved = !viewData?.hasChanges && !viewData?.isSavingToWorkbench;

  return (
    <div className={styles.page}>
      {/* ── Top Nav ── */}
      <header className={styles.topnav}>
        <div className={styles.topnavLeft}>
          <button className={styles.backBtn} onClick={() => navigate("/app/home")} title="Back to Home">
            <ArrowLeftIcon />
          </button>
          <div className={styles.logoArea}>
            <img src="/logo.png" alt="My PDF" className={styles.logoImg} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span className={styles.brand}>My PDF</span>
          </div>
          <div className={styles.breadcrumb}>
            <button className={styles.breadcrumbLink} onClick={() => navigate("/app")}>
              Tools
            </button>
            <span className={styles.breadcrumbSep}><ChevronRightIcon /></span>
            <span className={styles.breadcrumbCurrent}>Edit PDF</span>
          </div>
        </div>

        <div className={styles.topnavRight}>
          <button className={styles.iconBtn} title="Undo" disabled>
            <UndoIcon />
          </button>
          <button className={styles.iconBtn} title="Redo" disabled>
            <RedoIcon />
          </button>

          {savedLabel && (
            <div className={`${styles.savedStatus} ${isSaved ? styles.savedStatusSaved : styles.savedStatusUnsaved}`}>
              <CloudIcon saved={isSaved} />
              <span>{savedLabel}</span>
            </div>
          )}

          <button
            className={styles.iconBtn}
            onClick={() => viewData?.onGeneratePdf()}
            title="Download PDF"
            disabled={!viewData?.hasDocument}
          >
            <DownloadIcon />
          </button>

          <button
            className={styles.shareBtn}
            onClick={() => viewData?.onSaveToWorkbench()}
            disabled={!viewData?.hasDocument || !viewData?.hasChanges}
          >
            Apply & Save
          </button>

          <div className={styles.avatar}>{initials}</div>
        </div>
      </header>

      {/* ── Secondary Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarCategories}>
          {TOOLBAR_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.toolbarCat} ${cat === activeCategory ? styles.toolbarCatActive : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.toolbarDivider} />

        {activeCategory === "Edit" && (
          <div className={styles.toolbarTools}>
            {EDIT_TOOLS.map(tool => (
              <button
                key={tool.id}
                className={`${styles.toolBtn} ${tool.id === activeTool ? styles.toolBtnActive : ""}`}
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
              >
                {tool.icon}
                <span className={styles.toolBtnLabel}>{tool.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeCategory !== "Edit" && (
          <div className={styles.toolbarTools}>
            <span className={styles.toolbarComingSoon}>{activeCategory} tools coming soon</span>
          </div>
        )}
      </div>

      {/* ── Main panels ── */}
      <div className={styles.panels}>
        {/* Pages panel */}
        <aside className={styles.pagesPanel}>
          <div className={styles.pagesPanelHeader}>
            <span>Pages</span>
            {pageCount > 0 && <span className={styles.pageCount}>{pageCount}</span>}
          </div>

          <div className={styles.pagesList}>
            {pageCount === 0 ? (
              <div className={styles.pagesEmpty}>
                <p>No document</p>
                <p>Upload a PDF to see pages</p>
              </div>
            ) : (
              Array.from({ length: pageCount }).map((_, i) => {
                const preview = viewData?.pagePreviews.get(i);
                const isDirty = viewData?.dirtyPages[i] ?? false;
                const isActive = i === (viewData?.selectedPage ?? 0);
                return (
                  <button
                    key={i}
                    className={`${styles.pageThumbnail} ${isActive ? styles.pageThumbnailActive : ""}`}
                    onClick={() => viewData?.onSelectPage(i)}
                  >
                    <div className={styles.pageThumbWrapper}>
                      {preview ? (
                        <img src={preview} className={styles.pageThumbImg} alt={`Page ${i + 1}`} />
                      ) : (
                        <div className={styles.pageThumbPlaceholder} />
                      )}
                      {isDirty && <span className={styles.dirtyDot} title="Edited" />}
                    </div>
                    <span className={styles.pageNum}>{i + 1}</span>
                  </button>
                );
              })
            )}
          </div>

          <button className={styles.addPageBtn} disabled>
            + Add page
          </button>
        </aside>

        {/* Canvas — render PdfTextEditorView directly to avoid Workbench layout overhead */}
        <div className={styles.canvas}>
          {viewData && <PdfTextEditorView data={viewData} />}
        </div>

        {/* Properties — ToolRenderer mounts PdfTextEditor + renders its sidebar */}
        <aside className={styles.propertiesPanel}>
          <ToolRenderer
            selectedToolKey="pdfTextEditor"
            onComplete={NOOP_COMPLETE}
            onError={NOOP_ERROR}
          />
        </aside>
      </div>
    </div>
  );
}
