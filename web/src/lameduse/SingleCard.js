// lameduse/SingleCard.js
// =======================
// Custom Lameduse pricing card UI.
// This file lives outside the upstream Casdoor tree so that
// upstream merges never touch it.

import i18next from "i18next";
import React from "react";
import {Button, Col, Tag} from "antd";
import {CheckCircleFilled} from "@ant-design/icons";
import * as Setting from "../Setting";
import {Colors, cardStyle as themeCardStyle} from "../LameduseTheme";
import {withRouter} from "react-router-dom";

class SingleCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      hovered: false,
    };
  }

  renderCard(plan, isSingle, link) {
    const isHovered = this.state.hovered;
    const isHighlighted = plan.isRecommended || isSingle;

    const computedCardStyle = {
      ...themeCardStyle(isHighlighted, isHovered),
      width: "100%",
      maxWidth: "360px",
      minWidth: "280px",
      height: "100%",
      padding: "36px 28px",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    };

    return (
      <Col
        style={{padding: "12px", display: "flex", justifyContent: "center"}}
        xs={24} sm={24} md={12} lg={8} xl={6}
      >
        <div
          style={computedCardStyle}
          onClick={() => (window.location.href = link)}
          onMouseEnter={() => this.setState({hovered: true})}
          onMouseLeave={() => this.setState({hovered: false})}
        >
          {/* Highlight badge */}
          {isHighlighted && (
            <div style={{position: "absolute", top: "16px", right: "16px"}}>
              <Tag color="blue" style={{
                borderRadius: "12px",
                padding: "2px 12px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
              }}>
                {i18next.t("pricing:Recommended")}
              </Tag>
            </div>
          )}

          {/* Plan name */}
          <div style={{marginBottom: "8px"}}>
            <h3 style={{fontSize: "22px", fontWeight: 700, color: Colors.textDark, margin: 0}}>
              {plan.displayName}
            </h3>
          </div>

          {/* Price */}
          <div style={{marginBottom: "20px", paddingBottom: "20px", borderBottom: `1px solid ${Colors.borderSubtle}`}}>
            <span style={{fontSize: "44px", fontWeight: 800, color: Colors.textDark, lineHeight: 1.1, letterSpacing: "-1px"}}>
              {Setting.getCurrencySymbol(plan.currency)}{plan.price}
            </span>
            <span style={{fontSize: "15px", fontWeight: 500, color: Colors.textLight, marginLeft: "4px"}}>
              / {plan.period === "Yearly" ? i18next.t("plan:per year") : i18next.t("plan:per month")}
            </span>
          </div>

          {/* Description */}
          {plan.description && (
            <div style={{fontSize: "14px", lineHeight: "1.7", color: Colors.textBody, marginBottom: "24px", flex: 1}}>
              {plan.description}
            </div>
          )}

          {/* Features / role options */}
          {(plan.options ?? []).length > 0 && (
            <ul style={{listStyleType: "none", padding: 0, margin: "0 0 28px 0", flex: 1}}>
              {plan.options.map((option, idx) => (
                <li key={idx} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                  fontSize: "14px",
                  color: "#434343",
                  lineHeight: "1.5",
                }}>
                  <CheckCircleFilled style={{
                    color: Colors.tertiary,
                    marginRight: "10px",
                    marginTop: "3px",
                    fontSize: "16px",
                    flexShrink: 0,
                  }} />
                  <span>{option}</span>
                </li>
              ))}
            </ul>
          )}

          {/* CTA Button */}
          <div style={{marginTop: "auto", paddingTop: "8px"}}>
            <Button
              type={isHighlighted ? "primary" : "default"}
              size="large"
              block
              style={{
                height: "48px",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "15px",
                ...(isHighlighted ? {
                  background: Colors.primary,
                  borderColor: Colors.primary,
                } : {
                  borderColor: Colors.secondary,
                  color: Colors.secondary,
                }),
              }}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = link;
              }}
            >
              {i18next.t("pricing:Getting started")}
            </Button>
          </div>
        </div>
      </Col>
    );
  }

  render() {
    return this.renderCard(this.props.plan, this.props.isSingle, this.props.link);
  }
}

export default withRouter(SingleCard);
