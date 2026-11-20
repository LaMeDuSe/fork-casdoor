// lameduse/brand.ts
// =================
// Centralized LaMeDuSe brand configuration for the frontend.
// All logo URLs, brand colors and brand text live here, so upstream Casdoor
// merges only touch small import lines in the files that use them.
// Backend counterpart: util/brand.go (keep the logo URLs in sync).

export const Colors = {
  primary: "#1B1464", // deep indigo: headings, primary buttons
  secondary: "#0080E2", // blue: links, accents
  tertiary: "#01B4B6", // teal: success, highlights
};

export const Logos = {
  // full logo with the wordmark, for light backgrounds
  full: "https://assets.lameduse.net/logo/lameduse_logo_grad_text_primary_bg_white.png",
  // gradient mark without text
  gradPng: "https://assets.lameduse.net/logo/lameduse_logo_grad.png",
  gradSvg: "https://assets.lameduse.net/logo/lameduse_logo_grad.svg",
};

export const BrandName = "Lameduse";
export const BrandDisplayName = "LaMeDuSe";
export const BrandOrg = "LaMeDuSe Organization";
export const BrandTeam = "LaMeDuSe Team";
export const BrandGroup = "LaMeDuSe Group";
export const BrandUrl = "https://lameduse.com";
export const BrandAuthUrl = "https://lameduse.net";
export const Copyright = `© ${new Date().getFullYear()} LaMeDuSe Group. All Rights Reserved.`;

/** The favicon written in web/index.html; routers/branding.go swaps it for an organization's own. */
export const Favicon = Logos.gradPng;
