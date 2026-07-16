"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "../../../context/AppContext";

const SLOTS = ["breakfast", "lunch", "dinner", "snack"];

export default function Tracker() {
  const { t, todayMeals, addMeal } = useApp();
  const [form, setForm] = useState({ name: "", slot: "breakfast", calories: "", protein: "", carbs: "", fat: "" });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.calories) return;
    addMeal({
      name: form.name,
      slot: t[form.slot],
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    });
    setForm({ name: "", slot: "breakfast", calories: "", protein: "", carbs: "", fat: "" });
  };

  return (
    <div className="screen tracker">
      <p className="eyebrow">{t.navTracker}</p>
      <h2 className="tracker__title">{t.addMeal}</h2>

      <form className="meal-form" onSubmit={submit}>
        <input
          className="field"
          placeholder={t.addMeal}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <select className="field" value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })}>
          {SLOTS.map((s) => (
            <option key={s} value={s}>{t[s]}</option>
          ))}
        </select>
        <div className="field-grid">
          <input className="field" type="number" placeholder="kcal" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          <input className="field" type="number" placeholder={`${t.protein}, g`} value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
          <input className="field" type="number" placeholder={`${t.carbs}, g`} value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} />
          <input className="field" type="number" placeholder={`${t.fat}, g`} value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
        </div>
        <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
          <Plus size={16} style={{ verticalAlign: "-3px", marginRight: 4 }} />
          {t.save}
        </button>
      </form>

      <p className="eyebrow" style={{ marginTop: 26 }}>{t.todaysMeals}</p>
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
