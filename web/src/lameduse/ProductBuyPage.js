// lameduse/ProductBuyPage.js
// ===========================
// Custom Lameduse ProductBuyPage UI.
// This file lives outside the upstream Casdoor tree so that
// upstream merges never touch it.  The original casdoor
// ProductBuyPage.js is kept intact for reference / fallback.
//
// Imported in place of the original by ManagementPage, EntryPage,
// and ProductEditPage via the re-export barrel at lameduse/index.js.

import React from "react";
import {Button, Divider, InputNumber, Radio, Space, Spin, Tag, Typography} from "antd";
import {CheckCircleFilled, ShoppingCartOutlined, TagOutlined} from "@ant-design/icons";
import i18next from "i18next";
import * as ProductBackend from "../backend/ProductBackend";
import * as PlanBackend from "../backend/PlanBackend";
import * as PricingBackend from "../backend/PricingBackend";
import * as OrderBackend from "../backend/OrderBackend";
import * as UserBackend from "../backend/UserBackend";
import * as Setting from "../Setting";
import {Colors, headerGradient, outlinedButton, pageBackground, primaryButton, sectionCard} from "../LameduseTheme";
import {FloatingCartButton, QuantityStepper} from "../common/product/CartControls";

class ProductBuyPage extends React.Component {
  constructor(props) {
    super(props);
    const params = new URLSearchParams(window.location.search);
    this.state = {
      classes: props,
      owner: props?.organizationName ?? props?.match?.params?.organizationName ?? props?.match?.params?.owner ?? null,
      productName: props?.productName ?? props?.match?.params?.productName ?? null,
      pricingName: props?.pricingName ?? props?.match?.params?.pricingName ?? null,
      planName: params.get("plan"),
      userName: params.get("user"),
      paymentEnv: "",
      product: null,
      pricing: props?.pricing ?? null,
      plan: null,
      isPlacingOrder: false,
      isAddingToCart: false,
      customPrice: 100,
      buyQuantity: params.get("quantity") ? parseInt(params.get("quantity"), 10) : 1,
      cartItemCount: 0,
    };
  }

  getPaymentEnv() {
    let env = "";
    const ua = navigator.userAgent.toLocaleLowerCase();
    if (ua.indexOf("micromessenger") !== -1 && ua.indexOf("mobile") !== -1) {
      env = "WechatBrowser";
    }
    this.setState({paymentEnv: env});
  }

  UNSAFE_componentWillMount() {
    this.getProduct();
    this.getPaymentEnv();
    this.getCartItemCount();
  }

