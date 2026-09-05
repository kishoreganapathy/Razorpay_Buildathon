import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiModel(json = false) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const genAI = new GoogleGenerativeAI(key);
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: json
      ? { responseMimeType: "application/json", temperature: 0.2 }
      : { temperature: 0.4 },
  });
}

export async function generateJson(system, user) {
  const model = getGeminiModel(true);
  if (!model) return null;
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${system}\n\nUSER:\n${user}` }] }],
    });
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini generateJson error:", error.message || error);
    return null;
  }
}

export async function generateText(system, user) {
  const model = getGeminiModel(false);
  if (!model) return null;
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${system}\n\nUSER:\n${user}` }] }],
    });
    return result.response.text();
  } catch (error) {
    console.error("Gemini generateText error:", error.message || error);
    return null;
  }
}
