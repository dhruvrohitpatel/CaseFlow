import { getAiCapabilities } from "@/lib/ai/capabilities";
import { generateOpenAiEmbedding } from "@/lib/ai/openai";
import { getGeminiApiKey } from "@/lib/env";

const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

type GeminiEmbeddingResponse = {
  embedding?: {
    values?: number[];
  };
};

export function serializeVector(values: number[]) {
  return `[${values.join(",")}]`;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error("Cannot generate an embedding from empty text.");
  }

  const { aiProvider } = getAiCapabilities();

  if (aiProvider === "openai") {
    return generateOpenAiEmbedding(normalizedText);
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getGeminiApiKey(),
      },
      body: JSON.stringify({
        model: `models/${GEMINI_EMBEDDING_MODEL}`,
        content: {
          parts: [{ text: normalizedText }],
        },
        output_dimensionality: EMBEDDING_DIMENSIONS,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini embedding failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as GeminiEmbeddingResponse;
  const values = data.embedding?.values;

  if (!values || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Gemini embedding response did not include the expected vector.");
  }

  return values;
}
