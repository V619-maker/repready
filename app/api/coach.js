const GEMINI_MODEL = "gemini-2.0-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const origin = req.headers.origin || "";
  const allowed = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://repready.site",
    "https://repready.vercel.app",
  ];
  if (process.env.NODE_ENV === "production" && !allowed.includes(origin)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { messages, system, max_tokens = 300 } = req.body;

  if (!messages || !system) {
    return res.status(400).json({ error: "Missing messages or system" });
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
  if (!apiKey) {
    console.error("GOOGLE_GENERATIVE_AI_KEY is not set");
    return res.status(500).json({ error: "API key not configured" });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages,
        generationConfig: {
          maxOutputTokens: max_tokens,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return res.status(response.status).json({ error: "Upstream API error" });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("Coach API handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
