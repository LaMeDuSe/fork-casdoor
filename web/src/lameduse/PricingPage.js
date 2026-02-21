// lameduse/PricingPage.js
// ========================
// Custom Lameduse PricingPage UI.
// This file lives outside the upstream Casdoor tree so that
// upstream merges never touch it.
//
// Imported in place of the original by PricingEditPage and
// EntryPage via the re-export barrel at lameduse/index.js.

import React from "react";
import {Radio, Row} from "antd";
import * as PricingBackend from "../backend/PricingBackend";
import * as PlanBackend from "../backend/PlanBackend";
import CustomGithubCorner from "../common/CustomGithubCorner";
import * as Setting from "../Setting";
import {Colors, pageBackground} from "../LameduseTheme";
import SingleCard from "./SingleCard";
import i18next from "i18next";

class PricingPage extends React.Component {
  constructor(props) {
    super(props);
    const params = new URLSearchParams(window.location.search);
    this.state = {
      classes: props,
      applications: null,
      owner: props.owner ?? (props.match?.params?.owner ?? null),
      pricingName: (props.pricingName ?? props.match?.params?.pricingName) ?? null,
      userName: params.get("user"),
      pricing: props.pricing,
      plans: null,
      periods: null,
      selectedPeriod: null,
      loading: false,
    };
  }

  componentDidMount() {
    this.setState({applications: []});
    if (this.state.userName) {
      Setting.showMessage("info", `${i18next.t("pricing:paid-user do not have active subscription or pending subscription, please select a plan to buy")}`);
    }
    if (this.state.pricing) {
      this.loadPlans();
    } else {
      this.loadPricing(this.state.pricingName);
    }
    this.setState({loading: true});
  }

  componentDidUpdate() {
    if (this.state.pricing &&
      this.state.pricing.plans?.length !== this.state.plans?.length && !this.state.loading) {
      this.setState({loading: true});
      this.loadPlans();
    }
  }

  loadPlans() {
    const plans = this.state.pricing.plans.map((plan) =>
      PlanBackend.getPlan(this.state.owner, plan, true));

    Promise.all(plans)
      .then(results => {
        const hasError = results.some(result => result.status === "error");
        if (hasError) {
          Setting.showMessage("error", i18next.t("general:Failed to get"));
          return;
        }
        const plans = results.map(result => result.data);
        const periods = [... new Set(plans.map(plan => plan.period).filter(period => period !== ""))];
        this.setState({
          plans,
          periods,
          selectedPeriod: periods?.[0],
          loading: false,
        });
      })
      .catch(error => {
        Setting.showMessage("error", i18next.t("general:Failed to get") + `: ${error}`);
      });
  }

  loadPricing(pricingName) {
    if (!pricingName) {
      return;
    }
    PricingBackend.getPricing(this.state.owner, pricingName)
      .then((res) => {
        if (res.status === "error") {
          Setting.showMessage("error", res.msg);
          return;
        }
        this.setState({loading: false, pricing: res.data});
        this.onUpdatePricing(res.data);
      });
  }

  onUpdatePricing(pricing) {
    this.props.onUpdatePricing(pricing);
  }

  renderSelectPeriod() {
    if (!this.state.periods || this.state.periods.length <= 1) {
      return null;
    }
    return (
      <div style={{
        display: "inline-flex",
        background: "#f5f5f5",
        borderRadius: "12px",
        padding: "4px",
      }}>
        <Radio.Group
          value={this.state.selectedPeriod}
          size="large"
          buttonStyle="solid"
          onChange={e => this.setState({selectedPeriod: e.target.value})}
          style={{display: "flex"}}
        >
          {this.state.periods.map(period => (
            <Radio.Button
              key={period}
              value={period}
              style={{
                borderRadius: "10px",
                border: "none",
                fontWeight: 600,
                height: "40px",
                lineHeight: "40px",
                padding: "0 24px",
              }}
            >
              {period}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
    );
  }

  renderCards() {
    const getUrlByPlan = (planName) => {
      const pricing = this.state.pricing;
      const account = this.props.account;
      const isLoggedIn = (account !== null && account !== undefined);
      if (isLoggedIn) {
        const userName = this.state.userName || account.name;
        return `/buy-plan/${pricing.owner}/${pricing.name}?plan=${planName}${userName ? `&user=${userName}` : ""}`;
      } else {
        return `/signup/${pricing.application}?plan=${planName}&pricing=${pricing.name}`;
      }
    };

    const filteredPlans = this.state.plans.filter(item => item.period === this.state.selectedPeriod);

    return (
      <Row
        style={{justifyContent: "center", width: "100%", maxWidth: "1200px", margin: "0 auto"}}
        gutter={[0, 0]}
      >
        {filteredPlans.map(item => (
          <SingleCard
            link={getUrlByPlan(item.name)}
            key={item.name}
            plan={item}
            isSingle={filteredPlans.length === 1}
          />
        ))}
      </Row>
    );
  }

  render() {
    if (this.state.loading || this.state.plans === null || this.state.plans === undefined) {
      return null;
    }

    const pricing = this.state.pricing;

    return (
      <React.Fragment>
        <CustomGithubCorner />
        <div style={{
          ...pageBackground,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: Setting.isMobile() ? "40px 16px" : "60px 24px",
        }}>
          {/* Header section */}
          <div style={{textAlign: "center", maxWidth: "700px", marginBottom: "48px"}}>
            <h1 style={{
              fontSize: Setting.isMobile() ? "32px" : "48px",
              fontWeight: 800,
              color: Colors.textDark,
              marginTop: 0,
              marginBottom: "16px",
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
            }}>
              {pricing.displayName}
            </h1>
            {pricing.description && (
              <p style={{
                fontSize: Setting.isMobile() ? "16px" : "18px",
                color: Colors.textMuted,
                lineHeight: 1.6,
                margin: 0,
              }}>
                {pricing.description}
              </p>
            )}
          </div>

          {/* Period toggle */}
          {this.state.periods && this.state.periods.length > 1 && (
            <div style={{marginBottom: "40px"}}>
              {this.renderSelectPeriod()}
            </div>
          )}

          {/* Plan cards */}
          <div style={{width: "100%", maxWidth: "1200px"}}>
            {this.renderCards()}
          </div>

          {/* Trial info */}
          {pricing && pricing.trialDuration > 0 && (
            <div style={{
              marginTop: "32px",
              padding: "12px 24px",
              background: "rgba(0, 128, 226, 0.08)",
              borderRadius: "8px",
              color: Colors.secondary,
              fontSize: "15px",
              fontWeight: 500,
            }}>
              {i18next.t("pricing:Free")} {pricing.trialDuration}-{i18next.t("pricing:days trial available!")}
            </div>
          )}
        </div>
      </React.Fragment>
    );
  }
}

export default PricingPage;
