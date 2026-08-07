export const tokens = {
  color: {
    background: {
      primary: "#081426",
      surface: "rgba(255, 255, 255, 0.04)",
      surfaceElevated: "rgba(255, 255, 255, 0.06)",
    },
    accent: {
      gold: "#D4AF37",
      goldMuted: "rgba(212, 175, 55, 0.4)",
      goldOnDark: "#081426",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.6)",
      muted: "rgba(255, 255, 255, 0.5)",
      placeholder: "rgba(255, 255, 255, 0.3)",
    },
    status: {
      success: "#34D399",
      successMuted: "rgba(52, 211, 153, 0.12)",
      warning: "#FBBF24",
      warningMuted: "rgba(251, 191, 36, 0.12)",
      error: "#F87171",
      errorMuted: "rgba(248, 113, 113, 0.12)",
    },
    border: {
      default: "rgba(255, 255, 255, 0.1)",
      focus: "rgba(212, 175, 55, 0.4)",
      strong: "rgba(255, 255, 255, 0.2)",
    },
  },

  radius: {
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    full: "9999px",
  },

  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "0.75rem", // 12px
    lg: "1rem", // 16px
    xl: "1.5rem", // 24px
    "2xl": "2rem", // 32px
    "3xl": "2.5rem", // 40px
    "4xl": "3.5rem", // 56px
    "5xl": "4rem", // 64px
    "6xl": "5rem", // 80px
  },

  shadow: {
    none: "none",
    sm: "0 1px 2px rgba(8, 20, 38, 0.4)",
    md: "0 4px 12px rgba(8, 20, 38, 0.5)",
    lg: "0 8px 24px rgba(8, 20, 38, 0.6)",
    xl: "0 16px 48px rgba(8, 20, 38, 0.7)",
    gold: "0 4px 24px rgba(212, 175, 55, 0.15)",
  },
} as const;

export type DesignTokens = typeof tokens;
