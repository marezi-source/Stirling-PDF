import React from "react";
import { ActionIcon } from "@mantine/core";
import FitText from "@app/components/shared/FitText";

interface QuickAccessButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
  ariaLabel: string;
  textClassName?: "button-text" | "all-tools-text";
  backgroundColor?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  component?: "a" | "button";
  dataTestId?: string;
  dataTour?: string;
  disabled?: boolean;
}

const QuickAccessButton: React.FC<QuickAccessButtonProps> = ({
  icon,
  label,
  isActive,
  onClick,
  href,
  ariaLabel,
  textClassName = "button-text",
  backgroundColor,
  color,
  size,
  className,
  component = "button",
  dataTestId,
  dataTour,
  disabled = false,
}) => {
  const buttonSize = size || "md";
  const bgColor =
    backgroundColor ||
    (isActive ? "var(--nav-btn-active-bg)" : "transparent");
  const textColor =
    color ||
    (isActive ? "var(--nav-btn-active-color)" : "var(--nav-btn-inactive-color)");

  const isLink = component === "a" && !!href;
  const Tag = isLink ? "a" : "div";

  return (
    <Tag
      {...(isLink ? { href } : {})}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={`flex flex-col items-center gap-1 qab-pill${isActive ? " qab-pill--active" : ""}`}
      style={{
        backgroundColor: bgColor,
        borderRadius: "10px",
        padding: "0.375rem 0.25rem",
        width: "100%",
        boxSizing: "border-box",
        transition: "background-color 150ms ease",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        textDecoration: "none",
      }}
      data-tour={dataTour}
      data-testid={dataTestId}
      onClick={disabled ? undefined : onClick}
      onKeyDown={disabled ? undefined : (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).click();
        }
      }}
    >
      <ActionIcon
        size={buttonSize}
        variant="subtle"
        tabIndex={-1}
        style={{
          backgroundColor: "transparent",
          color: textColor,
          border: "none",
          borderRadius: "8px",
          cursor: "inherit",
          pointerEvents: "none",
        }}
        className={className || ""}
        aria-hidden
      >
        <span className="iconContainer">{icon}</span>
      </ActionIcon>
      <div style={{ width: "100%" }}>
        <FitText
          as="span"
          text={label}
          lines={2}
          minimumFontScale={0.5}
          className={`${textClassName} ${isActive ? "active" : "inactive"}`}
          style={{
            fontSize: "0.75rem",
            textAlign: "center",
            display: "block",
            color: textColor,
          }}
        />
      </div>
    </Tag>
  );
};

export default QuickAccessButton;
