import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createBotSupabase } from './utils/supabase/bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'http://localhost:3000';

if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
  console.error('\x1b[31m%s\x1b[0m', 'XATO: TELEGRAM_BOT_TOKEN topilmadi!');
  process.exit(1);
}

const db = createBotSupabase();

async function getUser(chatId) {
  const { data, error } = await db.from('users').select('*').eq('id', chatId).single();
  if (error || !data) {
    const { data: newUser } = await db.from('users').upsert({
      id: chatId,
      tier: 'free',
      chat_used_today: 0,
    }).select().single();
    return newUser;
  }
  return data;
}

async function updateUser(chatId, updates) {
  const { error } = await db.from('users').upsert({ id: chatId, ...updates, updated_at: new Date().toISOString() });
  if (error) console.error('Update user error:', error.message);
}

async function addPayment(userId, tier, amount, currency, telegramPaymentId) {
  const { error } = await db.from('payments').insert({
    user_id: userId,
    tier,
    amount,
    currency,
    telegram_payment_charge_id: telegramPaymentId,
    status: 'completed',
  });
  if (error) console.error('Add payment error:', error.message);
}

const TIER_PRICE = { free: 0, mid: 25000, ultimed: 50000, pro: 100000, pro_yearly: 250000 };
const TIER_NAMES = { free: 'Bepul', mid: 'Mid', ultimed: 'Ultimed', pro: 'Pro', pro_yearly: 'Pro (1 yil)' };
const TIER_DURATION_MONTHS = { free: 0, mid: 1, ultimed: 1, pro: 1, pro_yearly: 12 };

const bot = new TelegramBot(token, { polling: true });

console.log('\x1b[32m%s\x1b[0m', 'AI Diet Bot ishga tushdi...');
console.log(`Web App: ${webAppUrl}`);

bot.setChatMenuButton({
  menu_button: JSON.stringify({
    type: 'web_app',
    text: '🍏 Diyetani ochish',
    web_app: { url: webAppUrl }
  })
}).catch(err => console.error('Menu button xatolik:', err.message));

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Foydalanuvchi';
  const payload = match?.[1];

  if (payload && payload.startsWith('buy_')) {
    const tier = payload.replace('buy_', '');
    if (!TIER_PRICE[tier] || tier === 'free') {
      return bot.sendMessage(chatId, 'Noto\'g\'ri tarif.');
    }

    const user = await getUser(chatId);
    if (user.tier === tier && user.tier_expiry && new Date(user.tier_expiry) > new Date()) {
      return bot.sendMessage(chatId, `Siz allaqachon *${TIER_NAMES[tier]}* tarifidasiz.`, { parse_mode: 'Markdown' });
    }

    const priceKopeks = TIER_PRICE[tier] * 100;

    const months = TIER_DURATION_MONTHS[tier] || 1;
    const periodLabel = months === 12 ? '1 yil' : '1 oy';
    const periodDesc = months === 12 ? 'Yillik obuna' : 'Oylik obuna';

    await bot.sendInvoice(chatId, {
      title: `AI Diet — ${TIER_NAMES[tier]} tarifi`,
      description: `${periodDesc}: ${TIER_NAMES[tier]} (${TIER_PRICE[tier].toLocaleString('ru-RU')} UZS/${periodLabel})`,
      payload: `premium_${tier}_${chatId}`,
      provider_token: '398062629:TEST:999999999_F91D8F69C042267444B74CC0B3C747757EB0E065',
      currency: 'UZS',
      prices: [
        { label: `${TIER_NAMES[tier]} — ${periodLabel}`, amount: priceKopeks },
      ],
      need_email: false,
    });
    return;
  }

  await getUser(chatId);

  const welcomeMessage = `Assalomu alaykum, *${userName}*! 🥦\n\n` +
    `*AI Diet Bot*ga xush kelibsiz! 🍏\n\n` +
    `Ushbu ilova yordamida siz:\n` +
    `• Shaxsiy ovqatlanish rejasini (diet) tuzishingiz;\n` +
    `• Kunlik yeyilgan kaloriyalar va suv miqdorini hisoblab borishingiz;\n` +
    `• Sog'lom va mazali retseptlarni ko'rishingiz;\n` +
    `• Haftalik taomnoma va xaridlar ro'yxatini shakllantirishingiz mumkin.\n\n` +
    `Sog'lom hayot sari ilk qadamni tashlash uchun pastdagi *🍏 Diyetani ochish* tugmasini bosing! 👇`;

  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🍏 Diyetani boshlash', web_app: { url: webAppUrl } }],
        [{ text: 'ℹ️ Yordam va Maslahatlar', callback_data: 'help_info' }],
      ]
    }
  });
});

bot.on('pre_checkout_query', async (query) => {
  await bot.answerPreCheckoutQuery(query.id, true);
});

bot.on('message', async (msg) => {
  if (!msg.successful_payment) return;

  const chatId = msg.chat.id;
  const payment = msg.successful_payment;
  const payloadParts = payment.invoice_payload.split('_');

  if (payloadParts[0] === 'premium') {
    const tier = payloadParts[1];
    const now = new Date();
    const expiry = new Date(now);
    const months = TIER_DURATION_MONTHS[tier] || 1;
    expiry.setMonth(expiry.getMonth() + months);

    await updateUser(chatId, {
      tier,
      tier_expiry: expiry.toISOString(),
      chat_used_today: 0,
      last_reset_date: now.toISOString().split('T')[0],
    });

    await addPayment(chatId, tier, payment.total_amount, payment.currency, payment.telegram_payment_charge_id);

    await bot.sendMessage(chatId,
      `✅ *To'lov muvaffaqiyatli amalga oshirildi!*\n\n` +
      `📦 Tarif: *${TIER_NAMES[tier]}*\n` +
      `💰 Summa: *${(payment.total_amount / 100).toLocaleString('ru-RU')} ${payment.currency}*\n` +
      `📅 Amal qilish muddati: *${expiry.toLocaleDateString('uz-UZ')}*\n\n` +
      `Endi barcha premium imkoniyatlar sizga ochiq! 🎉\n` +
      `Ilovani ochish uchun /start ni bosing.`,
      { parse_mode: 'Markdown' }
    );
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'help_info') {
    const helpMessage = `ℹ️ *AI Diet Bot bo'yicha ko'rsatmalar:*\n\n` +
      `1. *Diyetani ochish* tugmasini bosib ilovani ishga tushiring.\n` +
      `2. Sozlamalar yoki profil bo'limida bo'yingiz, vazningiz va maqsadlaringizni kiriting.\n` +
      `3. Kun davomida yegan taomlaringizni kaloriya hisoblagichiga yozib boring.\n` +
      `4. Suv ichganingizda suv trekerida qayd etishni unutmang.\n\n` +
      `Sog'lik eng katta boylikdir! 😊`;

    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    await bot.answerCallbackQuery(query.id);
  }
});

bot.onText(/\/myplan/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await getUser(chatId);
  const expiry = user.tier_expiry ? new Date(user.tier_expiry) : null;
  const isActive = expiry && expiry > new Date();

  const msg_text = `📦 *Joriy tarifingiz:*\n\n` +
    `Tarif: *${TIER_NAMES[user.tier] || user.tier}*\n` +
    (isActive ? `📅 Amal qiladi: *${expiry.toLocaleDateString('uz-UZ')}*\n` : '') +
    `💬 Bugun ishlatilgan xabarlar: *${user.chat_used_today || 0}*\n\n` +
    `Tarifni o'zgartirish uchun /start buyrug'ini yozing.`;

  await bot.sendMessage(chatId, msg_text, { parse_mode: 'Markdown' });
});
