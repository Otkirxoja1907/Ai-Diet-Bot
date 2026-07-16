"use client";

import { useRef, useState } from "react";
import { X, Camera, Image, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function FoodScannerModal({ onClose, onAdd }) {
  const { t } = useApp();
  const fileRef = useRef(null);
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

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => analyzeImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      await new Promise((r) => setTimeout(r, 300));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      const base64 = canvas.toDataURL("image/jpeg", 0.85);
      analyzeImage(base64);
    } catch {
      fileRef.current?.click();
    }
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
          <div className="scan-choices">
            <button className="scan-choice" onClick={openCamera}>
              <Camera size={24} />
              <span>{t.takePhoto}</span>
            </button>
            <button className="scan-choice" onClick={() => fileRef.current?.click()}>
              <Image size={24} />
              <span>{t.chooseFromGallery}</span>
            </button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />

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
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => { setPreview(null); setError(null); }}>
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
              onClick={() => { setPreview(null); setResult(null); setError(null); }}
            >
              {t.rescan}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
