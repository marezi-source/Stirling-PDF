import React from "react";

export interface NavigationControlsProps {
  currentIndex: number;
  totalFiles: number;
  onPrevious: () => void;
  onNext: () => void;
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.75rem",
  height: "1.75rem",
  borderRadius: "0.375rem",
  border: "1px solid var(--border-default)",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  cursor: "pointer",
  fontSize: "0.85rem",
  lineHeight: 1,
  transition: "background 0.15s ease, border-color 0.15s ease",
};

const NavigationControls = ({
  currentIndex,
  totalFiles,
  onPrevious,
  onNext,
}: NavigationControlsProps) => {
  if (totalFiles <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        marginTop: "0.5rem",
      }}
    >
      <button
        style={btnStyle}
        onClick={onPrevious}
        data-testid="review-panel-prev"
        aria-label="Previous file"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--bg-muted)";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border-strong)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--bg-surface)";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border-default)";
        }}
      >
        ‹
      </button>
      <span
        style={{
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          minWidth: "3.5rem",
          textAlign: "center",
        }}
      >
        {currentIndex + 1} of {totalFiles}
      </span>
      <button
        style={btnStyle}
        onClick={onNext}
        data-testid="review-panel-next"
        aria-label="Next file"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--bg-muted)";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border-strong)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--bg-surface)";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border-default)";
        }}
      >
        ›
      </button>
    </div>
  );
};

export default NavigationControls;
