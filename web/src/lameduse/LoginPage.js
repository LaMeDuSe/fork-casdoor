// lameduse/LoginPage.js
// =====================
// Thin wrapper around the original Casdoor LoginPage.
// It applies Lameduse brand styling and the animated background via AuthShell
// without touching any of the original component's business logic.
//
// All props are forwarded 1:1 — every feature (OAuth, WebAuthn, SAML,
// MFA, captcha, face-id, custom CSS/HTML, etc.) works exactly as before.

import React from "react";
import OriginalLoginPage from "../auth/LoginPage";
import AuthShell from "./AuthShell";

export default function LoginPage(props) {
  return (
    <AuthShell application={props.application} themeAlgorithm={props.themeAlgorithm} preview={props.preview}>
      <OriginalLoginPage {...props} />
    </AuthShell>
  );
}
