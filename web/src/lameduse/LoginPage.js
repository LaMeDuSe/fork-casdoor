// lameduse/LoginPage.js
// =====================
// Thin wrapper around the original Casdoor LoginPage.
// It applies Lameduse brand styling via CSS scoping (the ".lameduse-auth"
// class) without touching any of the original component's business logic.
//
// All props are forwarded 1:1 — every feature (OAuth, WebAuthn, SAML,
// MFA, captcha, face-id, custom CSS/HTML, etc.) works exactly as before.

import React from "react";
import OriginalLoginPage from "../auth/LoginPage";
import "./auth.css";

export default function LoginPage(props) {
  return (
    <div className="lameduse-auth">
      <OriginalLoginPage {...props} />
    </div>
  );
}