  getCartItemCount() {
    if (!this.props.account) {
      return;
    }
    const userOwner = this.props.account.owner;
    const userName = this.props.account.name;
    UserBackend.getUser(userOwner, userName).then((res) => {
      if (res.status === "ok" && res.data.cart) {
        this.setState({cartItemCount: res.data.cart.length});
      }
    });
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, () => resolve());
    });
  }

  onUpdatePricing(pricing) {
    this.props.onUpdatePricing(pricing);
  }

  async getProduct() {
    if (!this.state.owner || (!this.state.productName && !this.state.pricingName)) {
      return;
    }
    try {
      if (this.state.pricingName) {
        if (!this.state.planName || !this.state.userName) {
          return;
        }
        let res = await PricingBackend.getPricing(this.state.owner, this.state.pricingName);
        if (res.status !== "ok") {
          throw new Error(res.msg);
        }
        const pricing = res.data;
        res = await PlanBackend.getPlan(this.state.owner, this.state.planName);
        if (res.status !== "ok") {
          throw new Error(res.msg);
        }
        const plan = res.data;
        await this.setStateAsync({pricing, plan, productName: plan.product});
        this.onUpdatePricing(pricing);
      }
      const res = await ProductBackend.getProduct(this.state.owner, this.state.productName);
      if (res.status !== "ok") {
        throw new Error(res.msg);
      }
      this.setState({product: res.data});
      if (res.data.isRecharge) {
        this.setState({
          customPrice: res.data.rechargeOptions?.length > 0 ? res.data.rechargeOptions[0] : 100,
        });
      }
    } catch (err) {
      Setting.showMessage("error", err.message);
    }
  }

  getProductObj() {
    return this.props.product !== undefined ? this.props.product : this.state.product;
  }

  getPrice(product) {
    return `${Setting.getCurrencySymbol(product?.currency)}${product?.price} (${Setting.getCurrencyText(product?.currency)})`;
  }

  addToCart(product) {
    if (this.state.isAddingToCart) {
      return;
    }
    this.setState({isAddingToCart: true});
    const userOwner = this.props.account.owner;
    const userName = this.props.account.name;
    UserBackend.getUser(userOwner, userName)
      .then((res) => {
        if (res.status === "ok") {
          const user = res.data;
          const cart = user.cart || [];
          let actualPrice = product.price;
          if (product.isRecharge) {
            actualPrice = this.state.customPrice;
            if (actualPrice <= 0) {
              Setting.showMessage("error", i18next.t("product:Custom price should be greater than zero"));
              this.setState({isAddingToCart: false});
              return;
            }
          }
          const pricingName = this.state.pricingName || "";
          const planName = this.state.planName || "";
          if (cart.length > 0) {
            const firstItem = cart[0];
            if (firstItem.currency && product.currency && firstItem.currency !== product.currency) {
              Setting.showMessage("error", i18next.t("product:The currency of the product you are adding is different from the currency of the items in the cart"));
              this.setState({isAddingToCart: false});
              return;
            }
          }
          const cartPrice = product.isRecharge ? actualPrice : null;
          const existingItemIndex = cart.findIndex(item =>
            item.name === product.name &&
            (product.isRecharge ? item.price === actualPrice : true) &&
            (item.pricingName || "") === pricingName &&
            (item.planName || "") === planName
          );
          const quantityToAdd = this.state.buyQuantity;
          if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity ?? 1) + quantityToAdd;
          } else {
            cart.push({
              name: product.name,
              price: cartPrice,
              currency: product.currency,
              pricingName,
              planName,
              quantity: quantityToAdd,
            });
          }
          user.cart = cart;
          UserBackend.updateUser(user.owner, user.name, user)
            .then((res) => {
              if (res.status === "ok") {
                Setting.showMessage("success", i18next.t("general:Successfully added"));
                this.setState({cartItemCount: cart.length});
              } else {
                Setting.showMessage("error", res.msg);
              }
            })
            .catch((error) => {
              Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
            })
            .finally(() => {
              this.setState({isAddingToCart: false});
            });
        } else {
          Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${res.msg}`);
          this.setState({isAddingToCart: false});
        }
      })
      .catch((error) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
        this.setState({isAddingToCart: false});
      });
  }

  placeOrder(product) {
    this.setState({isPlacingOrder: true});
    const pricingName = this.state.pricingName || "";
    const planName = this.state.planName || "";
    const customPrice = this.state.customPrice || 0;
    const productInfos = [{
      name: product.name,
      price: product.isRecharge ? customPrice : product.price,
      pricingName,
      planName,
      quantity: this.state.buyQuantity,
    }];
    OrderBackend.placeOrder(product.owner, productInfos, this.state.userName ?? "")
      .then((res) => {
        if (res.status === "ok") {
          const order = res.data;
          Setting.showMessage("success", i18next.t("product:Order created successfully"));
          Setting.goToLink(`/orders/${order.owner}/${order.name}/pay`);
        } else {
          Setting.showMessage("error", `${i18next.t("product:Failed to create order")}: ${res.msg}`);
          this.setState({isPlacingOrder: false});
        }
      })
      .catch(error => {
        Setting.showMessage("error", `${i18next.t("general:Failed to connect to server")}: ${error}`);
        this.setState({isPlacingOrder: false});
      });
  }

  renderRechargeInput(product) {
    const hasOptions = product.rechargeOptions && product.rechargeOptions.length > 0;
    const disableCustom = product.disableCustomRecharge;

    if (!hasOptions && disableCustom) {
      return (
        <Typography.Text type="danger">
          {i18next.t("product:This product is currently not purchasable (No options available)")}
        </Typography.Text>
      );
    }

    return (
      <Space direction="vertical" style={{width: "100%"}}>
        {hasOptions && (
          <>
            <div>
              <span style={{marginRight: "10px", fontSize: 16}}>
                {i18next.t("product:Select amount")}:
              </span>
              <Radio.Group
                value={this.state.customPrice}
                onChange={(e) => this.setState({customPrice: e.target.value})}
              >
                <Space wrap>
                  {product.rechargeOptions.map((amount, index) => (
                    <Radio.Button key={index} value={amount}>
                      {Setting.getCurrencySymbol(product.currency)}{amount}
                    </Radio.Button>
                  ))}
                </Space>
              </Radio.Group>
            </div>
            {!disableCustom && <Divider style={{margin: "10px 0"}}>{i18next.t("general:Or")}</Divider>}
          </>
        )}
        <Space>
          <span style={{fontSize: 16}}>{i18next.t("product:Amount")}:</span>
          <InputNumber
            min={0}
            value={this.state.customPrice}
            onChange={(e) => this.setState({customPrice: e})}
            disabled={disableCustom}
          />
          <span style={{fontSize: 16}}>{Setting.getCurrencyText(product?.currency)}</span>
        </Space>
      </Space>
    );
  }

  renderPlaceOrderButton(product) {
    if (product === undefined || product === null) {
      return null;
    }

    if (product.state !== "Published") {
      return (
        <Tag color="warning" style={{fontSize: "14px", padding: "6px 16px", borderRadius: "8px"}}>
          {i18next.t("product:This product is currently not in sale.")}
        </Tag>
      );
    }

    const hasOptions = product.rechargeOptions && product.rechargeOptions.length > 0;
    const disableCustom = product.disableCustomRecharge;
    const isRechargeUnpurchasable = product.isRecharge && !hasOptions && disableCustom;
    const isAmountZero = product.isRecharge && (this.state.customPrice === 0 || this.state.customPrice === null);
    const isDisabled = isRechargeUnpurchasable || isAmountZero;

    return (
      <div style={{display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap"}}>
        <QuantityStepper
          value={this.state.buyQuantity}
          min={1}
          onIncrease={() => this.setState(prevState => ({buyQuantity: prevState.buyQuantity + 1}))}
          onDecrease={() => this.setState(prevState => ({buyQuantity: Math.max(1, prevState.buyQuantity - 1)}))}
          onChange={(val) => this.setState({buyQuantity: val || 1})}
          disabled={isDisabled || this.state.isAddingToCart}
          style={{height: "48px", fontSize: "16px", width: "130px"}}
        />
        <Button
          size="large"
          icon={<ShoppingCartOutlined />}
          style={{height: "48px", fontSize: "15px", paddingLeft: "28px", paddingRight: "28px", ...outlinedButton}}
          onClick={() => this.addToCart(product)}
          disabled={isDisabled || this.state.isAddingToCart}
          loading={this.state.isAddingToCart}
        >
          {i18next.t("product:Add to cart")}
        </Button>
        <Button
          type="primary"
          size="large"
          style={{height: "48px", fontSize: "15px", paddingLeft: "36px", paddingRight: "36px", ...primaryButton}}
          onClick={() => this.placeOrder(product)}
          disabled={this.state.isPlacingOrder || isDisabled}
          loading={this.state.isPlacingOrder}
        >
          {i18next.t("general:Place Order")}
        </Button>
      </div>
    );
  }

  render() {
    const product = this.getProductObj();
    const placeOrderButton = this.renderPlaceOrderButton(product);

    if (product === null) {
      return null;
    }

    const isMobile = Setting.isMobile();

    return (
      <div style={{
        ...pageBackground,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: isMobile ? "24px 16px" : "48px 24px",
      }}>
        <FloatingCartButton
          itemCount={this.state.cartItemCount}
          onClick={() => this.props.history.push("/cart")}
        />
        <Spin spinning={this.state.isPlacingOrder} size="large" tip={i18next.t("product:Placing order...")} style={{width: "100%", maxWidth: "900px"}}>
          <div style={{
            background: "#fff",
            borderRadius: "20px",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
            overflow: "hidden",
            maxWidth: "900px",
            width: "100%",
            margin: "0 auto",
          }}>
            {/* Header */}
            <div style={{...headerGradient, padding: isMobile ? "28px 20px" : "36px 40px"}}>
              <h1 style={{fontSize: isMobile ? "22px" : "28px", fontWeight: 700, margin: 0, color: "#fff"}}>
                {i18next.t("product:Buy Product")}
              </h1>
            </div>

            {/* Body */}
            <div style={{padding: isMobile ? "24px 20px" : "36px 40px"}}>
              {/* Product image + name row */}
              <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "28px",
                alignItems: isMobile ? "center" : "flex-start",
                marginBottom: "32px",
              }}>
                {product?.image && (
                  <div style={{
                    width: isMobile ? "100%" : "180px",
                    height: "180px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid #f0f0f0",
                    background: "#fafafa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{maxWidth: "100%", maxHeight: "100%", objectFit: "contain"}}
                    />
                  </div>
                )}
                <div style={{flex: 1}}>
                  <h2 style={{fontSize: isMobile ? "22px" : "26px", fontWeight: 700, color: Colors.textDark, margin: "0 0 8px 0"}}>
                    {Setting.getLanguageText(product?.displayName)}
                  </h2>
                  <p style={{fontSize: "14px", color: Colors.textMuted, margin: "0 0 4px 0", fontFamily: "monospace"}}>
                    SKU: {product?.name}
                  </p>
                  {product?.tag && (
                    <Tag icon={<TagOutlined />} color="processing" style={{marginTop: "8px", borderRadius: "8px", padding: "2px 12px"}}>
                      {product.tag}
                    </Tag>
                  )}
                  {product?.detail && (
                    <p style={{fontSize: "15px", color: Colors.textBody, lineHeight: "1.7", marginTop: "16px", marginBottom: 0}}>
                      {Setting.getLanguageText(product.detail)}
                    </p>
                  )}
                </div>
              </div>

              <Divider style={{margin: "0 0 28px 0"}} />

              {/* Price section */}
              <div style={{...sectionCard, marginBottom: "28px"}}>
                {product.isRecharge ? (
                  <div>
                    <div style={{fontSize: "14px", fontWeight: 600, color: Colors.textDark, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px"}}>
                      {i18next.t("order:Price")}
                    </div>
                    {this.renderRechargeInput(product)}
                  </div>
                ) : (
                  <div style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: "16px",
                  }}>
                    <div>
                      <div style={{fontSize: "14px", fontWeight: 600, color: Colors.textDark, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px"}}>
                        {i18next.t("order:Price")}
                      </div>
                      <span style={{fontSize: "36px", fontWeight: 800, color: Colors.secondary, letterSpacing: "-1px"}}>
                        {Setting.getCurrencySymbol(product?.currency)}{product?.price}
                      </span>
                      <span style={{fontSize: "14px", color: Colors.textLight, marginLeft: "6px"}}>
                        {Setting.getCurrencyText(product?.currency)}
                      </span>
                    </div>
                    <div style={{display: "flex", gap: "24px"}}>
                      {product?.quantity !== undefined && (
                        <div style={{textAlign: "center"}}>
                          <div style={{fontSize: "12px", color: Colors.textLight, marginBottom: "4px"}}>{i18next.t("product:Quantity")}</div>
                          <div style={{fontSize: "18px", fontWeight: 600, color: Colors.textDark}}>{product.quantity}</div>
                        </div>
                      )}
                      {product?.sold !== undefined && (
                        <div style={{textAlign: "center"}}>
                          <div style={{fontSize: "12px", color: Colors.textLight, marginBottom: "4px"}}>{i18next.t("product:Sold")}</div>
                          <div style={{fontSize: "18px", fontWeight: 600, color: Colors.tertiary}}>{product.sold}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Plan info (if buying via pricing) */}
              {this.state.plan && (
                <div style={{
                  border: `1px solid ${Colors.borderLight}`,
                  borderRadius: "14px",
                  padding: "20px 28px",
                  marginBottom: "28px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}>
                  <CheckCircleFilled style={{color: Colors.tertiary, fontSize: "20px"}} />
                  <div>
                    <div style={{fontSize: "13px", color: Colors.textLight}}>{i18next.t("plan:Selected plan")}</div>
                    <div style={{fontSize: "16px", fontWeight: 600, color: Colors.textDark}}>{this.state.plan.displayName}</div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{display: "flex", justifyContent: "center", padding: "8px 0"}}>
                {placeOrderButton}
              </div>
            </div>
          </div>
        </Spin>
      </div>
    );
  }
}

export default ProductBuyPage;
