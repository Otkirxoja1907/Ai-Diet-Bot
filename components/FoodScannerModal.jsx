"use client";

import { useRef, useState } from "react";
import { X, Camera, Image, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function FoodScannerModal({ onClose, onAdd }) {
  const { t } = useApp();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeImage = async (base64) => {
    setPreview(base64);
    setLoading(true);
    setError(null);
    setResult(null);
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

  const compressImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max = 800;
          let w = img.width, h = img.height;
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

  const handleCamera = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const dataUrl = await compressImage(file);
    analyzeImage(dataUrl);
  };

  const handleGallery = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const dataUrl = await compressImage(file);
    analyzeImage(dataUrl);
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    setLoading(false);
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

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleCamera} />
        <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handleGallery} />

        {!preview && !loading && !error && !result && (
          <div className="scan-choices">
            <button className="scan-choice" onClick={() => cameraRef.current?.click()}>
              <Camera size={24} />
              <span>{t.takePhoto}</span>
            </button>
            <button className="scan-choice" onClick={() => galleryRef.current?.click()}>
              <Image size={24} />
              <span>{t.chooseFromGallery}</span>
            </button>
          </div>
        )}

        {preview && <img src={preview} alt="" className="scan-preview" />}

        {loading && (
          <div className="scan-loading">
            <Loader2 size={20} className="spin" />
            <span>{t.scanning}</span>
          </div>
        )}

        {error && (
          <div className="scan-error-block">
            <p className="scan-error">{error}</p>
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={reset}>
              {t.tryAgain}
            </button>
          </div>
        )}

        {result && (
          <div className="scan-result">
            <p className="scan-result__name">{result.name}</p>
            <p className="scan-result__confidence numeral">{result.confidence}% {t.confidence}</p>
            {result.portion && <p className="scan-result__portion">{result.portion}</p>}
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
            <button
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: 8 }}
              onClick={reset}
            >
              {t.rescan}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
