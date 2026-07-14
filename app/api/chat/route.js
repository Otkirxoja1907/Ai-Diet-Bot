import { NextResponse } from "next/server";

export async function POST(request) {
  const { message, language } = await request.json();
  const apiKey = process.env.GROQ_API_KEY;

  if (!message) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ response: "AI kalit topilmadi. Admin bilan bog'laning." });
  }

  try {
    const prompt =
      `You are the AI Diet expert assistant. Answer briefly, precisely and professionally in the requested language: ${language || "uz"}. ` +
      `Provide diet tips, calorie control guidelines, meal plans, or healthy recipes. ` +
      `Do not answer generic non-health questions. ` +
      `User query: ${message}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || "Kechirasiz, javob olishda xatolik yuz berdi.";
    return NextResponse.json({ response: answer });
  } catch (error) {
    console.error("Groq API call failed:", error.message);
    return NextResponse.json({ error: "AI server response failed" }, { status: 500 });
  }
}
