import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-12345",
  baseURL: (process.env.OPENAI_API_BASE_URL || "http://54.68.203.95:80") + "/v1",
  dangerouslyAllowBrowser: true,
});

export async function editImage(
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<string | null> {
  const base64Data = base64Image.split(",")[1] || base64Image;
  const imageUrl = `data:${mimeType};base64,${base64Data}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;

    if (typeof content === "string" && content.startsWith("data:image")) {
      return content;
    }

    return null;
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
}
