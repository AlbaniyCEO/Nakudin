import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "ha";

const strings = {
  en: {
    home: "Home",
    explore: "Explore",
    shops: "Shops",
    dashboard: "Dashboard",
    profile: "Profile",
    forYou: "For You",
    noProducts: "No products yet. Be the first to list!",
    settings: "Settings",
    subscriptionBilling: "Subscription & Billing",
    manageYourPlan: "Manage your plan",
    editShopProfile: "Edit Shop Profile",
    changeNameBioLogo: "Change name, bio, logo",
    signOut: "Sign Out",
    language: "Language",
    english: "English",
    hausa: "Hausa",
    subscription: "Subscription",
    currentStatus: "Current Status",
    choosePlan: "Choose a Plan",
    paymentHistory: "Payment History",
    noPaymentsYet: "No payments yet.",
    selectPlan: "Select",
    bestValue: "Best Value",
    recommended: "Recommended",
    trialNote: "60-day free trial — no payment needed to start. After trial ends, you have a 7-day grace period before your shop locks.",
    gracePeriodNote: "Grace period: 7 days to subscribe before your shop is locked.",
    lockedNote: "Your shop is locked. Subscribe to restore access.",
    connecting: "Connecting…",
    paystackKeyMissing: "Payment system not yet configured. Contact support.",
  },
  ha: {
    home: "Gida",
    explore: "Bincike",
    shops: "Shaguna",
    dashboard: "Allon Aiki",
    profile: "Bayani",
    forYou: "Domin Ka",
    noProducts: "Babu kaya tukuna. Ka fara jera!",
    settings: "Saiti",
    subscriptionBilling: "Biyan Kuɗi",
    manageYourPlan: "Sarrafa shirina",
    editShopProfile: "Gyara Bayanan Shago",
    changeNameBioLogo: "Canza suna, tarihi, alama",
    signOut: "Fita",
    language: "Harshe",
    english: "Turanci",
    hausa: "Hausa",
    subscription: "Biyan Kuɗi",
    currentStatus: "Matsayin Yanzu",
    choosePlan: "Zaɓi Shiri",
    paymentHistory: "Tarihin Biyan Kuɗi",
    noPaymentsYet: "Babu biyan kuɗi tukuna.",
    selectPlan: "Zaɓa",
    bestValue: "Mafi Daraja",
    recommended: "An Ba da Shawarar",
    trialNote: "Gwaji kyauta kwana 60 — ba a buƙatar biyan kuɗi don farawa. Bayan gwajin ya ƙare, kuna da kwana 7 na alheri kafin a kulle kantin ku.",
    gracePeriodNote: "Lokacin alheri: kwana 7 don biyan kuɗi kafin a kulle kantin ku.",
    lockedNote: "An kulle kantin ku. Yi biyan kuɗi don dawo da damar shiga.",
    connecting: "Ana haɗawa…",
    paystackKeyMissing: "Ba'a kafa tsarin biyan kuɗi ba. Tuntubi tallafi.",
  },
} as const;

export type TranslationKey = keyof typeof strings.en;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("nakudin_lang") as Lang) || "en"
  );

  const setLang = (l: Lang) => {
    localStorage.setItem("nakudin_lang", l);
    setLangState(l);
  };

  const t = (key: TranslationKey): string => strings[lang][key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nCtx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
