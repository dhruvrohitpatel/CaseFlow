import OpenAI from "openai";

const SERVICE_TYPES = [
  'Therapy',
  'Intake',
  'Follow-up',
  'Crisis Support',
  'Case Management',
  'Assessment',
];

export async function processVoiceNote(audioBlob: Blob) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const openai = new OpenAI({ apiKey });

  console.log("🎤 Transcribing with Whisper...");

  const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "en",
  });

  const transcript = transcription.text;
  console.log("✅ Transcript:", transcript.substring(0, 100) + "...");

  console.log("🧠 Structuring with GPT-4o...");

  const systemPrompt = `You are a clinical case note assistant. Structure case manager notes into clean JSON.

Extract these fields from the transcript:
- summary: 1-2 sentence summary of session
- service_type: Pick from: ${SERVICE_TYPES.join(', ')}
- observations: Key observations about client
- action_items: Follow-ups mentioned
- mood_risk: Client emotional state & risk level (low/medium/high)
- suggested_followup_date: When to check in (YYYY-MM-DD or null)

Return ONLY valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Structure this case note:\n\n${transcript}`,
      },
    ],
  });

  const content = response.choices[0].message.content || "";

  try {
    const structured = JSON.parse(content);
    console.log("✅ Structured");
    return {
      transcript,
      structured,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to parse:", content);
    throw new Error("Failed to parse GPT response");
  }
}
