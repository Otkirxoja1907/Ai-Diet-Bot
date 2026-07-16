"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp, ShoppingCart } from "lucide-react";
import { useApp } from "../../../context/AppContext";

export default function Menu() {
  const { t, calorieGoal, macroGoals, lang } = useApp();
  const [prefs, setPrefs] = useState("");
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setMenu(null);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calorieGoal,
          proteinGoal: macroGoals.protein,
          carbsGoal: macroGoals.carbs,
          fatGoal: macroGoals.fat,
          preferences: prefs,
          language: lang,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMenu(data.menu);
        if (data.menu?.days?.length) setExpandedDay(0);
      }
    } catch {
      setError(t.menuError);
    } finally {
      setLoading(false);
    }
  };

  const allMeals = menu?.days?.flatMap((d) => d.meals) || [];
  const shoppingList = [...new Set(allMeals.map((m) => m.name))];

  return (
    <div className="screen menu">
      <p className="eyebrow">{t.navMenu}</p>
      <h2 className="menu__title">{t.aiMenuTitle}</h2>
      <p className="menu__desc">{t.aiMenuDesc}</p>

      <div className="menu__prefs card">
        <label className="menu__label">{t.preferences}</label>
        <textarea
          className="menu__textarea field"
          placeholder={t.preferencesPlaceholder}
          rows={3}
          value={prefs}
          onChange={(e) => setPrefs(e.target.value)}
        />
        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 12 }}
          onClick={generate}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 size={16} className="spin" style={{ verticalAlign: "-3px", marginRight: 4 }} />{t.generating}</>
          ) : (
            <><Sparkles size={16} style={{ verticalAlign: "-3px", marginRight: 4 }} />{t.generateMenu}</>
          )}
        </button>
      </div>

      {error && <p className="menu__error">{error}</p>}

      {menu?.days && (
        <div className="menu__result">
          <p className="eyebrow" style={{ marginTop: 8 }}>{t.weeklyMenu}</p>

          {menu.days.map((day, di) => {
            const dayCal = day.meals.reduce((s, m) => s + (m.calories || 0), 0);
            const isOpen = expandedDay === di;
            return (
              <div key={di} className="menu__day card">
                <button
                  className="menu__day-head"
                  onClick={() => setExpandedDay(isOpen ? null : di)}
                >
                  <div>
                    <span className="menu__day-name">{day.day}</span>
                    <span className="numeral menu__day-cal">{dayCal} kcal</span>
                  </div>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isOpen && (
                  <div className="menu__day-meals">
                    {day.meals.map((meal, mi) => (
                      <div key={mi} className="menu__meal">
                        <span className="menu__meal-slot">{meal.slot}</span>
                        <span className="menu__meal-name">{meal.name}</span>
                        <span className="numeral menu__meal-cal">{meal.calories} kcal</span>
                        <span className="numeral menu__meal-macros faint">
                          P{meal.protein}g · C{meal.carbs}g · F{meal.fat}g
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="menu__shopping card">
            <div className="menu__shopping-head">
              <ShoppingCart size={16} color="var(--color-moss)" />
              <span>{t.shoppingList}</span>
            </div>
            <ul className="menu__shopping-list">
              {shoppingList.map((item, i) => (
                <li key={i} className="menu__shopping-item">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
