import { NextResponse } from "next/server";

export async function POST(request) {
  const { calorieGoal, proteinGoal, carbsGoal, fatGoal, preferences, language } = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 500 });
  }

  const lang = language || "uz";
  const langInstruction = {
    uz: "Javobni O'zbek tilida yozing.",
    ru: "Ответьте на русском языке.",
    en: "Answer in English.",
  }[lang] || "Javobni O'zbek tilida yezing.";

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

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
        }),
      }
    );

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI noto'g'ri formatda javob berdi" }, { status: 500 });
    }

    const menu = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ menu });
  } catch (error) {
    console.error("AI Menu error:", error.message);
    return NextResponse.json({ error: "AI server xatoligi" }, { status: 500 });
  }
}
