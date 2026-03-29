import OpenAI from "openai";
import { z } from "zod";

import { getOpenAiApiKey } from "@/lib/env";

const SERVICE_TYPES = [
  "Therapy",
  "Intake",
  "Follow-up",
  "Crisis Support",
  "Case Management",
  "Assessment",
];

export const structuredNoteSchema = z.object({
  summary: z.string(),
  service_type: z.string(),
  observations: z.string(),
  action_items: z.string(),
  mood_risk: z.string(),
  suggested_followup_date: z.string().nullable(),
});

export type StructuredNote = z.infer<typeof structuredNoteSchema>;

export async function processVoiceNote(audioBlob: Blob) {
  const apiKey = getOpenAiApiKey();
  const openai = new OpenAI({ apiKey });

  const audioFile = new File([audioBlob], "audio.webm", {
    type: audioBlob.type || "audio/webm",
  });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "en",
  });

  const transcript = transcription.text;

  const systemPrompt = `You are a clinical case note assistant. Structure case manager notes into clean JSON.

Extract these fields from the transcript:
- summary: 1-2 sentence summary of session
- service_type: Pick from: ${SERVICE_TYPES.join(", ")}
- observations: Key observations about client
- action_items: Follow-ups mentioned
- mood_risk: Client emotional state & risk level (low/medium/high)
- suggested_followup_date: When to check in (YYYY-MM-DD or null)

Return ONLY valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Structure this case note:\n\n${transcript}` },
    ],
  });

  const content = response.choices[0].message.content ?? "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Voice note AI returned malformed JSON. Please try again.");
  }

  const validated = structuredNoteSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error("Voice note AI returned unexpected data. Please try again.");
  }

  return {
    transcript,
    structured: validated.data,
    timestamp: new Date().toISOString(),
  };
}
