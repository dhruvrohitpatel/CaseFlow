import { z } from "zod";

import {
  getOpenAiApiKey,
  getOpenAiEmbeddingModel,
  getOpenAiTextModel,
  getOpenAiVisionModel,
} from "@/lib/env";

type OpenAiJsonRequest = {
  imageDataUrl?: string;
  instruction: string;
  model: string;
  prompt: string;
  schema: Record<string, unknown>;
  schemaName: string;
};

type OpenAiResponse = {
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
  output?: Array<{
    content?: Array<
      | {
          text?: string;
          type?: string;
        }
      | {
          type?: string;
          json?: unknown;
        }
    >;
  }>;
  output_text?: string;
};

type OpenAiEmbeddingResponse = {
  data?: Array<{
    embedding?: number[];
  }>;
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
};

function withAdditionalPropertiesFalse(schema: Record<string, unknown>) {
  return {
    additionalProperties: false,
    ...schema,
  };
}

function extractJsonText(response: OpenAiResponse) {
  if (response.output_text?.trim()) {
    return response.output_text.trim();
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if ("json" in content && content.json) {
        return JSON.stringify(content.json);
      }

      if ("text" in content && typeof content.text === "string" && content.text.trim()) {
        return content.text.trim();
      }
    }
  }

  return "";
}

async function callOpenAiJson<T>(
  { imageDataUrl, instruction, model, prompt, schema, schemaName }: OpenAiJsonRequest,
  parser: z.ZodSchema<T>,
) {
  const content: Array<Record<string, unknown>> = [
    {
      text: `${instruction}\n\n${prompt}`,
      type: "input_text",
    },
  ];

  if (imageDataUrl) {
    content.push({
      image_url: imageDataUrl,
      type: "input_image",
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        {
          content,
          role: "user",
        },
      ],
      model,
      text: {
        format: {
          name: schemaName,
          schema: withAdditionalPropertiesFalse(schema),
          strict: true,
          type: "json_schema",
        },
      },
    }),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = (await response.json()) as OpenAiResponse;

  if (!response.ok) {
    throw new Error(
      `OpenAI request failed (${response.status}): ${data.error?.message ?? "Unknown error."}`,
    );
  }

  const text = extractJsonText(data);

  if (!text) {
    throw new Error("OpenAI did not return JSON content.");
  }

  return parser.parse(JSON.parse(text));
}

export function fileToDataUrl(file: File) {
  const contentType = file.type || "application/octet-stream";

  return file.arrayBuffer().then((buffer) => {
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  });
}

export async function callOpenAiTextJson<T>(
  args: Omit<OpenAiJsonRequest, "model">,
  parser: z.ZodSchema<T>,
) {
  return callOpenAiJson(
    {
      ...args,
      model: getOpenAiTextModel(),
    },
    parser,
  );
}

export async function callOpenAiVisionJson<T>(
  args: Omit<OpenAiJsonRequest, "model"> & { imageDataUrl: string },
  parser: z.ZodSchema<T>,
) {
  return callOpenAiJson(
    {
      ...args,
      model: getOpenAiVisionModel(),
    },
    parser,
  );
}

export async function generateOpenAiEmbedding(text: string) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error("Cannot generate an embedding from empty text.");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    body: JSON.stringify({
      input: normalizedText,
      model: getOpenAiEmbeddingModel(),
    }),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = (await response.json()) as OpenAiEmbeddingResponse;

  if (!response.ok) {
    throw new Error(
      `OpenAI embedding failed (${response.status}): ${data.error?.message ?? "Unknown error."}`,
    );
  }

  const values = data.data?.[0]?.embedding;

  if (!values?.length) {
    throw new Error("OpenAI embedding response did not include vector values.");
  }

  return values;
}
