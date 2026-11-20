// lameduse/AuthShell.js
// =====================
// Shared frame for the Lameduse auth pages: scopes the brand CSS (".lameduse-auth"),
// adds the animated background and exposes translated labels to CSS.
//
// The animated background is skipped when:
//   - the page is rendered as a preview inside the admin UI (it would cover the editor)
//   - the page is embedded in an iframe (same rule upstream uses for background images)
//   - the application configured its own background image (respect the admin's choice)

import React from "react";
import {useTranslation} from "react-i18next";
import * as Setting from "../Setting";
import AuthBackground from "./AuthBackground";
import "./auth.css";

export default function AuthShell({application, themeAlgorithm, preview, children}) {
  const {t} = useTranslation();
  const dark = Setting.isDarkTheme(themeAlgorithm);

  const customBackground = application && (Setting.isMobile() ? application.formBackgroundUrlMobile : application.formBackgroundUrl);
  const animated = !preview && !Setting.inIframe() && !customBackground;

  const classNames = [
    "lameduse-auth",
    dark ? "lameduse-auth-dark" : "lameduse-auth-light",
    animated ? "lameduse-auth-animated" : "",
  ].join(" ");

  return (
    <div className={classNames} style={{"--ld-divider-label": JSON.stringify(t("login:Continue with"))}}>
      {animated ? <AuthBackground dark={dark} /> : null}
      <div className="lameduse-auth-content">
        {children}
      </div>
    </div>
  );
}
