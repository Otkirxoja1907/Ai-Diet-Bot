import { NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

const SCAN_PROMPT = `Sen professional ovqat tahlilchisan. Rasmga qarab ovqatni aniqla va to'liq tarkibini hisobla.

MUHIM KO'RSATMALAR:
1. Rasmga diqqat bilan qara — ovqat turini, miqdorini, porsiya hajmini aniqla
2. Agar bir nechta taom ko'rinsa — hammasini hisobga ol
3. O'zbek milliy ovqatlarini yaxshi bil: plov, manti, somsa, lag'mon, norin, shashlik, shurva, mastava, qaynatma, non, samsa, bichirq, chuchvara
4. Porsiya hajmini realistik baholash — kichik, o'rtacha, katta
5. Kaloriya va makronutrientlarni aniq hisobla (100g asosida emas, butun porsiya uchun)

Javobni FAQAT JSON formatda qaytar (boshqa hech narsa yozma):
{"name":"Taom nomi","calories":0,"protein":0,"carbs":0,"fat":0,"confidence":0,"portion":"porsiya tavsifi"}

Masalan:
- Plov (katta porsiya): cal 750, P 25, C 85, F 32
- Manti (5 dona): cal 450, P 22, C 55, F 15
- Shashlik (200g): cal 380, P 35, C 5, F 24
- Lag'mon: cal 520, P 18, C 65, F 20
- Somsa (2 dona): cal 350, P 12, C 40, F 16

confidence: 70-99 oralig'ida.
JSON dan tashqari hech narsa yozma.`;

async function callGemini(base64Data, mimeType) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SCAN_PROMPT }, { inlineData: { mimeType, data: base64Data } }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
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

async function callGroq(base64Data, mimeType) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "qwen/qwen3.6-27b",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: SCAN_PROMPT },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
        ],
      }],
      temperature: 0.3,
      max_tokens: 512,
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

function parseScanResponse(raw) {
  let cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON topilmadi");
    parsed = JSON.parse(match[0]);
  }
  parsed.calories = Math.round(Number(parsed.calories)) || 0;
  parsed.protein = Math.round(Number(parsed.protein)) || 0;
  parsed.carbs = Math.round(Number(parsed.carbs)) || 0;
  parsed.fat = Math.round(Number(parsed.fat)) || 0;
  parsed.confidence = Math.min(99, Math.max(50, Math.round(Number(parsed.confidence)) || 75));
  return parsed;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov noto'g'ri" }, { status: 400 });
  }

  const { image } = body;
  if (!image) return NextResponse.json({ error: "Rasm kerak" }, { status: 400 });

  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  let rawText;

  if (GEMINI_KEY) {
    try {
      rawText = await callGemini(base64Data, mimeType);
    } catch (e) {
      console.warn("Gemini scan failed, trying Groq:", e.message);
    }
  }

  if (!rawText && GROQ_KEY) {
    try {
      rawText = await callGroq(base64Data, mimeType);
    } catch (e) {
      console.error("Groq scan also failed:", e.message);
      return NextResponse.json({ error: "AI hozir band. Biroz kutib qaytadan urinib ko'ring." }, { status: 500 });
    }
  }

  if (!rawText) {
    return NextResponse.json({ error: "AI sozlanmagan" }, { status: 500 });
  }

  try {
    const parsed = parseScanResponse(rawText);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Scan parse error:", e.message, rawText.substring(0, 200));
    return NextResponse.json({ error: "AI noto'g'ri formatda javob berdi. Qaytadan urinib ko'ring." }, { status: 500 });
  }
}
