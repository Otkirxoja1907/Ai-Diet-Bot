import { NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

async function callGemini(parts) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
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

async function callGroq(parts) {
  const hasImage = parts.some((p) => p.inlineData);
  const model = hasImage ? "qwen/qwen3.6-27b" : "llama-3.3-70b-versatile";

  const messages = [{ role: "user", content: [] }];
  for (const part of parts) {
    if (part.text) {
      messages[0].content.push({ type: "text", text: part.text });
    } else if (part.inlineData) {
      messages[0].content.push({
        type: "image_url",
        image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` },
      });
    }
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${txt.substring(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq bo'sh javob");
  return text;
}

async function callAI(parts) {
  if (GEMINI_KEY) {
    try {
      return await callGemini(parts);
    } catch (e) {
      console.warn("Gemini failed, trying Groq:", e.message);
    }
  }
  if (GROQ_KEY) {
    try {
      return await callGroq(parts);
    } catch (e) {
      console.error("Groq also failed:", e.message);
      throw new Error("AI hozir band. Biroz kutib qaytadan urinib ko'ring.");
    }
  }
  throw new Error("AI sozlanmagan");
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
    const answer = await callAI(parts);
    return NextResponse.json({ response: answer });
  } catch (err) {
    console.error("Chat AI error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
