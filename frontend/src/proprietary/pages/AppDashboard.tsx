import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@app/auth/UseSession";
import { fileStorage } from "@app/services/fileStorage";
import type { StirlingFileStub } from "@app/types/fileContext";
import { BASE_PATH } from "@app/constants/app";
import styles from "./AppDashboard.module.css";

// ── Icons ──────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function RecentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function FileDocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function StarSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

// Tool icons
function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ConvertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function MergeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="8" height="10" rx="1" />
      <rect x="14" y="3" width="8" height="10" rx="1" />
      <path d="M6 13v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-3" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="9" />
      <path d="M12 9l-4 5H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4l4-5 4 5h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4l-4-5z" />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function DeletePagesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function ExtractPagesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="9 15 12 18 15 15" />
      <line x1="12" y1="12" x2="12" y2="18" />
    </svg>
  );
}

function SignIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────

const QUICK_TOOLS = [
  { key: "edit", name: "Edit PDF", desc: "Edit text, pages and more", Icon: EditIcon, path: "/app/edit-pdf" },
  { key: "convert", name: "Convert PDF", desc: "Convert to and from PDF", Icon: ConvertIcon, path: "/app" },
  { key: "merge", name: "Merge PDF", desc: "Combine multiple PDF files", Icon: MergeIcon, path: "/app" },
  { key: "split", name: "Split PDF", desc: "Split PDF into multiple files", Icon: SplitIcon, path: "/app" },
  { key: "compress", name: "Compress PDF", desc: "Reduce PDF file size", Icon: CompressIcon, path: "/app" },
  { key: "delete-pages", name: "Delete Pages", desc: "Remove pages from PDF", Icon: DeletePagesIcon, path: "/app" },
  { key: "extract-pages", name: "Extract Pages", desc: "Extract pages from PDF", Icon: ExtractPagesIcon, path: "/app" },
  { key: "sign", name: "Sign PDF", desc: "Create and add signatures", Icon: SignIcon, path: "/app" },
];

const NAV_ITEMS = [
  { key: "home", label: "Home", Icon: HomeIcon, path: "/app/home" },
  { key: "tools", label: "Tools", Icon: ToolsIcon, path: "/app" },
  { key: "recent", label: "Recent", Icon: RecentIcon, path: "/app" },
  { key: "starred", label: "Starred", Icon: StarIcon, path: "/app" },
  { key: "trash", label: "Trash", Icon: TrashIcon, path: "/app" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Just now";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getFirstName(raw: string): string {
  const part = raw.split(" ")[0].split("@")[0];
  return part.charAt(0).toUpperCase() + part.slice(1);
}

function getInitials(raw: string): string {
  const words = raw.split(" ").filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return raw.slice(0, 2).toUpperCase();
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AppDashboard() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [recentFiles, setRecentFiles] = useState<StirlingFileStub[]>([]);

  const username = session?.user?.username || session?.user?.email || "User";
  const email = session?.user?.email || "";
  const firstName = getFirstName(username);
  const initials = getInitials(username);

  useEffect(() => {
    if (!loading && !session) {
      navigate("/login", { replace: true });
    }
  }, [session, loading, navigate]);

  useEffect(() => {
    fileStorage.getAllStirlingFileStubs()
      .then((stubs) => {
        setRecentFiles(
          stubs.sort((a, b) => b.lastModified - a.lastModified).slice(0, 5)
        );
      })
      .catch(() => {});
  }, []);

  if (loading || !session) return null;

  return (
    <div className={styles.page}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo} onClick={() => navigate("/")}>
          <img
            src={`${BASE_PATH}/images/OnePDF_Logo.png`}
            alt="OnePDF"
            className={styles.sidebarLogoImg}
          />
          <span className={styles.sidebarBrand}>OnePDF</span>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ key, label, Icon, path }) => (
            <button
              key={key}
              className={`${styles.navItem} ${key === "home" ? styles.navItemActive : ""}`}
              onClick={() => navigate(path)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button className={styles.navItem}>
            <SettingsIcon />
            <span>Settings</span>
          </button>
          <button className={styles.navItem}>
            <HelpIcon />
            <span>Help &amp; Support</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <input
            className={styles.searchInput}
            placeholder="Search tools, files, and more..."
          />
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn} aria-label="Toggle theme">
              <SunIcon />
            </button>
            <div className={styles.userChip}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.userText}>
                <span className={styles.userName}>{username}</span>
                <span className={styles.userEmail}>{email}</span>
              </div>
              <ChevronDownIcon />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={styles.content}>
          <h1 className={styles.welcomeTitle}>Welcome back, {firstName}!</h1>
          <p className={styles.welcomeSubtitle}>
            All-in-one PDF tools to get your work done.
          </p>

          {/* Quick Tools */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quick Tools</h2>
            <button className={styles.sectionLink} onClick={() => navigate("/app")}>
              View all tools
            </button>
          </div>
          <div className={styles.toolGrid}>
            {QUICK_TOOLS.map(({ key, name, desc, Icon, path }) => (
              <button
                key={key}
                className={styles.toolCard}
                onClick={() => navigate(path)}
              >
                <div className={styles.toolIcon}>
                  <Icon />
                </div>
                <div className={styles.toolInfo}>
                  <div className={styles.toolName}>{name}</div>
                  <div className={styles.toolDesc}>{desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Recent Files */}
          <div className={styles.sectionHeader} style={{ marginTop: "2.5rem" }}>
            <h2 className={styles.sectionTitle}>Recent Files</h2>
            <button className={styles.sectionLink} onClick={() => navigate("/app")}>
              View all files
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.filesTable}>
              <thead>
                <tr>
                  <th className={styles.thName}>Name</th>
                  <th className={styles.thSize}>Size</th>
                  <th className={styles.thModified}>Modified</th>
                  <th className={styles.thActions}></th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyRow}>
                      No recent files. Open the app to get started.
                    </td>
                  </tr>
                ) : (
                  recentFiles.map((file) => (
                    <tr
                      key={String(file.id)}
                      className={styles.fileRow}
                      onClick={() => navigate("/app")}
                    >
                      <td className={styles.tdName}>
                        <FileDocIcon />
                        <span className={styles.fileName}>{file.name}</span>
                        <button
                          className={styles.starBtn}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Star file"
                        >
                          <StarSmallIcon />
                        </button>
                      </td>
                      <td className={styles.tdSize}>{formatBytes(file.size)}</td>
                      <td className={styles.tdModified}>{formatDate(file.lastModified)}</td>
                      <td className={styles.tdActions}>
                        <button
                          className={styles.dotsBtn}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="More options"
                        >
                          <DotsIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
