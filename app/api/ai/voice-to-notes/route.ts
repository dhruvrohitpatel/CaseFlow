import { type NextRequest, NextResponse } from "next/server";

import { getAiCapabilities } from "@/lib/ai/capabilities";
import { processVoiceNote } from "@/lib/ai/processVoiceNote";
import { getCurrentSession } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB — Whisper hard limit

export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (session.profile.role === "client") {
    return NextResponse.json(
      { error: "You do not have access to voice notes." },
      { status: 403 },
    );
  }

  const { aiProvider } = getAiCapabilities();

  if (aiProvider !== "openai") {
    return NextResponse.json(
      { error: "Voice notes require an OpenAI API key. Contact your administrator." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const clientId = formData.get("clientId") as string | null;

    if (!audio || !(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: "No audio provided." }, { status: 400 });
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio exceeds the 25 MB limit." }, { status: 400 });
    }

    if (!ALLOWED_AUDIO_MIME_TYPES.has(audio.type)) {
      return NextResponse.json(
        { error: `Unsupported audio format: ${audio.type}.` },
        { status: 400 },
      );
    }

    const result = await processVoiceNote(audio);

    return NextResponse.json({
      success: true,
      ...result,
      clientId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Voice-to-notes error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
