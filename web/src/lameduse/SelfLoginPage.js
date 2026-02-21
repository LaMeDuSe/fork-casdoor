// lameduse/SelfLoginPage.js
// =========================
// Thin wrapper mirroring the original SelfLoginPage but using
// the Lameduse-branded LoginPage wrapper instead of the upstream one.

import React from "react";
import LoginPage from "./LoginPage";
import {authConfig} from "../auth/Auth";

class SelfLoginPage extends React.Component {
  constructor(props) {
    super(props);
    import("../ManagementPage");
  }

  render() {
    return (
      <LoginPage type={"login"} mode={"signin"} applicationName={authConfig.appName} {...this.props} />
    );
  }
}

export default SelfLoginPage;
