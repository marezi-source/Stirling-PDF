import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_PATH } from "@app/constants/app";
import styles from "@app/routes/authShared/AuthLayout.module.css";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function LockFeatureIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const FEATURES = [
  { Icon: ShieldIcon, text: "All your PDF tools in one place" },
  { Icon: LightningIcon, text: "Fast, simple and easy to use" },
  { Icon: LockFeatureIcon, text: "Your files stay private and secure" },
];

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const htmlElement = document.documentElement;
    const previous = htmlElement.getAttribute("data-mantine-color-scheme");
    return () => {
      if (previous) {
        htmlElement.setAttribute("data-mantine-color-scheme", previous);
      }
    };
  }, []);

  const logoSrc = `${BASE_PATH}/images/OnePDF_Logo.png`;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* ── Left branding panel ── */}
        <div className={styles.leftPanel}>
          <button className={styles.logoBtn} onClick={() => navigate("/")} aria-label="Go to home">
            <img src={logoSrc} alt="OnePDF" className={styles.logo} />
          </button>
          <span className={styles.brand}>OnePDF</span>
          <p className={styles.tagline}>All-in-one PDF tools to get<br />your work done.</p>
          <ul className={styles.featureList}>
            {FEATURES.map(({ Icon, text }) => (
              <li key={text} className={styles.featureItem}>
                <Icon />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right form panel ── */}
        <div className={styles.rightPanel}>
          {title && <h1 className={styles.formTitle}>{title}</h1>}
          {subtitle && <p className={styles.formSubtitle}>{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
