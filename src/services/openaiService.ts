export async function editImage(
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<string | null> {
  const base64Data = base64Image.split(",")[1] || base64Image;
  const imageUrl = `data:${mimeType};base64,${base64Data}`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } },
              { type: "text", text: prompt },
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

    if (typeof content === "string" && content.startsWith("data:image")) {
      return content;
    }

    return null;
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
}
