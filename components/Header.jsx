"use client";

import { Sun, Moon } from "lucide-react";
import { useApp } from "../context/AppContext";

const LANGS = ["uz", "ru", "en"];

export default function Header({ transparent }) {
  const { theme, setTheme, lang, setLang, t } = useApp();

  return (
    <header className={`app-header ${transparent ? "app-header--transparent" : ""}`}>
      <span className="app-header__mark">{t.appName}</span>
      <div className="app-header__controls">
        <div className="lang-switch" role="group" aria-label={t.language}>
          {LANGS.map((l) => (
            <button
              key={l}
              className={`lang-switch__btn ${lang === l ? "is-active" : ""}`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          className="icon-toggle"
          aria-label={t.theme}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
}
