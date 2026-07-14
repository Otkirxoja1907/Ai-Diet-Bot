import { NextResponse } from "next/server";

const simulatedAnswers = {
  uz: [
    "Siz uchun kunlik kaloriya va suv miqdorini hisoblab chiqdik. Ratsionga ko'proq sabzavotlar qo'shishingizni tavsiya qilaman.",
    "Sog'lom ozish uchun kunlik ratsioningizdan oddiy shakarni chiqarib tashlang va murakkab uglevodlarga (grechka, jo'xori) e'tibor qarating.",
    "Tovuq filesi va pechda pishirilgan sabzavotlar oqsilga boy, yog'i kam ajoyib kechki ovqat hisoblanadi.",
    "Metabolizmni kuchaytirish va hazm qilishni yaxshilash uchun kun davomida kamida 2 litr toza suv ichishni unutmang.",
  ],
  ru: [
    "Для здорового похудения рекомендую снизить потребление сахара и заменить его сложными углеводами.",
    "Куриное филе с запеченными овощами — отличный пример белкового ужина с низким содержанием жиров.",
    "Не забывайте пить не менее 2 литров чистой воды в день для ускорения метаболизма.",
  ],
  en: [
    "To lose weight healthily, try reducing simple sugars and choosing complex carbohydrates instead.",
    "Grilled chicken and baked vegetables is an excellent protein-rich dinner with low fats.",
    "Remember to drink at least 2 liters of pure water daily to speed up your metabolism.",
  ],
};

export async function POST(request) {
  const { message, language } = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!message) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
    const list = simulatedAnswers[language] || simulatedAnswers.uz;
    const answer = list[Math.floor(Math.random() * list.length)];
    return NextResponse.json({ response: answer });
  }

  try {
    const prompt =
      `You are the AI Diet expert assistant. Answer briefly, precisely and professionally in the requested language: ${language || "uz"}. ` +
      `Provide diet tips, calorie control guidelines, meal plans, or healthy recipes. ` +
      `Do not answer generic non-health questions. ` +
      `User query: ${message}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Kechirasiz, javob olishda xatolik yuz berdi.";
    return NextResponse.json({ response: answer });
  } catch (error) {
    console.error("Gemini API call failed:", error.message);
    return NextResponse.json({ error: "AI server response failed" }, { status: 500 });
  }
}
