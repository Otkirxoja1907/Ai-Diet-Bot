"use client";

import { useMemo } from "react";
import { Calendar, TrendingUp, Utensils, Target } from "lucide-react";
import { useApp } from "../../../context/AppContext";

const DAY_NAMES = ["Du", "Se", "Chor", "Pay", "Jum", "Shan", "Yak"];

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getDayLabel(ts) {
  return DAY_NAMES[new Date(ts).getDay() === 0 ? 6 : new Date(ts).getDay() - 1];
}

export default function Report() {
  const { t, meals, calorieGoal, macroGoals } = useApp();

  const weekData = useMemo(() => {
    const now = new Date();
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;

      const dayMeals = meals.filter((m) => m.id >= dayStart && m.id < dayEnd);

      const calories = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
      const protein = dayMeals.reduce((s, m) => s + (m.protein || 0), 0);
      const carbs = dayMeals.reduce((s, m) => s + (m.carbs || 0), 0);
      const fat = dayMeals.reduce((s, m) => s + (m.fat || 0), 0);

      days.push({
        label: getDayLabel(d.getTime()),
        date: d,
        meals: dayMeals.length,
        calories,
        protein,
        carbs,
        fat,
      });
    }

    return days;
  }, [meals]);

  const maxCal = Math.max(...weekData.map((d) => d.calories), calorieGoal);

  const totals = useMemo(() => {
    const active = weekData.filter((d) => d.calories > 0);
    const totalCal = weekData.reduce((s, d) => s + d.calories, 0);
    const totalMeals = weekData.reduce((s, d) => s + d.meals, 0);
    const avgCal = active.length ? Math.round(totalCal / active.length) : 0;
    const avgProtein = active.length ? Math.round(weekData.reduce((s, d) => s + d.protein, 0) / active.length) : 0;
    const avgCarbs = active.length ? Math.round(weekData.reduce((s, d) => s + d.carbs, 0) / active.length) : 0;
    const avgFat = active.length ? Math.round(weekData.reduce((s, d) => s + d.fat, 0) / active.length) : 0;

    const bestDay = [...weekData].filter((d) => d.calories > 0).sort((a, b) => Math.abs(a.calories - calorieGoal) - Math.abs(b.calories - calorieGoal))[0];

    return { totalCal, totalMeals, avgCal, avgProtein, avgCarbs, avgFat, activeDays: active.length, bestDay };
  }, [weekData, calorieGoal]);

  const statCards = [
    { icon: Utensils, label: t.totalMeals, value: totals.totalMeals, sub: "" },
    { icon: TrendingUp, label: t.avgCalories, value: `${totals.avgCal}`, sub: "kcal" },
    { icon: Target, label: t.bestDay, value: totals.bestDay ? totals.bestDay.label : "—", sub: totals.bestDay ? `${totals.bestDay.calories} kcal` : "" },
    { icon: Calendar, label: t.activeDays, value: `${totals.activeDays}/7`, sub: "" },
  ];

  return (
    <div className="screen report">
      <p className="eyebrow">{t.navReport}</p>
      <h2 className="report__title">{t.weeklyReport}</h2>

      <div className="report__stats">
        {statCards.map((s) => (
          <div key={s.label} className="report__stat card">
            <s.icon size={18} color="var(--color-moss)" />
            <span className="numeral report__stat-val">{s.value}</span>
            <span className="report__stat-label">{s.label}</span>
            {s.sub && <span className="numeral report__stat-sub">{s.sub}</span>}
          </div>
        ))}
      </div>

      <div className="report__section">
        <p className="eyebrow">{t.caloriesChart}</p>
        <div className="report__bar-chart">
          {weekData.map((d, i) => {
            const pct = maxCal > 0 ? (d.calories / maxCal) * 100 : 0;
            const goalPct = maxCal > 0 ? (calorieGoal / maxCal) * 100 : 0;
            return (
              <div key={i} className="report__bar-col">
                <span className="numeral report__bar-val">{d.calories > 0 ? d.calories : ""}</span>
                <div className="report__bar-track">
                  <div
                    className={`report__bar-fill ${d.calories > calorieGoal ? "is-over" : ""}`}
                    style={{ height: `${pct}%` }}
                  />
                  <div className="report__bar-goal" style={{ bottom: `${goalPct}%` }} />
                </div>
                <span className="report__bar-day">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="report__section">
        <p className="eyebrow">{t.avgMacros}</p>
        <div className="report__macro-grid">
          {[
            { label: t.protein, val: totals.avgProtein, goal: macroGoals.protein, color: "var(--ring-protein)" },
            { label: t.carbs, val: totals.avgCarbs, goal: macroGoals.carbs, color: "var(--ring-carbs)" },
            { label: t.fat, val: totals.avgFat, goal: macroGoals.fat, color: "var(--ring-fat)" },
          ].map((m) => {
            const pct = m.goal > 0 ? Math.min(100, (m.val / m.goal) * 100) : 0;
            return (
              <div key={m.label} className="report__macro">
                <div className="report__macro-head">
                  <span className="report__macro-dot" style={{ background: m.color }} />
                  <span>{m.label}</span>
                  <span className="numeral">{m.val}g</span>
                </div>
                <div className="report__macro-bar">
                  <div className="report__macro-fill" style={{ width: `${pct}%`, background: m.color }} />
                </div>
                <span className="numeral report__macro-goal faint">{m.goal}g {t.goalLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
