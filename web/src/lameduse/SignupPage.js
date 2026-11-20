// lameduse/SignupPage.js
// ======================
// Thin wrapper around the original Casdoor SignupPage.
// Applies Lameduse brand styling and the animated background via AuthShell
// without duplicating any business logic.

import React from "react";
import OriginalSignupPage from "../auth/SignupPage";
import AuthShell from "./AuthShell";

export default function SignupPage(props) {
  return (
    <AuthShell application={props.application} themeAlgorithm={props.themeAlgorithm} preview={props.preview}>
      <OriginalSignupPage {...props} />
    </AuthShell>
  );
}
