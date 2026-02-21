// LameduseTheme.js
// =================
// Centralized brand configuration for Lameduse.
// All logo URLs, brand colors, and text overrides live here.
// When upstream Casdoor updates component files, only small import
// lines need resolving — the brand values stay intact in this file.

// ── Brand Colors ──────────────────────────────────────────────────
export const Colors = {
  primary: "#1B1464",      // Deep indigo — headings, primary buttons
  secondary: "#0080E2",    // Blue — links, accents, outlined buttons
  tertiary: "#01B4B6",     // Teal — checkmarks, success indicators

  textDark: "#1B1464",
  textMuted: "#6b7280",
  textLight: "#8c8c8c",
  textBody: "#595959",

  bgGradientStart: "#f8f9fc",
  bgGradientEnd: "#ffffff",
  bgCard: "#ffffff",
  bgSection: "#f8f9fc",

  borderLight: "#e8e8e8",
  borderSubtle: "#f0f0f0",
};

// ── Logo URLs ─────────────────────────────────────────────────────
export const Logos = {
  // Full logo with text (on white/light backgrounds)
  fullWhite: "https://assets.lameduse.net/logo/lameduse_logo_grad_text_primary_bg_white.png",

  // Gradient logo (no text, icon only)
  gradPng: "https://assets.lameduse.net/logo/lameduse_logo_grad.png",
  gradSvg: "https://assets.lameduse.net/logo/lameduse_logo_grad.svg",
};

// ── Brand Text ────────────────────────────────────────────────────
export const BrandName = "Lameduse";
export const BrandOrg = "Lameduse Organization";
export const BrandTeam = "LaMeDuSe Team";
export const BrandGroup = "LaMeDuSe Group";
export const BrandUrl = "https://lameduse.com";
export const Copyright = "© 2026 LaMeDuSe Group. All Rights Reserved.";

// ── Common Style Fragments ────────────────────────────────────────
// Reusable style objects to reduce inline duplication.

export const cardStyle = (isHighlighted = false, isHovered = false) => ({
  borderRadius: "16px",
  border: isHighlighted ? `2px solid ${Colors.secondary}` : `1px solid ${Colors.borderLight}`,
  background: Colors.bgCard,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: isHovered
    ? "0 20px 40px rgba(0, 0, 0, 0.12)"
    : isHighlighted
      ? `0 8px 24px rgba(0, 128, 226, 0.18)`
      : "0 2px 8px rgba(0, 0, 0, 0.06)",
  transform: isHovered ? "translateY(-6px)" : "translateY(0)",
  cursor: "pointer",
});

export const pageBackground = {
  minHeight: "100vh",
  background: `linear-gradient(180deg, ${Colors.bgGradientStart} 0%, ${Colors.bgGradientEnd} 50%)`,
};

export const headerGradient = {
  background: `linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.secondary} 100%)`,
  color: "#fff",
};

export const primaryButton = {
  background: Colors.primary,
  borderColor: Colors.primary,
  borderRadius: "12px",
  fontWeight: 600,
};

export const outlinedButton = {
  borderColor: Colors.secondary,
  color: Colors.secondary,
  borderRadius: "12px",
  fontWeight: 600,
};

export const sectionCard = {
  background: Colors.bgSection,
  borderRadius: "14px",
  padding: "24px 28px",
};
