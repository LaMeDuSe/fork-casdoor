import * as React from "react";
import i18next from "i18next";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {CircleCheck} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Loading} from "@/components/common/Loading";
import {useAccount} from "@/hooks/use-account";
import * as PlanBackend from "@/backend/PlanBackend";
import * as PricingBackend from "@/backend/PricingBackend";
import * as Setting from "@/lib/setting";
import {cn} from "@/lib/utils";

// LaMeDuSe plan card: rounded card with a hover lift, the feature list with check marks, and the
// plan highlighted (accent border, filled button) when it is the only one offered for the period
function PlanCard({plan, link, highlighted}: {plan: any; link: string; highlighted?: boolean}) {
  const navigate = useNavigate();
  const options: string[] = plan.options ?? [];

  return (
    <Card
      className={cn(
        "group flex w-full min-w-[280px] max-w-[360px] cursor-pointer flex-col rounded-2xl text-left transition-all duration-300",
        "hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-12px_rgb(27_20_100_/_0.25)]",
        highlighted && "border-2 border-primary shadow-[0_8px_24px_-8px_hsl(var(--primary)_/_0.35)]",
      )}
      onClick={() => navigate(link)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-[22px] font-bold">{plan.displayName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="border-b pb-5">
          <span className="text-[44px] font-extrabold leading-none tracking-tight">
            {Setting.getCurrencySymbol(plan.currency)}{plan.price}
          </span>
          <span className="ml-1 text-[15px] font-medium text-muted-foreground">
            / {plan.period === "Yearly" ? i18next.t("plan:per year") : i18next.t("plan:per month")}
          </span>
        </div>
        {plan.description ? <p className="text-sm leading-relaxed text-muted-foreground">{plan.description}</p> : null}
        {options.length > 0 ? (
          <ul className="flex flex-1 flex-col gap-3 text-sm">
            {options.map((option, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-[#01B4B6]" />
                <span>{option}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <Button
          className="mt-auto h-12 w-full rounded-xl text-[15px] font-semibold"
          variant={highlighted ? "default" : "outline"}
          onClick={(e) => {
            e.stopPropagation();
            navigate(link);
          }}
        >
          {i18next.t("pricing:Getting started")}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * The public plan picker at /select-plan/:owner/:pricingName. Ported from
 * web/src/pricing/PricingPage.js — a signed-in visitor goes to /buy-plan, an
 * anonymous one to the application's sign-up page carrying plan and pricing.
 */
interface PricingPageProps {
  /**
   * The pricing to render. The edit page passes the object it is editing so the
   * page previews unsaved changes; on its own route it is loaded from the URL.
   */
  pricing?: any;
  owner?: string;
  /** the edit page embeds it inside its form, so it should not fill the viewport */
  embedded?: boolean;
}

export default function PricingPage({pricing: pricingProp, owner: ownerProp, embedded}: PricingPageProps = {}) {
  const params = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const {account} = useAccount();

  const owner = ownerProp ?? params.owner ?? "";
  const pricingName = params.pricingName ?? "";
  const userName = search.get("user");

  const [pricing, setPricing] = React.useState<any>(pricingProp ?? null);
  const [plans, setPlans] = React.useState<any[] | null>(null);
  const [periods, setPeriods] = React.useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (userName) {
      Setting.showMessage("info", i18next.t("pricing:paid-user do not have active subscription or pending subscription, please select a plan to buy"));
    }
    // only on mount, as in the antd page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (pricingProp) {
      setPricing(pricingProp);
      return;
    }
    if (!owner || !pricingName) {
      return;
    }
    PricingBackend.getPricing(owner, pricingName).then((res: any) => {
      if (res.status === "error") {
        Setting.showMessage("error", res.msg);
        return;
      }
      setPricing(res.data);
    });
  }, [owner, pricingName, pricingProp]);

  React.useEffect(() => {
    if (pricing === null) {
      return;
    }
    Promise.all((pricing.plans ?? []).map((plan: string) => PlanBackend.getPlan(owner, plan, true)))
      .then((results: any[]) => {
        if (results.some((result) => result.status === "error")) {
          Setting.showMessage("error", i18next.t("general:Failed to get"));
          return;
        }
        const loaded = results.map((result) => result.data);
        const loadedPeriods = [...new Set(loaded.map((plan: any) => plan.period).filter((period: string) => period !== ""))] as string[];
        setPlans(loaded);
        setPeriods(loadedPeriods);
        setSelectedPeriod(loadedPeriods[0]);
      })
      .catch((error: any) => {
        Setting.showMessage("error", `${i18next.t("general:Failed to get")}: ${error}`);
      });
  }, [pricing, owner]);

  if (pricing === null || plans === null) {
    return <Loading className={embedded ? "py-10" : "min-h-screen"} />;
  }

  const getUrlByPlan = (planName: string) => {
    if (account) {
      const buyer = userName || account.name;
      return `/buy-plan/${pricing.owner}/${pricing.name}?plan=${planName}${buyer ? `&user=${buyer}` : ""}`;
    }
    return `/signup/${pricing.application}?plan=${planName}&pricing=${pricing.name}`;
  };

  return (
    <div className={embedded ? "w-full text-center" : "mx-auto max-w-6xl px-4 py-12 text-center"}>
      <h1 className={embedded ? "mb-2 text-2xl font-bold" : "mb-4 text-5xl font-bold"}>{pricing.displayName}</h1>
      <p className={embedded ? "text-muted-foreground" : "text-xl text-muted-foreground"}>{pricing.description}</p>

      {periods.length > 1 ? (
        <div className="mt-10 flex justify-center gap-2">
          {periods.map((period) => (
            <Button
              key={period}
              size="lg"
              variant={selectedPeriod === period ? "default" : "outline"}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap justify-center gap-6">
        {(() => {
          const periodPlans = plans.filter((plan: any) => plan.period === selectedPeriod);
          return periodPlans.map((plan: any) => (
            <PlanCard key={plan.name} plan={plan} link={getUrlByPlan(plan.name)} highlighted={periodPlans.length === 1} />
          ));
        })()}
      </div>

      {pricing.trialDuration > 0 ? (
        <p className="mt-8 italic text-muted-foreground">
          {i18next.t("pricing:Free")} {pricing.trialDuration}-{i18next.t("pricing:days trial available!")}
        </p>
      ) : null}

      <div className="mt-8">
        <Button variant="ghost" onClick={() => navigate("/")}>{i18next.t("general:Back Home")}</Button>
      </div>
    </div>
  );
}
