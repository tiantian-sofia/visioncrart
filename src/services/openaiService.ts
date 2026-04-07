const MAX_DIMENSION = 1024;

function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function editImage(
  base64Image: string,
  prompt: string,
): Promise<string | null> {
  const compressed = await compressImage(base64Image);
  const base64Data = compressed.split(",")[1];
  const imageUrl = `data:image/jpeg;base64,${base64Data}`;

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
    const message = data.choices?.[0]?.message;

    // Check images array first (custom API format)
    const imageFromImages = message?.images?.[0]?.image_url?.url;
    if (typeof imageFromImages === "string" && imageFromImages.startsWith("data:image")) {
      return imageFromImages;
    }

    // Fallback: check content directly
    const content = message?.content;
    if (typeof content === "string" && content.startsWith("data:image")) {
      return content;
    }

    return null;
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
}
