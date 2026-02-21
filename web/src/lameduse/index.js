// lameduse/index.js
// ==================
// Barrel re-export for Lameduse custom page overrides.
//
// Consumer files (ManagementPage, EntryPage, PricingEditPage,
// ProductEditPage) import from here instead of from the original
// Casdoor files.  This keeps all wiring in one place so that
// adding or removing an override only requires editing this file
// and the consumer import line.

export {default as ProductBuyPage} from "./ProductBuyPage";
export {default as PricingPage} from "./PricingPage";
export {default as SingleCard} from "./SingleCard";
export {default as LoginPage} from "./LoginPage";
export {default as SignupPage} from "./SignupPage";
export {default as SelfLoginPage} from "./SelfLoginPage";
