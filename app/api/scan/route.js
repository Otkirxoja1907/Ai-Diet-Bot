import { NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY;

function buildPrompt(lang) {
  const prompts = {
    uz: `Sen professional ovqat tahlilchisan. Rasmga qarab barcha ovqatlarni aniqla va to'liq ozuqaviy tarkibini hisobla.

QOIDALAR:
1. Diqqat bilan qara — ovqat turini, miqdorini, porsiya hajmini aniqla
2. Bir nechta taom ko'rinsa — hammasini hisobga ol
3. O'zbek milliy ovqatlarini bil: plov, manti, somsa, lag'mon, norin, shashlik, shurva, mastava, non, samsa
4. Porsiya hajmini realistik bahola
5. Kaloriya va makronutrientlarni butun porsiya uchun hisobla (100g emas)

name va portion ni O'zbek tilida yoz.

JAVOBNI FAQAT JSON formatda qaytar:
{"name":"Taom nomi","calories":0,"protein":0,"carbs":0,"fat":0,"confidence":0,"portion":"porsiya tavsifi"}

confidence: 70-99.
FAQAT JSON obyektini chiqar. Boshqa hech narsa yozma.`,

    ru: `Ты профессиональный анализатор еды. Определи всю еду на изображении и рассчитай полный состав.

ПРАВИЛА:
1. Внимательно рассмотри — определи тип еды, количество, размер порции
2. Если видно несколько блюд — учти все
3. Знай узбекские блюда: плов, манты, сомса, лагман, шашлык, шурпа
4. Оцени реалистично размер порции
5. Калории и макронутриенты на ВСЮ порцию (не на 100г)

name и portion пиши на РУССКОМ языке.

ОТВЕТЬ ТОЛЬКО JSON:
{"name":"Название еды","calories":0,"protein":0,"carbs":0,"fat":0,"confidence":0,"portion":"описание порции"}

confidence: 70-99.
ТОЛЬКО JSON объект. Ничего больше.`,

    en: `You are a professional food analyzer. Identify all food in the image and calculate full nutritional info.

RULES:
1. Look carefully — identify food type, amount, portion size
2. If multiple foods visible — combine all
3. Know Uzbek foods: plov, manti, somsa, lag'mon, shashlik, shurpa
4. Estimate portion realistically
5. Calculate calories and macros for the ENTIRE portion (not per 100g)

name and portion must be in ENGLISH.

Respond ONLY with this JSON:
{"name":"Food name","calories":0,"protein":0,"carbs":0,"fat":0,"confidence":0,"portion":"portion description"}

confidence: 70-99.
Output ONLY the JSON object.`,
  };

  return prompts[lang] || prompts.uz;
}

async function callGemini(base64Data, mimeType, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Data } }] }],
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

function parseScanResponse(raw) {
  let cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\{[^{}]*"name"[^{}]*"calories"[^{}]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); }
      catch { throw new Error("JSON topilmadi"); }
    } else {
      const fallback = raw.match(/\{[\s\S]*\}/);
      if (!fallback) throw new Error("JSON topilmadi");
      try { parsed = JSON.parse(fallback[0]); }
      catch { throw new Error("JSON topilmadi"); }
    }
  }

  if (!parsed.name) parsed.name = "Unknown food";
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

  const { image, language } = body;
  if (!image) return NextResponse.json({ error: "Image required" }, { status: 400 });

  if (!GEMINI_KEY) {
    return NextResponse.json({ error: "Gemini API key not found" }, { status: 500 });
  }

  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const prompt = buildPrompt(language || "uz");

  let rawText;
  try {
    rawText = await callGemini(base64Data, mimeType, prompt);
  } catch (e) {
    console.error("Gemini scan failed:", e.message);
    return NextResponse.json({ error: "AI tahlil qilishda xatolik. Qaytadan urinib ko'ring." }, { status: 500 });
  }

  try {
    const parsed = parseScanResponse(rawText);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Scan parse error:", e.message, "raw:", rawText.substring(0, 500));
    return NextResponse.json({ error: "AI noto'g'ri formatda javob berdi. Qaytadan urinib ko'ring." }, { status: 500 });
  }
}
