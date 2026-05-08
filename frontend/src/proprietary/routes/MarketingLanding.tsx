import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_PATH } from "@app/constants/app";
import { useAuth } from "@app/auth/UseSession";
import { useToolWorkflow } from "@app/contexts/ToolWorkflowContext";
import { ToolId } from "@app/types/toolId";
import styles from "./MarketingLanding.module.css";

const PATH_TO_TOOL_ID: Record<string, ToolId> = {
  "/pdf-text-editor": "pdfTextEditor",
  "/convert": "convert",
  "/merge": "merge",
  "/split": "split",
  "/compress": "compress",
  "/sign": "sign",
};

function PencilIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function ConvertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function MergeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="7" height="9" rx="1" />
      <rect x="12" y="13" width="7" height="9" rx="1" />
      <path d="M8.5 11v2.5A1.5 1.5 0 0 0 10 15h2" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="20" x2="3" y2="13" />
      <line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  );
}

function SignIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17c3-3 4-5 6-5s3 5 6 5 3-3 6-3" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function CloudBaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const TO_PDF = [
  "Word to PDF",
  "Excel to PDF",
  "PowerPoint to PDF",
  "Image to PDF",
  "HTML to PDF",
  "Markdown to PDF",
  "SVG to PDF",
  "URL to PDF",
  "Email to PDF",
  "eBook to PDF",
];

const FROM_PDF = [
  "PDF to Word",
  "PDF to Excel",
  "PDF to PowerPoint",
  "PDF to Image",
  "PDF to HTML",
  "PDF to Text",
  "PDF to CSV",
  "PDF to Markdown",
  "PDF to EPUB",
  "PDF to PDF/A",
];

const TOOLS = [
  { name: "Edit PDF", desc: "Edit text, pages and more", Icon: PencilIcon, path: "/pdf-text-editor" },
  { name: "Convert PDF", desc: "Convert to and from PDF", Icon: ConvertIcon, path: "/convert" },
  { name: "Merge PDF", desc: "Combine multiple PDF files", Icon: MergeIcon, path: "/merge" },
  { name: "Split PDF", desc: "Split PDF into multiple files", Icon: SplitIcon, path: "/split" },
  { name: "Compress PDF", desc: "Reduce PDF file size", Icon: CompressIcon, path: "/compress" },
  { name: "Sign PDF", desc: "Create and add signatures", Icon: SignIcon, path: "/sign" },
];

