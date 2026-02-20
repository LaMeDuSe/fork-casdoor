// Copyright 2023 The Casdoor Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import i18next from "i18next";
import React from "react";
import {Button, Col, Tag} from "antd";
import {CheckCircleFilled} from "@ant-design/icons";
import * as Setting from "../Setting";
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

    const cardStyle = {
      width: "100%",
      maxWidth: "360px",
      minWidth: "280px",
      height: "100%",
      borderRadius: "16px",
      border: isHighlighted ? "2px solid #0080E2" : "1px solid #e8e8e8",
      background: "#fff",
      padding: "36px 28px",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: isHovered
        ? "0 20px 40px rgba(0, 0, 0, 0.12)"
        : isHighlighted
          ? "0 8px 24px rgba(0, 128, 226, 0.18)"
          : "0 2px 8px rgba(0, 0, 0, 0.06)",
      transform: isHovered ? "translateY(-6px)" : "translateY(0)",
      cursor: "pointer",
    };

    return (
      <Col
        style={{
          padding: "12px",
          display: "flex",
          justifyContent: "center",
        }}
        xs={24} sm={24} md={12} lg={8} xl={6}
      >
        <div
          style={cardStyle}
          onClick={() => (window.location.href = link)}
          onMouseEnter={() => this.setState({hovered: true})}
          onMouseLeave={() => this.setState({hovered: false})}
        >
          {/* Highlight badge */}
          {isHighlighted && (
            <div style={{
              position: "absolute",
              top: "16px",
              right: "16px",
            }}>
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
            <h3 style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#1B1464",
              margin: 0,
            }}>
              {plan.displayName}
            </h3>
          </div>

          {/* Price */}
          <div style={{marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #f0f0f0"}}>
            <span style={{
              fontSize: "44px",
              fontWeight: 800,
              color: "#1B1464",
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}>
              {Setting.getCurrencySymbol(plan.currency)}{plan.price}
            </span>
            <span style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "#8c8c8c",
              marginLeft: "4px",
            }}>
              / {plan.period === "Yearly" ? i18next.t("plan:per year") : i18next.t("plan:per month")}
            </span>
          </div>

          {/* Description */}
          {plan.description && (
            <div style={{
              fontSize: "14px",
              lineHeight: "1.7",
              color: "#595959",
              marginBottom: "24px",
              flex: 1,
            }}>
              {plan.description}
            </div>
          )}

          {/* Features / role options */}
          {(plan.options ?? []).length > 0 && (
            <ul style={{
              listStyleType: "none",
              padding: 0,
              margin: "0 0 28px 0",
              flex: 1,
            }}>
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
                    color: "#01B4B6",
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
                  background: "#1B1464",
                  borderColor: "#1B1464",
                } : {
                  borderColor: "#0080E2",
                  color: "#0080E2",
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
