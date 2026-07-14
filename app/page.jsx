"use client";

import { useRouter } from "next/navigation";
import { Camera, MessageCircle, Gauge } from "lucide-react";
import { useApp } from "../context/AppContext";
import MacroRing from "../components/MacroRing";
import Header from "../components/Header";

export default function Landing() {
  const { t } = useApp();
  const router = useRouter();

  return (
    <div className="app-shell landing">
      <Header transparent />

      <section className="landing__hero">
        <p className="eyebrow">{t.tagline}</p>
        <h1 className="landing__headline">{t.heroTitle}</h1>
        <p className="landing__body">{t.heroBody}</p>

        <div className="landing__ring">
          <MacroRing
            values={{ calories: 0.72, protein: 0.58, carbs: 0.64, fat: 0.4 }}
            size={230}
            centerLabel="1,584"
            centerSub="kcal"
          />
          <ul className="landing__legend">
            <li><span className="dot" style={{ background: "var(--ring-calories)" }} />{t.today}</li>
            <li><span className="dot" style={{ background: "var(--ring-protein)" }} />{t.protein}</li>
            <li><span className="dot" style={{ background: "var(--ring-carbs)" }} />{t.carbs}</li>
            <li><span className="dot" style={{ background: "var(--ring-fat)" }} />{t.fat}</li>
          </ul>
        </div>

        <div className="landing__actions">
          <button className="btn btn-primary" onClick={() => router.push("/app")}>
            {t.startBtn}
          </button>
          <a className="btn btn-ghost" href="#features">{t.learnMore}</a>
        </div>
      </section>

      <section className="landing__features" id="features">
        <p className="eyebrow">{t.featuresTitle}</p>
        <div className="feature-row">
          <Gauge size={20} />
          <div>
            <h3>{t.f1Title}</h3>
            <p>{t.f1Body}</p>
          </div>
        </div>
        <hr className="hr" />
        <div className="feature-row">
          <Camera size={20} />
          <div>
            <h3>{t.f2Title}</h3>
            <p>{t.f2Body}</p>
          </div>
        </div>
        <hr className="hr" />
        <div className="feature-row">
          <MessageCircle size={20} />
          <div>
            <h3>{t.f3Title}</h3>
            <p>{t.f3Body}</p>
          </div>
        </div>
      </section>

      <footer className="landing__footer">
        <span className="eyebrow">AI Diet — {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
