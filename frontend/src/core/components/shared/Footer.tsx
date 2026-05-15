import { Link } from "react-router-dom";

interface FooterProps {
  privacyPolicy?: string;
  termsAndConditions?: string;
  accessibilityStatement?: string;
  cookiePolicy?: string;
  impressum?: string;
  analyticsEnabled?: boolean;
  forceLightMode?: boolean;
}

export default function Footer({ forceLightMode = false }: FooterProps) {
  return (
    <div
      style={{
        height: "var(--footer-height)",
        backgroundColor: forceLightMode
          ? "#f1f3f5"
          : "var(--mantine-color-gray-1)",
        borderTop: forceLightMode
          ? "1px solid #e9ecef"
          : "1px solid var(--mantine-color-gray-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Link
        className="footer-link px-3"
        to="/help"
        style={{ fontSize: "0.75rem" }}
      >
        Help & Support
      </Link>
    </div>
  );
}
