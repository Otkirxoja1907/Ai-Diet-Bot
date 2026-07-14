import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../utils/supabase/admin.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = process.env.WEBAPP_URL || "https://unhearing-greedless-fretted.ngrok-free.dev";

const TIER_PRICE = { free: 0, mid: 25000, ultimed: 50000, pro: 100000 };
const TIER_NAMES = { free: "Bepul", mid: "Mid", ultimed: "Ultimed", pro: "Pro" };

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function getUser(db, chatId) {
  const { data } = await db.from("users").select("*").eq("id", chatId).single();
  if (data) return data;
  const { data: newUser } = await db
    .from("users")
    .upsert({ id: chatId, tier: "free", chat_used_today: 0 })
    .select()
    .single();
  return newUser;
}

async function updateUser(db, chatId, updates) {
  await db.from("users").upsert({ id: chatId, ...updates, updated_at: new Date().toISOString() });
}

async function addPayment(db, userId, tier, amount, currency, telegramPaymentId) {
  await db.from("payments").insert({
    user_id: userId,
    tier,
    amount,
    currency,
    telegram_payment_charge_id: telegramPaymentId,
    status: "completed",
  });
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || "";
  const db = createSupabaseAdmin();

  if (text.startsWith("/start")) {
    const payload = text.split(" ")[1];

    if (payload && payload.startsWith("buy_")) {
      const tier = payload.replace("buy_", "");
      if (!TIER_PRICE[tier] || tier === "free") {
        return tg("sendMessage", { chat_id: chatId, text: "Noto'g'ri tarif." });
      }

      const user = await getUser(db, chatId);
      if (user.tier === tier && user.tier_expiry && new Date(user.tier_expiry) > new Date()) {
        return tg("sendMessage", {
          chat_id: chatId,
          text: `Siz allaqachon *${TIER_NAMES[tier]}* tarifidasiz.`,
          parse_mode: "Markdown",
        });
      }

      return tg("sendInvoice", {
        chat_id: chatId,
        title: `AI Diet — ${TIER_NAMES[tier]} tarifi`,
        description: `Oylik obuna: ${TIER_NAMES[tier]} (${TIER_PRICE[tier].toLocaleString("ru-RU")} UZS/oy)`,
        payload: `premium_${tier}_${chatId}`,
        provider_token: "398062629:TEST:999999999_F91D8F69C042267444B74CC0B3C747757EB0E065",
        currency: "UZS",
        prices: [{ label: `${TIER_NAMES[tier]} — 1 oy`, amount: TIER_PRICE[tier] * 100 }],
      });
    }

    await getUser(db, chatId);
    const userName = message.from?.first_name || "Foydalanuvchi";

    return tg("sendMessage", {
      chat_id: chatId,
      text: `Assalomu alaykum, *${userName}*! 🥦\n\n*AI Diet Bot*ga xush kelibsiz! 🍏\n\nSog'lom hayot sari ilk qadamni tashlash uchun pastdagi *🍏 Diyetani ochish* tugmasini bosing! 👇`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🍏 Diyetani boshlash", web_app: { url: WEB_APP_URL } }],
          [{ text: "ℹ️ Yordam va Maslahatlar", callback_data: "help_info" }],
        ],
      },
    });
  }

  if (text === "/myplan") {
    const user = await getUser(db, chatId);
    const expiry = user.tier_expiry ? new Date(user.tier_expiry) : null;
    const isActive = expiry && expiry > new Date();

    return tg("sendMessage", {
      chat_id: chatId,
      text:
        `📦 *Joriy tarifingiz:*\n\n` +
        `Tarif: *${TIER_NAMES[user.tier] || user.tier}*\n` +
        (isActive ? `📅 Amal qiladi: *${expiry.toLocaleDateString("uz-UZ")}*\n` : "") +
        `💬 Bugun ishlatilgan xabarlar: *${user.chat_used_today || 0}*`,
      parse_mode: "Markdown",
    });
  }
}

async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id;

  if (query.data === "help_info") {
    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `ℹ️ *AI Diet Bot bo'yicha ko'rsatmalar:*\n\n` +
        `1. *Diyetani ochish* tugmasini bosib ilovani ishga tushiring.\n` +
        `2. Kunlik taomlaringizni kaloriya hisoblagichiga yozib boring.\n` +
        `3. Suv ichganingizda suv trekerida qayd etishni unutmang.\n\n` +
        `Sog'lik eng katta boylikdir! 😊`,
      parse_mode: "Markdown",
    });
    await tg("answerCallbackQuery", { callback_query_id: query.id });
  }
}

async function handlePreCheckoutQuery(query) {
  await tg("answerPreCheckoutQuery", { pre_checkout_query_id: query.id, ok: true });
}

async function handleSuccessfulPayment(message) {
  const chatId = message.chat.id;
  const payment = message.successful_payment;
  const payloadParts = payment.invoice_payload.split("_");

  if (payloadParts[0] === "premium") {
    const tier = payloadParts[1];
    const db = createSupabaseAdmin();
    const now = new Date();
    const expiry = new Date(now);
    expiry.setMonth(expiry.getMonth() + 1);

    await updateUser(db, chatId, {
      tier,
      tier_expiry: expiry.toISOString(),
      chat_used_today: 0,
      last_reset_date: now.toISOString().split("T")[0],
    });

    await addPayment(db, chatId, tier, payment.total_amount, payment.currency, payment.telegram_payment_charge_id);

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        `✅ *To'lov muvaffaqiyatli amalga oshirildi!*\n\n` +
        `📦 Tarif: *${TIER_NAMES[tier]}*\n` +
        `💰 Summa: *${(payment.total_amount / 100).toLocaleString("ru-RU")} ${payment.currency}*\n` +
        `📅 Amal qilish muddati: *${expiry.toLocaleDateString("uz-UZ")}*\n\n` +
        `Endi barcha premium imkoniyatlar sizga ochiq! 🎉`,
      parse_mode: "Markdown",
    });
  }
}

export async function POST(request) {
  try {
    const update = await request.json();

    if (update.message) {
      const msg = update.message;

      if (msg.successful_payment) {
        await handleSuccessfulPayment(msg);
      } else if (msg.text) {
        await handleMessage(msg);
      }
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    } else if (update.pre_checkout_query) {
      await handlePreCheckoutQuery(update.pre_checkout_query);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "AI Diet Bot webhook is running" });
}
