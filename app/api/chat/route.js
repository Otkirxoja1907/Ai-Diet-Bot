import { NextResponse } from "next/server";

export async function POST(request) {
  const { message, language } = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;

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

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error("Gemini API error:", JSON.stringify(data.error));
      return NextResponse.json({ error: data.error.message || "Gemini xatoligi" });
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) {
      console.error("Gemini empty response:", JSON.stringify(data).substring(0, 300));
      return NextResponse.json({ error: "AI javob bermadi" });
    }

    return NextResponse.json({ response: answer });
  } catch (error) {
    console.error("Gemini API call failed:", error.message);
    return NextResponse.json({ error: "AI server response failed" }, { status: 500 });
  }
}
