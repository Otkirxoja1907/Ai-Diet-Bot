"use client";

import { useRef, useState } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function FoodScannerModal({ onClose, onAdd }) {
  const { t } = useApp();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setPreview(base64);
      setLoading(true);
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "scan failed");
        setResult(data);
      } catch (err) {
        setError(err.message || "Xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet__head">
          <span className="eyebrow">{t.scanFood}</span>
          <button className="icon-toggle" onClick={onClose} aria-label={t.close}>
            <X size={16} />
          </button>
        </div>

        {!preview && (
          <button className="scan-dropzone" onClick={() => fileRef.current?.click()}>
            <Camera size={26} />
            <span>{t.scanFood}</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />

        {preview && <img src={preview} alt="" className="scan-preview" />}

        {loading && (
          <div className="scan-loading">
            <Loader2 size={18} className="spin" />
            <span>{t.scanning}</span>
          </div>
        )}

        {error && <p className="scan-error" style={{ color: "#ff4d4f", textAlign: "center", marginTop: 10 }}>{error}</p>}

        {result && (
          <div className="scan-result">
            <p className="scan-result__name">{result.name}</p>
            <p className="scan-result__confidence numeral">{result.confidence}% {t.confidence}</p>
            <div className="scan-result__macros">
              <span className="numeral">{result.calories} kcal</span>
              <span className="numeral">{result.protein}g {t.protein}</span>
              <span className="numeral">{result.carbs}g {t.carbs}</span>
              <span className="numeral">{result.fat}g {t.fat}</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 14 }}
              onClick={() => onAdd(result)}
            >
              {t.save}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
