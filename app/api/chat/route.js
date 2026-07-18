import { NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function callGemini(parts) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini bo'sh javob");
  return text;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov noto'g'ri" }, { status: 400 });
  }

  const { message, image } = body;
  if (!message && !image) {
    return NextResponse.json({ error: "Xabar yoki rasm kerak" }, { status: 400 });
  }

  if (!GEMINI_KEY) {
    return NextResponse.json({ error: "AI sozlanmagan" }, { status: 500 });
  }

  const systemPrompt =
    "Sen 'AI Diet' — sog'lom ovqatlanish bo'yicha professional yordamchisan. " +
    "HAR DOIM faqat O'ZBEK TILIDA javob ber. Hech qachon boshqa tilda yozma. " +
    "Javoblarni qisqa, aniq va foydali yoz. " +
    "Diet, kaloriya, ovqatlanish, sog'lom retseptlar, sport ovqatlanish haqida maslahat ber. " +
    "O'zbek milliy taomlari (plov, manti, somsa, lag'mon, shashlik, norin, shurva) haqida yaxshi bil.";

  let parts;
  if (image) {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const imgPrompt = message?.trim()
      ? `${systemPrompt}\n\nFoydalanuvchi rasm yubordi va dedi: "${message}". Rasmni tahlil qilib, ovqat haqida ma'lumot ber (nomi, taxminiy kaloriya, foydali xususiyatlari).`
      : `${systemPrompt}\n\nFoydalanuvchi rasm yubordi. Rasmni tahlil qilib, ovqat yoki taom haqida batafsil ma'lumot ber: nomi, taxminiy kaloriya, tarkibiy qismlar, sog'liq uchun foydasi.`;
    parts = [
      { text: imgPrompt },
      { inlineData: { mimeType, data: base64Data } },
    ];
  } else {
    parts = [{ text: `${systemPrompt}\n\nFoydalanuvchi savolini javob ber: ${message}` }];
  }

  try {
    const answer = await callGemini(parts);
    return NextResponse.json({ response: answer });
  } catch (err) {
    console.error("Chat Gemini error:", err.message);
    return NextResponse.json({ error: "AI hozir band. Biroz kutib qaytadan urinib ko'ring." }, { status: 500 });
  }
}
