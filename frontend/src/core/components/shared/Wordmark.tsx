import React from "react";
import { useMantineColorScheme } from "@mantine/core";

interface WordmarkProps extends React.HTMLAttributes<HTMLSpanElement> {
  alt?: string;
  muted?: boolean;
}

export function Wordmark({ alt: _alt, muted = false, style, ...props }: WordmarkProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const color = isDark ? "#f8fafc" : muted ? "#9ca3af" : "#0f172a";

  return (
    <span
      role="img"
      style={{
        fontWeight: 800,
        fontSize: "1.1rem",
        letterSpacing: "-0.02em",
        color,
        userSelect: "none",
        display: "inline-block",
        ...style,
      }}
      {...props}
    >
      OnePDF
    </span>
  );
}
