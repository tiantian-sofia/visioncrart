const API_BASE_URL = process.env.GEMINI_API_BASE_URL || "http://54.68.203.95:80";
const API_KEY = process.env.GEMINI_API_KEY || "";

export async function editImage(
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<string | null> {
  const base64Data = base64Image.split(",")[1] || base64Image;
  const imageUrl = `data:${mimeType};base64,${base64Data}`;

  const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  // Check if response contains inline image data (base64)
  if (typeof content === "string" && content.startsWith("data:image")) {
    return content;
  }

  // Check for image in multimodal response parts
  const parts = data.choices?.[0]?.message?.parts;
  if (Array.isArray(parts)) {
    for (const part of parts) {
      if (part.inline_data) {
        return `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
      }
    }
  }

  return null;
}