export default function MarketingLanding() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { handleToolSelect } = useToolWorkflow();
  const logoSrc = `${BASE_PATH}/images/OnePDF_Logo.png`;
  const [convertOpen, setConvertOpen] = useState(false);
  const convertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!convertOpen) return;
    function handleClick(e: MouseEvent) {
      if (convertRef.current && !convertRef.current.contains(e.target as Node)) {
        setConvertOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [convertOpen]);

  const goToApp = () => navigate(session ? "/app" : "/login");
  const goToTool = (path: string) => {
    if (session) {
      const toolId = PATH_TO_TOOL_ID[path];
      if (toolId) handleToolSelect(toolId);
      navigate(path);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Navigation ── */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <img src={logoSrc} alt="OnePDF" className={styles.navLogoImg} />
          <span className={styles.navBrand}>OnePDF</span>
        </div>

        <div className={styles.navToolLinks}>
          <button className={styles.navToolLink} onClick={() => goToTool("/pdf-text-editor")}>Edit PDF</button>

          {/* Convert dropdown */}
          <div className={styles.convertWrapper} ref={convertRef}>
            <button
              className={`${styles.navToolLink} ${styles.convertBtn} ${convertOpen ? styles.convertBtnOpen : ""}`}
              onClick={() => setConvertOpen((o) => !o)}
            >
              Convert PDF <ChevronDownIcon open={convertOpen} />
            </button>
            {convertOpen && (
              <div className={styles.convertDropdown}>
                <div className={styles.convertSection}>
                  <div className={styles.convertSectionTitle}>To PDF</div>
                  {TO_PDF.map((f) => (
                    <button
                      key={f}
                      className={styles.convertItem}
                      onClick={() => { setConvertOpen(false); goToTool("/convert"); }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className={styles.convertSection}>
                  <div className={styles.convertSectionTitle}>From PDF</div>
                  {FROM_PDF.map((f) => (
                    <button
                      key={f}
                      className={styles.convertItem}
                      onClick={() => { setConvertOpen(false); goToTool("/convert"); }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className={styles.navToolLink} onClick={() => goToTool("/merge")}>Merge PDF</button>
          <button className={styles.navToolLink} onClick={() => goToTool("/split")}>Split PDF</button>
          <button className={styles.navToolLink} onClick={() => goToTool("/compress")}>Compress PDF</button>
          <button className={styles.navToolLink} onClick={() => goToTool("/sign")}>Sign PDF</button>
        </div>

        <div className={styles.navActions}>
          <button className={styles.loginBtn} onClick={() => navigate("/login")}>
            Login
          </button>
          <button className={styles.signupBtn} onClick={() => navigate("/signup")}>
            Sign up
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>
            Everything you need<br />to do more with PDFs.
          </h1>
          <p className={styles.heroSubtitle}>
            Edit, convert, merge, split, compress, sign,<br />
            and collaborate on PDFs — all in one place.
          </p>
          <div className={styles.heroCtas}>
            <button
              className={styles.getStartedBtn}
              onClick={() => navigate(session ? "/app" : "/login")}
            >
              Get Started →
            </button>
            <button className={styles.signInBtn} onClick={() => navigate("/login")}>
              Sign In
            </button>
          </div>
          <div className={styles.featureStrip}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}><ShieldIcon /></div>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>Secure</span>
                <span className={styles.featureSubtext}>Your files are always protected</span>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}><ZapIcon /></div>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>Fast</span>
                <span className={styles.featureSubtext}>Process files in seconds</span>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}><GridIcon /></div>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>All in One</span>
                <span className={styles.featureSubtext}>Powerful tools in one place</span>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}><CloudBaseIcon /></div>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>Cloud-Based</span>
                <span className={styles.featureSubtext}>Access anywhere, anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── PDF illustration ── */}
        <div className={styles.heroRight}>
          <div className={styles.illustration}>
            <div className={`${styles.floatCard} ${styles.floatTopLeft}`}>
              <PencilIcon />
            </div>
            <div className={`${styles.floatCard} ${styles.floatTopRight}`}>
              <ConvertIcon />
            </div>
            <div className={`${styles.floatCard} ${styles.floatMidLeft}`}>
              <MergeIcon />
            </div>
            <div className={`${styles.floatCard} ${styles.floatMidRight}`}>
              <DownloadIcon />
            </div>
            <div className={`${styles.floatCard} ${styles.floatBottom}`}>
              <SignIcon />
            </div>

            <div className={styles.pdfDoc}>
              <div className={styles.pdfDocCorner} />
              <div className={styles.pdfLine} />
              <div className={`${styles.pdfLine} ${styles.pdfLineShort}`} />
              <div className={styles.pdfLine} />
              <div className={`${styles.pdfLine} ${styles.pdfLineShort}`} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Tool cards ── */}
      <section className={styles.features} id="features">
        <h2 className={styles.featuresTitle}>Powerful tools. Easy to use.</h2>
        <p className={styles.featuresSubtitle}>
          Everything you need to work with PDFs in one place.
        </p>
        <div className={styles.toolGrid} id="tools">
          {TOOLS.map(({ name, desc, Icon, path }) => (
            <div key={name} className={styles.toolCard} onClick={() => goToTool(path)}>
              <div className={styles.toolIcon}>
                <Icon />
              </div>
              <div>
                <div className={styles.toolName}>{name}</div>
                <div className={styles.toolDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
