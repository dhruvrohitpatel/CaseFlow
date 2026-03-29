import { type NextRequest, NextResponse } from "next/server";

import { processVoiceNote } from "@/lib/ai/processVoiceNote";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as Blob;
    const clientId = formData.get("clientId") as string;

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
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
