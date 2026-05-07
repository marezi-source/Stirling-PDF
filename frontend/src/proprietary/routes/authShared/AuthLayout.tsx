import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BASE_PATH } from "@app/constants/app";
import styles from "@app/routes/authShared/AuthLayout.module.css";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Disable Mantine color scheme overrides on auth pages — CSS handles theming
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
    <div className={styles.authContainer}>
      {/* Top navigation */}
      <nav className={styles.topNav}>
        <button className={styles.backLink} onClick={() => navigate("/")}>
          ← {t("auth.backToHome", "Back to home")}
        </button>
        <div className={styles.topNavRight}>
          <span className={styles.notMemberText}>
            {t("auth.notAMember", "Not a member?")}
          </span>
          <button
            className={styles.signUpButton}
            onClick={() => navigate("/signup")}
          >
            {t("auth.signUp", "Sign Up")}
          </button>
        </div>
      </nav>

      {/* Centered form area */}
      <div className={styles.authContent}>
        <img src={logoSrc} alt="OnePDF" className={styles.logo} />
        {children}
      </div>
    </div>
  );
}
