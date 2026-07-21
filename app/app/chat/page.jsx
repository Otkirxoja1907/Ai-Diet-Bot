"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, ImagePlus, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";

const WELCOME_KEY = "aidiet_chat_welcome_shown";

export default function Chat() {
  const { t, lang, chatRemaining, useChatMessage, chatMessages, setChatMessages, clearChatMessages } = useApp();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const endRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, sending]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleClear = () => {
    clearChatMessages();
  };

  const send = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || sending || chatRemaining <= 0) return;

    const userMsg = {
      role: "user",
      text: input.trim() || "Rasm yuborildi",
      image: imagePreview || null,
    };
    setChatMessages((m) => [...m, userMsg]);

    const msgText = input.trim();
    const msgImage = selectedImage;

    setInput("");
    setSelectedImage(null);
    setImagePreview(null);
    setSending(true);
    useChatMessage();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgText || undefined,
          image: msgImage || undefined,
          language: lang,
        }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (data.error) {
        setChatMessages((m) => [...m, { role: "ai", text: t.chatError || "Xatolik yuz berdi. Qaytadan urinib ko'ring." }]);
      } else {
        setChatMessages((m) => [...m, { role: "ai", text: data.response || "—" }]);
      }
    } catch {
      setChatMessages((m) => [...m, { role: "ai", text: t.chatError || "Xatolik yuz berdi. Qaytadan urinib ko'ring." }]);
    } finally {
      setSending(false);
    }
  };

  const limitReached = chatRemaining <= 0;

  const messages = chatMessages.length > 0
    ? chatMessages
    : [{ role: "ai", text: t.chatWelcome }];

  return (
    <div className="screen chat">
      <p className="eyebrow">{t.navChat}</p>
      <div className="chat__meta">
        <Sparkles size={14} />
        <span className="numeral">
          {chatRemaining === Infinity ? t.unlimited : `${chatRemaining} ${t.messagesLeft}`}
        </span>
        {chatMessages.length > 0 && (
          <button
            className="chat__clear-btn"
            onClick={handleClear}
            aria-label="Tarixni tozalash"
            title="Tarixni tozalash"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="chat__thread">
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.role}`}>
            {m.image && (
              <img
                src={m.image}
                alt="yuborilgan rasm"
                className="chat-bubble-image"
              />
            )}
            {m.text && <span>{m.text}</span>}
          </div>
        ))}
        {sending && <div className="bubble bubble--ai bubble--typing">···</div>}
        <div ref={endRef} />
      </div>

      {imagePreview && (
        <div className="chat__image-preview">
          <img src={imagePreview} alt="tanlangan rasm" />
          <button
            className="chat__image-remove"
            onClick={removeImage}
            aria-label="Rasmni olib tashlash"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {limitReached ? (
        <div className="chat__limit">
          <p>{t.chatLimitReached}</p>
          <button className="btn btn-accent" onClick={() => router.push("/app/premium")}>
            {t.upgrade}
          </button>
        </div>
      ) : (
        <>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageSelect}
          />
          <form className="chat__composer" onSubmit={send}>
            <button
              type="button"
              className="chat__gallery-btn"
              onClick={() => galleryRef.current?.click()}
              aria-label="Galereya"
              title="Galereya"
            >
              <ImagePlus size={18} />
            </button>
            <input
              className="field"
              placeholder={t.chatPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="chat__send"
              type="submit"
              aria-label="Send"
              disabled={!input.trim() && !selectedImage}
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
