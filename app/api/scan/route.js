import { NextResponse } from "next/server";

const demoResults = [
  { name: "Tovuq go'shti va Salat", calories: 420, protein: 38, carbs: 15, fat: 22, confidence: 94 },
  { name: "Bananli Suli bo'tqasi", calories: 285, protein: 8, carbs: 52, fat: 5, confidence: 91 },
  { name: "Palov (Osh)", calories: 680, protein: 22, carbs: 78, fat: 30, confidence: 87 },
  { name: "Baliq va Brokkoli", calories: 310, protein: 35, carbs: 12, fat: 14, confidence: 96 },
];

export async function POST(request) {
  const { image } = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!image) {
    return NextResponse.json({ error: "Image data is required" }, { status: 400 });
  }

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
    const rand = demoResults[Math.floor(Math.random() * demoResults.length)];
    return NextResponse.json(rand);
  }

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Analyze this food image. Return ONLY a JSON object (no markdown, no backticks) with keys: 'name' (in Uzbek/Russian/English, keep it short and professional), 'calories' (integer kcal), 'protein' (integer grams), 'fat' (integer grams), 'carbs' (integer grams), 'confidence' (integer percentage of confidence, e.g. 95).",
            },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          ],
        },
      ],
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await res.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    textResult = textResult.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(textResult);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Gemini image scanning failed:", error.message);
    return NextResponse.json({ error: "AI Food Scanner failed to analyze image" }, { status: 500 });
  }
}
