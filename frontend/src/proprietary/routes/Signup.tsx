import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDocumentMeta } from "@app/hooks/useDocumentMeta";
import AuthLayout from "@app/routes/authShared/AuthLayout";
import "@app/routes/authShared/auth.css";
import { BASE_PATH } from "@app/constants/app";

// Import signup components
import ErrorMessage from "@app/routes/login/ErrorMessage";
import DividerWithText from "@app/components/shared/DividerWithText";
import SignupForm from "@app/routes/signup/SignupForm";
import {
  useSignupFormValidation,
  SignupFieldErrors,
} from "@app/routes/signup/SignupFormValidation";
import { useAuthService } from "@app/routes/signup/AuthService";

export default function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});


  const baseUrl = window.location.origin + BASE_PATH;

  // Set document meta
  useDocumentMeta({
    title: `${t("signup.title", "Create an account")} - OnePDF`,
    description: t(
      "app.description",
      "The Free Adobe Acrobat alternative (10M+ Downloads)",
    ),
    ogTitle: `${t("signup.title", "Create an account")} - OnePDF`,
    ogDescription: t(
      "app.description",
      "The Free Adobe Acrobat alternative (10M+ Downloads)",
    ),
    ogImage: `${baseUrl}/og_images/home.png`,
    ogUrl: `${window.location.origin}${window.location.pathname}`,
  });

  const { validateSignupForm } = useSignupFormValidation();
  const { signUp } = useAuthService();

  const handleSignUp = async () => {
    const validation = validateSignupForm(email, password, confirmPassword);
    if (!validation.isValid) {
      setError(validation.error);
      setFieldErrors(validation.fieldErrors || {});
      return;
    }

    try {
      setIsSigningUp(true);
      setError(null);
      setFieldErrors({});

      const result = await signUp(email, password, "");

      if (result.user) {
        // Show success message and redirect to login
        setError(null);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.error("[Signup] Unexpected error:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("signup.unexpectedError", { message: "Unknown error" }),
      );
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <AuthLayout
      title={t("signup.createAccount", "Create your account")}
      subtitle={t("signup.trialSubtitle", "Start your 7-day free trial. No credit card required.")}
    >

      <ErrorMessage error={error} />

      {/* Signup form - shown immediately */}
      <SignupForm
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        setEmail={setEmail}
        setPassword={setPassword}
        setConfirmPassword={setConfirmPassword}
        onSubmit={handleSignUp}
        isSubmitting={isSigningUp}
        fieldErrors={fieldErrors}
        showName={false}
        showTerms={false}
      />

      <DividerWithText
        text={t("signup.or", "or")}
        respondsToDarkMode={false}
        opacity={0.4}
      />

      {/* Bottom nav link */}
      <p style={{ textAlign: "center", marginTop: "auto", paddingTop: "1.25rem", fontSize: "0.875rem", color: "#888", margin: "auto 0 0" }}>
        {t("signup.alreadyHaveAccount", "Already have an account?")}{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 500, fontSize: "inherit", cursor: "pointer", padding: 0 }}
        >
          {t("login.logIn", "Log in")}
        </button>
      </p>
    </AuthLayout>
  );
}
