"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../i18n/translations";

const AppContext = createContext(null);

const TIER_LIMITS = { free: 10, mid: 30, ultimed: 60, pro: Infinity };
const TIER_PRICE = { free: 0, mid: 25000, ultimed: 50000, pro: 100000 };

function readStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("uz");
  const [premiumTier, setPremiumTier] = useState("free");
  const [chatUsedToday, setChatUsedToday] = useState(0);
  const [lastResetDate, setLastResetDate] = useState(null);
  const [calorieGoal] = useState(2200);
  const [macroGoals] = useState({ protein: 130, carbs: 260, fat: 70 });
  const [meals, setMeals] = useState([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount (avoids SSR/client mismatch)
  useEffect(() => {
    setTheme(readStorage("aidiet_theme", "light"));
    setLang(readStorage("aidiet_lang", "uz"));
    setPremiumTier(readStorage("aidiet_tier", "free"));
    setChatUsedToday(readStorage("aidiet_chat_used", 0));
    setLastResetDate(readStorage("aidiet_last_reset", null));
    setMeals(readStorage("aidiet_meals", []));
    setWaterGlasses(readStorage("aidiet_water", 0));
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (hydrated) localStorage.setItem("aidiet_theme", JSON.stringify(theme));
  }, [theme, hydrated]);

  useEffect(() => { if (hydrated) localStorage.setItem("aidiet_lang", JSON.stringify(lang)); }, [lang, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("aidiet_tier", JSON.stringify(premiumTier)); }, [premiumTier, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("aidiet_chat_used", JSON.stringify(chatUsedToday)); }, [chatUsedToday, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("aidiet_last_reset", JSON.stringify(lastResetDate));
  }, [lastResetDate, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const today = new Date().toDateString();
    if (lastResetDate !== today) {
      setChatUsedToday(0);
      setLastResetDate(today);
    }
  }, [hydrated, lastResetDate]);
  useEffect(() => { if (hydrated) localStorage.setItem("aidiet_meals", JSON.stringify(meals)); }, [meals, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("aidiet_water", JSON.stringify(waterGlasses)); }, [waterGlasses, hydrated]);

  const t = translations[lang];

  const chatLimit = TIER_LIMITS[premiumTier];
  const chatRemaining = chatLimit === Infinity ? Infinity : Math.max(0, chatLimit - chatUsedToday);

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [meals]);

  const addMeal = (meal) => setMeals((prev) => [{ ...meal, id: Date.now() }, ...prev]);
  const useChatMessage = () => setChatUsedToday((n) => n + 1);

  const value = {
    theme,
    setTheme,
    lang,
    setLang,
    t,
    premiumTier,
    setPremiumTier,
    chatLimit,
    chatRemaining,
    useChatMessage,
    calorieGoal,
    macroGoals,
    meals,
    addMeal,
    totals,
    waterGlasses,
    setWaterGlasses,
    TIER_PRICE,
    lastResetDate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
