# AI Chat API Sozlamalari

AI chat ishlashi uchun API kalitlarini sozlash kerak.

## Muammo
AI chat ishlamayapti, chunki API kalitlari sozlanmagan.

## Yechim

### Gemini API Key
1. https://makersuite.google.com/app/apikey ga boring
2. Hisobingizga kiring
3. API key yarating
4. `.env` fayliga qo'shing:
   ```
   GEMINI_API_KEY=AIza...
   ```

## Qanday ishlashadi
- Chat faqat Gemini API orqali ishlaydi
- Agar `GEMINI_API_KEY` bo'lmasa, xatolik chiqadi

## .env fayl misoli
```env
TELEGRAM_BOT_TOKEN=8936861105:AAE6-tBUYL31xQRpxEOPuJ3mqv4z5i6UUSo
WEBAPP_URL=https://ready-cats-cover.loca.lt
GEMINI_API_KEY=AIza...
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

## Serverni qayta ishga tushiring
API kalitlarini qo'shgach, serverni qayta ishga tushiring:
```bash
npm run dev
```
