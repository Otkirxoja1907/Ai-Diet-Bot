"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ExternalLink, Clock, Shield } from "lucide-react";
import { useApp } from "../../../context/AppContext";

const TIERS = [
  { key: "free", nameKey: "free", descKey: "tierFreeDesc" },
  { key: "mid", nameKey: "mid", descKey: "tierMidDesc" },
  { key: "ultimed", nameKey: "ultimed", descKey: "tierUltimedDesc" },
  { key: "pro", nameKey: "pro", descKey: "tierProDesc" },
];

const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || "aidiet_test_uz_bot";

export default function Premium() {
  const { t, premiumTier, setPremiumTier, TIER_PRICE } = useApp();
  const [serverTier, setServerTier] = useState(null);
  const [tierExpiry, setTierExpiry] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    try {
      const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
      const userId = tg?.initDataUnsafe?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/premium?userId=${userId}`);
      const data = await res.json();
      if (data.tier) {
        setServerTier(data.tier);
        setTierExpiry(data.tierExpiry);
        setPremiumTier(data.tier);
      }
    } catch (e) {
      console.error("Failed to fetch tier:", e);
    } finally {
      setLoading(false);
    }
  }, [setPremiumTier]);

  useEffect(() => {
    fetchTier();
  }, [fetchTier]);

  const handleBuy = (tierKey) => {
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
    if (tg?.initDataUnsafe?.user?.id) {
      setPremiumTier(tierKey);
      window.open(`https://t.me/${BOT_USERNAME}?start=buy_${tierKey}`, "_blank");
    }
  };

  const activeTier = serverTier || premiumTier;
  const expiryDate = tierExpiry ? new Date(tierExpiry) : null;
  const isExpired = expiryDate && expiryDate < new Date();

  return (
    <div className="screen premium">
      <p className="eyebrow">{t.navPremium}</p>
      <h2 className="premium__title">{t.premiumTitle}</h2>
      <p className="premium__body">{t.premiumBody}</p>

      {activeTier !== "free" && !isExpired && expiryDate && (
        <div className="premium__status">
          <Shield size={16} />
          <span>
            {t[activeTier] || activeTier} — {t.activeUntil}{" "}
            {expiryDate.toLocaleDateString("uz-UZ")}
          </span>
        </div>
      )}

      <div className="tier-list">
        {TIERS.map((tier) => {
          const active = activeTier === tier.key;
          const price = TIER_PRICE[tier.key];
          return (
            <div key={tier.key} className={`tier-card ${active && !isExpired ? "is-active" : ""}`}>
              <div className="tier-card__head">
                <span className="tier-card__name">{t[tier.nameKey]}</span>
                <span className="tier-card__price numeral">
                  {price === 0 ? t.free : `${price.toLocaleString("ru-RU")} UZS`}
                  {price > 0 && <span className="faint">{t.perMonth}</span>}
                </span>
              </div>
              <p className="tier-card__desc">{t[tier.descKey]}</p>

              {active && !isExpired ? (
                <button
                  className="btn btn-ghost"
                  style={{ width: "100%" }}
                  disabled
                >
                  <Check size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                  {t.currentPlan}
                </button>
              ) : tier.key === "free" ? (
                <button
                  className="btn btn-ghost"
                  style={{ width: "100%" }}
                  disabled
                >
                  {t.free}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => handleBuy(tier.key)}
                >
                  <ExternalLink size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                  {t.buyViaTelegram}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="premium__info">
        <Clock size={14} />
        <span>{t.paymentInfo}</span>
      </div>
    </div>
  );
}
