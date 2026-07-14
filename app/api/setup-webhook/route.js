import { NextResponse } from "next/server";

export async function GET(request) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const VERCEL_URL = process.env.VERCEL_URL;
  const WEBAPP_URL = process.env.WEBAPP_URL;

  const baseUrl = VERCEL_URL ? `https://${VERCEL_URL}` : WEBAPP_URL;

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN kerak" }, { status: 500 });
  }

  const webhookUrl = `${baseUrl}/api/webhook`;

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query", "pre_checkout_query"],
      drop_pending_updates: true,
    }),
  });

  const data = await res.json();

  return NextResponse.json({
    webhook_url: webhookUrl,
    result: data,
  });
}
