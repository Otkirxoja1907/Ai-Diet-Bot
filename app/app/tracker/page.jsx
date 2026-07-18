"use client";

import { useRef, useState } from "react";
import { Plus, ImagePlus, X, Loader2, Flame, Beef, Wheat, Droplets, CheckCircle2, RefreshCw } from "lucide-react";
import { useApp } from "../../../context/AppContext";

const SLOTS = ["breakfast", "lunch", "dinner", "snack"];

export default function Tracker() {
  const { t, todayMeals, addMeal } = useApp();

  // Manual form
  const [form, setForm] = useState({
    name: "",
    slot: "breakfast",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  // AI Scan holati
  const galleryRef = useRef(null);
  const [scanImage, setScanImage] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanSlot, setScanSlot] = useState("lunch");
  const [saved, setSaved] = useState(false);

  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max = 800;
          let w = img.width;
          let h = img.height;
          if (w > max || h > max) {
            if (w > h) { h = Math.round((h * max) / w); w = max; }
            else { w = Math.round((w * max) / h); h = max; }
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const dataUrl = await compressImage(file);
    setScanImage(dataUrl);
    setScanResult(null);
    setScanError(null);
    setSaved(false);
    analyzeImage(dataUrl);
  };

  const analyzeImage = async (dataUrl) => {
    setScanLoading(true);
    setScanError(null);
    setScanResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tahlil xatoligi");
      setScanResult(data);
    } catch (err) {
      setScanError(err.message || "Rasmni tahlil qilishda xatolik");
    } finally {
      setScanLoading(false);
    }
  };

  // AI natijasini saqlash
  const saveScanResult = () => {
    if (!scanResult) return;
    addMeal({
      name: scanResult.name,
      slot: t[scanSlot],
      calories: scanResult.calories,
      protein: scanResult.protein,
      carbs: scanResult.carbs,
      fat: scanResult.fat,
    });
    setSaved(true);
    setTimeout(() => {
      setScanImage(null);
      setScanResult(null);
      setSaved(false);
      setScanSlot("lunch");
    }, 1500);
  };

  const resetScan = () => {
    setScanImage(null);
    setScanResult(null);
    setScanError(null);
    setSaved(false);
  };

  // Manual form submit
  const submitManual = (e) => {
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

      {/* ── AI Scan qismi ── */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageSelect}
      />

      {/* Rasm tanlanmagan — tugma ko'rsat */}
      {!scanImage && (
        <button
          type="button"
          className="scan-cta"
          onClick={() => galleryRef.current?.click()}
        >
          <ImagePlus size={18} />
          <span>📷 Rasm orqali tahlil qil</span>
        </button>
      )}

      {/* Rasm tanlangan — preview + natija */}
      {scanImage && (
        <div className="ai-scan-card">
          {/* Rasm */}
          <div className="ai-scan-card__img-wrap">
            <img src={scanImage} alt="tahlil rasmi" className="ai-scan-card__img" />
            <button
              className="ai-scan-card__close"
              onClick={resetScan}
              aria-label="Yopish"
            >
              <X size={14} />
            </button>
          </div>

          {/* Yuklash */}
          {scanLoading && (
            <div className="ai-scan-card__loading">
              <Loader2 size={20} className="spin" />
              <span>AI tahlil qilmoqda...</span>
            </div>
          )}

          {/* Xato */}
          {scanError && (
            <div className="ai-scan-card__error">
              <p>⚠️ {scanError}</p>
              <button
                className="btn btn-ghost"
                style={{ marginTop: 8, width: "100%" }}
                onClick={() => analyzeImage(scanImage)}
              >
                <RefreshCw size={14} style={{ marginRight: 6 }} />
                Qaytadan urinish
              </button>
            </div>
          )}

          {/* Natija */}
          {scanResult && !saved && (
            <div className="ai-scan-card__result">
              <p className="ai-scan-card__name">{scanResult.name}</p>
              {scanResult.portion && (
                <p className="ai-scan-card__portion">{scanResult.portion}</p>
              )}

              {/* Makro kartalar */}
              <div className="ai-scan-card__macros">
                <div className="macro-chip macro-chip--cal">
                  <Flame size={14} />
                  <span className="macro-chip__val">{scanResult.calories}</span>
                  <span className="macro-chip__lbl">kcal</span>
                </div>
                <div className="macro-chip macro-chip--protein">
                  <Beef size={14} />
                  <span className="macro-chip__val">{scanResult.protein}g</span>
                  <span className="macro-chip__lbl">Oqsil</span>
                </div>
                <div className="macro-chip macro-chip--carbs">
                  <Wheat size={14} />
                  <span className="macro-chip__val">{scanResult.carbs}g</span>
                  <span className="macro-chip__lbl">Uglevod</span>
                </div>
                <div className="macro-chip macro-chip--fat">
                  <Droplets size={14} />
                  <span className="macro-chip__val">{scanResult.fat}g</span>
                  <span className="macro-chip__lbl">Yog'</span>
                </div>
              </div>

              {/* Ishonch darajasi */}
              <div className="ai-scan-card__confidence">
                <div
                  className="ai-scan-card__confidence-bar"
                  style={{ width: `${scanResult.confidence}%` }}
                />
                <span>{scanResult.confidence}% aniqlik</span>
              </div>

              {/* Vaqt tanlash */}
              <select
                className="field"
                value={scanSlot}
                onChange={(e) => setScanSlot(e.target.value)}
                style={{ marginBottom: 10 }}
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>{t[s]}</option>
                ))}
              </select>

              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={saveScanResult}
              >
                <Plus size={16} style={{ marginRight: 4 }} />
                Kunlikka qo'shish
              </button>
            </div>
          )}

          {/* Saqlandi */}
          {saved && (
            <div className="ai-scan-card__saved">
              <CheckCircle2 size={28} />
              <p>Saqlandi!</p>
            </div>
          )}
        </div>
      )}

      {/* ── Manual qo'shish ── */}
      <p className="eyebrow" style={{ margin: "22px 0 10px" }}>Qo'lda qo'shish</p>
      <form className="meal-form" onSubmit={submitManual}>
        <input
          className="field"
          placeholder={t.addMeal}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <select
          className="field"
          value={form.slot}
          onChange={(e) => setForm({ ...form, slot: e.target.value })}
        >
          {SLOTS.map((s) => (
            <option key={s} value={s}>{t[s]}</option>
          ))}
        </select>
        <div className="field-grid">
          <input className="field" type="number" placeholder="kcal"
            value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          <input className="field" type="number" placeholder={`${t.protein}, g`}
            value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} />
          <input className="field" type="number" placeholder={`${t.carbs}, g`}
            value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} />
          <input className="field" type="number" placeholder={`${t.fat}, g`}
            value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
        </div>
        <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
          <Plus size={16} style={{ verticalAlign: "-3px", marginRight: 4 }} />
          {t.save}
        </button>
      </form>

      {/* ── Bugungi taomlar ── */}
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
