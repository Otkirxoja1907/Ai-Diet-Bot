# AI Diet — Next.js versiyasi

Ilova Vite+React'dan **Next.js 15 (App Router)** ga o'tkazildi. Dizayn tizimi (ranglar, Fraunces/Inter/IBM Plex Mono, macro-ring signature) o'zgarishsiz qoldi — faqat freymvork infratuzilmasi almashtirildi.

## Nima o'zgardi
- **Routing:** `react-router-dom` o'rniga fayl-asosli App Router (`app/page.jsx` → `/`, `app/app/**/page.jsx` → `/app/*`). `NavLink` o'rniga `next/link` + `usePathname`.
- **Shriftlar:** Google Fonts `<link>` o'rniga `next/font/google` — build vaqtida yuklanadi, joylashuv siljishisiz (`--font-display/--font-body/--font-mono` CSS o'zgaruvchilarini avtomatik in'ektsiya qiladi, shuning uchun `tokens.css`da endi shrift nomlari yozilmagan).
- **Backend:** `server.js`dagi `/api/chat` va `/api/scan` endpointlari **Next.js Route Handler**larga ko'chirildi (`app/api/chat/route.js`, `app/api/scan/route.js`) — endi alohida Express server kerak emas, frontend bilan bitta portda ishlaydi. `GEMINI_API_KEY` bo'lmasa, avvalgidek simulyatsiya qilingan javoblar qaytadi.
- **Client/Server komponentlar:** state va localStorage ishlatadigan barcha fayllar boshida `"use client"` bilan belgilangan (`AppContext`, `Header`, `BottomNav`, sahifalar). Root layout server komponent bo'lib qoladi (metadata eksport qilish uchun).
- **Auth/profil endpointlari** (`server.js`dagi `/api/auth`, Google OAuth, `/api/user/profile`) UI'ga hech qachon ulanmagan edi — bu versiyaga ko'chirilmadi. Kerak bo'lsa, xuddi shu tarzda `app/api/...` ostida qo'shish mumkin.
- **`bot.js`** — Telegram bot Next.js ilovasi tashqarisida alohida skript sifatida qoladi (`npm run bot`), `WEBAPP_URL` endi standart `http://localhost:3000` ga ishora qiladi.

## Struktura
```
app/
  layout.jsx        – shriftlar, global CSS, AppProvider, Telegram SDK
  page.jsx           – Landing ("/")
  app/
    layout.jsx        – Header + BottomNav shell
    page.jsx           – Dashboard ("/app")
    tracker/page.jsx   – ("/app/tracker")
    chat/page.jsx       – ("/app/chat")
    premium/page.jsx    – ("/app/premium")
  api/
    chat/route.js       – POST /api/chat
    scan/route.js       – POST /api/scan
components/          – Header, BottomNav, MacroRing, FoodScannerModal
context/AppContext.jsx – tema/til/premium/chat-limit/ovqat holati
i18n/translations.js – UZ/RU/EN
styles/               – tokens, base, layout + har sahifa uchun CSS
bot.js                – Telegram bot (alohida ishga tushiriladi)
```

## Ishga tushirish
```bash
npm install
npm run dev        # http://localhost:3000
npm run bot         # Telegram bot (ixtiyoriy, .env da TELEGRAM_BOT_TOKEN kerak)
```
`.env.example`ni `.env.local`ga nusxalang (Next.js standart nomi), `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN` va h.k. kiriting.

## Deploy haqida eslatma
Ilovada server route'lari (`/api/chat`, `/api/scan`) borligi sababli, avvalgi `firebase.json`dagi **statik hosting** (`dist` papkasi) endi to'g'ri kelmaydi — statik export API route'larni qo'llab-quvvatlamaydi. Buning o'rniga:
- **Vercel** (Next.js uchun eng silliq yo'l), yoki
- **Firebase App Hosting** (Next.js SSR'ni qo'llab-quvvatlaydi, oddiy Hosting emas)

kabi server muhitidan foydalaning.
