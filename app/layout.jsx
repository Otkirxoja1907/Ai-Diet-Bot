import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import { AppProvider } from "../context/AppContext";

import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/layout.css";
import "../styles/landing.css";
import "../styles/home.css";
import "../styles/tracker.css";
import "../styles/chat.css";
import "../styles/premium.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "AI Diet",
  description: "Ratsioningizni AI bilan boshqaring",
  icons: { icon: "/favicon.svg" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
