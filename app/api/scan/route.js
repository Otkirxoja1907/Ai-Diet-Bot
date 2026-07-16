import { NextResponse } from "next/server";

export async function POST(request) {
  const { image } = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!image) {
    return NextResponse.json({ error: "Image data is required" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Sens professional ovqat tahlilchisan. Rasmga qarab ovqatni aniqla va to'liq tarkibini hisobla.

MUHIM KO'RSATMALAR:
1. Rasmga diqqat bilan qara — ovqat turini, miqdorini, porsiya hajmini aniqla
2. Agar bir nechta taom ko'rinsa — hammasini hisobga ol
3. O'zbek milliy ovqatlarini yaxshi bil: plov, manti, somsa, lag'mon, norin, shashlik, shurva, mastava, qaynatma, non, samsa, bichirq, chuchvara
4. Porsiya hajmini realistik baholash — kichik, o'rtacha, katta
5. Kaloriya va makronutrientlarni aniq hisobla (100g asosida emas, butun porsiya uchun)

Javobni FAQAT JSON formatda qaytar:
{"name":"Taom nomi","calories":0,"protein":0,"carbs":0,"fat":0,"confidence":0,"portion":"porsiya tavsifi"}

Masalan:
- Plov (katta porsiya): cal 750, P 25, C 85, F 32
- Manti (5 dona): cal 450, P 22, C 55, F 15
- Shashlik (200g): cal 380, P 35, C 5, F 24
- Lag'mon: cal 520, P 18, C 65, F 20
- Somsa (2 dona): cal 350, P 12, C 40, F 16
- Osh/Palov (katta): cal 800, P 28, C 90, F 35
- Salad (mevali): cal 150, P 3, C 25, F 5
- Non (1 bo'lak): cal 220, P 7, C 42, F 3
- Choy (shakar bilan): cal 60, P 0, C 15, F 0
- Tayyor ovqat aralashmasi: kaloriyani miqdorga qarab bahola

confidence: 70-99 oralig'ida — qanchalik aniq aniqlaganingni ko'rsat.
JSON dan tashqari hech narsa yozma.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 512,
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error("Gemini scan error:", JSON.stringify(data.error));
      return NextResponse.json({ error: data.error.message || "AI xatoligi" }, { status: 500 });
    }

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error("Gemini scan empty response:", JSON.stringify(data).substring(0, 500));
      return NextResponse.json({ error: "AI javob bermadi. Qaytadan urinib ko'ring." }, { status: 500 });
    }

    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    textResult = textResult.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(textResult);
    } catch {
      const match = textResult.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error("No JSON in scan response:", textResult.substring(0, 300));
        return NextResponse.json({ error: "AI noto'g'ri formatda javob berdi" }, { status: 500 });
      }
      parsed = JSON.parse(match[0]);
    }

    parsed.calories = Math.round(parsed.calories) || 0;
    parsed.protein = Math.round(parsed.protein) || 0;
    parsed.carbs = Math.round(parsed.carbs) || 0;
    parsed.fat = Math.round(parsed.fat) || 0;
    parsed.confidence = Math.min(99, Math.max(50, Math.round(parsed.confidence) || 75));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Gemini image scanning failed:", error.message);
    return NextResponse.json({ error: "Tahlil qilishda xatolik. Qaytadan urinib ko'ring." }, { status: 500 });
  }
}
