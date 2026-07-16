"use client";

import { Droplet } from "lucide-react";
import { useApp } from "../../context/AppContext";
import MacroRing from "../../components/MacroRing";

export default function Home() {
  const { t, totals, calorieGoal, macroGoals, todayMeals, waterGlasses, setWaterGlasses } = useApp();
  const remaining = Math.max(0, calorieGoal - totals.calories);

  const ringValues = {
    calories: totals.calories / calorieGoal,
    protein: totals.protein / macroGoals.protein,
    carbs: totals.carbs / macroGoals.carbs,
    fat: totals.fat / macroGoals.fat,
  };

  const macroRows = [
    { key: "protein", label: t.protein, val: totals.protein, goal: macroGoals.protein, color: "var(--ring-protein)" },
    { key: "carbs", label: t.carbs, val: totals.carbs, goal: macroGoals.carbs, color: "var(--ring-carbs)" },
    { key: "fat", label: t.fat, val: totals.fat, goal: macroGoals.fat, color: "var(--ring-fat)" },
  ];

  return (
    <div className="screen home">
      <p className="eyebrow">{t.today}</p>

      <div className="home__ring-block">
        <MacroRing values={ringValues} centerLabel={remaining} centerSub={t.caloriesLeft} />
      </div>

      <div className="macro-rows">
        {macroRows.map((m) => (
          <div className="macro-row" key={m.key}>
            <span className="macro-row__dot" style={{ background: m.color }} />
            <span className="macro-row__label">{m.label}</span>
            <span className="macro-row__val numeral">
              {Math.round(m.val)}<span className="faint">/{m.goal}g</span>
            </span>
          </div>
        ))}
      </div>

      <div className="water-card card">
        <div className="water-card__label">
          <Droplet size={16} color="var(--color-sky)" />
          <span>{t.water}</span>
        </div>
        <div className="water-card__glasses">
          {Array.from({ length: 8 }).map((_, i) => (
            <button
              key={i}
              className={`glass-dot ${i < waterGlasses ? "is-filled" : ""}`}
              onClick={() => setWaterGlasses(i + 1 === waterGlasses ? i : i + 1)}
              aria-label={`${t.glass} ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="section-head">
        <p className="eyebrow">{t.todaysMeals}</p>
      </div>

      {todayMeals.length === 0 ? (
        <p className="empty-note">{t.noMeals}</p>
      ) : (
        <ul className="meal-list">
          {todayMeals.map((m) => (
            <li key={m.id} className="meal-list__item">
              <div>
                <p className="meal-list__name">{m.name}</p>
                <p className="meal-list__meta">{m.slot}</p>
              </div>
              <span className="numeral meal-list__cal">{m.calories} kcal</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
