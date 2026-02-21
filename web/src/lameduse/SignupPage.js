// lameduse/SignupPage.js
// ======================
// Thin wrapper around the original Casdoor SignupPage.
// Applies Lameduse brand styling via CSS scoping without
// duplicating any business logic.

import React from "react";
import OriginalSignupPage from "../auth/SignupPage";
import "./auth.css";

export default function SignupPage(props) {
  return (
    <div className="lameduse-auth">
      <OriginalSignupPage {...props} />
    </div>
  );
}
