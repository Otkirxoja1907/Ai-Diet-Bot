"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Sparkles, Crown, BarChart3, CalendarDays } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function BottomNav() {
  const { t } = useApp();
  const pathname = usePathname();

  const items = [
    { href: "/app", label: t.navHome, icon: Home },
    { href: "/app/tracker", label: t.navTracker, icon: LineChart },
    { href: "/app/chat", label: t.navChat, icon: Sparkles },
    { href: "/app/report", label: t.navReport, icon: BarChart3 },
    { href: "/app/menu", label: t.navMenu, icon: CalendarDays },
    { href: "/app/premium", label: t.navPremium, icon: Crown },
  ];

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`bottom-nav__item ${active ? "is-active" : ""}`}>
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
