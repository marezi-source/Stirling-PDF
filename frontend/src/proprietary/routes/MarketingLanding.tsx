import { useNavigate } from "react-router-dom";
import { BASE_PATH } from "@app/constants/app";
import { useAuth } from "@app/auth/UseSession";
import styles from "./MarketingLanding.module.css";

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

const TOOLS = [
  { name: "Edit PDF", desc: "Edit text, pages and more", Icon: PencilIcon },
  { name: "Convert PDF", desc: "Convert to and from PDF", Icon: ConvertIcon },
  { name: "Merge PDF", desc: "Combine multiple PDF files", Icon: MergeIcon },
  { name: "Split PDF", desc: "Split PDF into multiple files", Icon: SplitIcon },
  { name: "Compress PDF", desc: "Reduce PDF file size", Icon: CompressIcon },
  { name: "Sign PDF", desc: "Create and add signatures", Icon: SignIcon },
];

export default function MarketingLanding() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const logoSrc = `${BASE_PATH}/images/onepdf-login-logo.png`;

  return (
    <div className={styles.page}>
      {/* ── Navigation ── */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <img src={logoSrc} alt="OnePDF" className={styles.navLogoImg} />
          <span className={styles.navBrand}>OnePDF</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#tools" className={styles.navLink}>Tools</a>
        </div>
        <div className={styles.navActions}>
          {session ? (
            <button className={styles.signupBtn} onClick={() => navigate("/app")}>
              Open App
            </button>
          ) : (
            <>
              <button className={styles.loginBtn} onClick={() => navigate("/login")}>
                Login
              </button>
              <button className={styles.signupBtn} onClick={() => navigate("/signup")}>
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>
            All the tools you need for your PDF.
          </h1>
          <p className={styles.heroSubtitle}>Simple. Fast. Secure.</p>
          <p className={styles.heroDesc}>
            OnePDF is the all-in-one PDF toolkit to edit, convert, compress,
            merge, and more — in just a few clicks.
          </p>
          <button
            className={styles.uploadBtn}
            onClick={() => navigate(session ? "/app" : "/login")}
          >
            <UploadIcon />
            Upload file
          </button>
          <p className={styles.securityNote}>
            <LockIcon />
            Your files stay private and secure
          </p>
        </div>

        {/* ── PDF illustration ── */}
        <div className={styles.heroRight}>
          <div className={styles.illustration}>
            {/* Floating tool cards */}
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

            {/* Central PDF document */}
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
          {TOOLS.map(({ name, desc, Icon }) => (
            <div key={name} className={styles.toolCard}>
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
