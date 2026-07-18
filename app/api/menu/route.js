import { NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
      signal: AbortSignal.timeout(45000),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini bo'sh javob");
  return text;
}

async function callGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8192,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq bo'sh javob");
  return text;
}

export async function POST(request) {
  const { calorieGoal, proteinGoal, carbsGoal, fatGoal, preferences, language } = await request.json();

  const lang = language || "uz";
  const langInstruction = {
    uz: "Javobni O'zbek tilida yozing.",
    ru: "Ответьте на русском языке.",
    en: "Answer in English.",
  }[lang] || "Javobni O'zbek tilida yozing.";

  const prompt = `Sen professional diyetolog ekspertsan. Foydalanuvchi uchun 7 kunlik (dushanba-yakshanba) to'liq ovqatlanish rejasini tuz.

Maqsadli kunlik kaloriya: ${calorieGoal || 2200} kcal
Oqsil: ${proteinGoal || 130}g | Uglevod: ${carbsGoal || 260}g | Yog': ${fatGoal || 70}g
${preferences ? `Foydalanuvchi xohishi: ${preferences}` : ""}

Har bir kun uchun 3 ta taom (nonushta, tushlik, kechki ovqat) va 1 ta yengil tamaddi yoz.

Javobni FAQAT JSON formatda qaytar — boshqa hech narsa yozma. JSON strukturasi:
{
  "days": [
    {
      "day": "Dushanba",
      "meals": [
        { "slot": "Nonushta", "name": "Taom nomi", "calories": 400, "protein": 25, "carbs": 50, "fat": 12 },
        { "slot": "Tushlik", "name": "...", "calories": 600, "protein": 35, "carbs": 70, "fat": 18 },
        { "slot": "Kechki ovqat", "name": "...", "calories": 500, "protein": 30, "carbs": 55, "fat": 15 },
        { "slot": "Yengil tamaddi", "name": "...", "calories": 200, "protein": 10, "carbs": 25, "fat": 6 }
      ]
    }
  ]
}

Muhim:
- Har bir kun uchun kaloriya maqsadga yaqin bo'lsin (kaloriya ±100)
- Har xil ovqatlar ishlatilsin, takrorlanmasin
- O'zbek milliy ovqatlarini ham qo'sh (nonushta: manti, somsa, qaynatma; tushlik: shashlik, lag'mon, norin; kechki: shurva, mastava)
- ${langInstruction}`;

  let rawText;

  if (GEMINI_KEY) {
    try {
      rawText = await callGemini(prompt);
    } catch (e) {
      console.warn("Gemini menu failed, trying Groq:", e.message);
    }
  }

  if (!rawText && GROQ_KEY) {
    try {
      rawText = await callGroq(prompt);
    } catch (e) {
      console.error("Groq menu also failed:", e.message);
      return NextResponse.json({ error: "AI hozir band. Biroz kutib qaytadan urinib ko'ring." }, { status: 500 });
    }
  }

  if (!rawText) {
    return NextResponse.json({ error: "AI sozlanmagan" }, { status: 500 });
  }

  try {
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    let menu;
    try {
      menu = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON topilmadi");
      menu = JSON.parse(jsonMatch[0]);
    }
    return NextResponse.json({ menu });
  } catch (e) {
    console.error("Menu parse error:", e.message, rawText.substring(0, 300));
    return NextResponse.json({ error: "AI noto'g'ri formatda javob berdi. Qaytadan urinib ko'ring." }, { status: 500 });
  }
}
