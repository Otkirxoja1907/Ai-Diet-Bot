"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";

export default function Chat() {
  const { t, lang, chatRemaining, useChatMessage } = useApp();
  const router = useRouter();
  const [messages, setMessages] = useState([{ role: "ai", text: t.chatWelcome }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || chatRemaining <= 0) return;
    const userMsg = { role: "user", text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    useChatMessage();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, language: lang }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((m) => [...m, { role: "ai", text: t.chatError || "Xatolik yuz berdi. Qaytadan urinib ko'ring." }]);
      } else {
        setMessages((m) => [...m, { role: "ai", text: data.response || "—" }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "ai", text: t.chatError || "Xatolik yuz berdi. Qaytadan urinib ko'ring." }]);
    } finally {
      setSending(false);
    }
  };

  const limitReached = chatRemaining <= 0;

  return (
    <div className="screen chat">
      <p className="eyebrow">{t.navChat}</p>
      <div className="chat__meta">
        <Sparkles size={14} />
        <span className="numeral">
          {chatRemaining === Infinity ? t.unlimited : `${chatRemaining} ${t.messagesLeft}`}
        </span>
      </div>

      <div className="chat__thread">
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.role}`}>
            {m.text}
          </div>
        ))}
        {sending && <div className="bubble bubble--ai bubble--typing">···</div>}
        <div ref={endRef} />
      </div>

      {limitReached ? (
        <div className="chat__limit">
          <p>{t.chatLimitReached}</p>
          <button className="btn btn-accent" onClick={() => router.push("/app/premium")}>
            {t.upgrade}
          </button>
        </div>
      ) : (
        <form className="chat__composer" onSubmit={send}>
          <input
            className="field"
            placeholder={t.chatPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="chat__send" type="submit" aria-label="Send">
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
