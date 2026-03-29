"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff } from "lucide-react";

import type { StructuredNote } from "@/lib/ai/processVoiceNote";

export const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

export function getSupportedMimeType(): string | null {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return null;
  }

  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

interface VoiceNoteRecorderProps {
  clientId: string;
  onSave: (data: {
    transcript: string;
    structured: StructuredNote;
    clientId: string;
  }) => Promise<void>;
}

export function VoiceNoteRecorder({ clientId, onSave }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [structured, setStructured] = useState<StructuredNote | null>(null);
  const [error, setError] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>("");

  const startRecording = async () => {
    setError("");

    const mimeType = getSupportedMimeType();

    if (!mimeType) {
      setError(
        "Your browser does not support audio recording. Please use Chrome, Firefox, or Safari 14.1+.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      mimeTypeRef.current = mimeType;
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
        await processAudio(audioBlob);
        setIsProcessing(false);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((p) => p + 1);
      }, 1000);
    } catch {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("clientId", clientId);

      const res = await fetch("/api/ai/voice-to-notes", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setTranscript(data.transcript);
      setStructured(data.structured);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
    }
  };

  const handleSave = async () => {
    if (!structured) return;

    await onSave({ transcript, structured, clientId });
    setTranscript("");
    setStructured(null);
  };

  return (
    <div className="space-y-4 rounded-lg border bg-slate-50 p-6">
      <h3 className="text-lg font-semibold">Record Case Note</h3>

      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button disabled={isProcessing || !!structured} onClick={startRecording}>
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button variant="destructive" onClick={stopRecording}>
            <MicOff className="mr-2 h-4 w-4" />
            Stop
          </Button>
        )}
        {isRecording && (
          <span className="font-mono text-sm text-red-600">
            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
          </span>
        )}
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 rounded bg-blue-50 p-3 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing audio...
        </div>
      )}

      {error ? (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
      ) : null}

      {transcript ? (
        <div>
          <p className="text-sm font-medium">Transcript</p>
          <p className="mt-2 rounded border bg-white p-3 text-sm">{transcript}</p>
        </div>
      ) : null}

      {structured ? (
        <div className="space-y-3 rounded border border-green-200 bg-green-50 p-4">
          <h4 className="font-semibold text-green-900">AI-Structured Note</h4>

          <div>
            <label className="text-sm font-medium">Summary</label>
            <textarea
              className="mt-1 w-full rounded border p-2 text-sm"
              rows={2}
              value={structured.summary}
              onChange={(e) => setStructured({ ...structured, summary: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Service Type</label>
              <input
                className="mt-1 w-full rounded border p-2 text-sm"
                type="text"
                value={structured.service_type}
                onChange={(e) => setStructured({ ...structured, service_type: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Risk Level</label>
              <select
                className="mt-1 w-full rounded border p-2 text-sm"
                value={
                  structured.mood_risk.includes("high")
                    ? "high"
                    : structured.mood_risk.includes("medium")
                      ? "medium"
                      : "low"
                }
                onChange={(e) =>
                  setStructured({ ...structured, mood_risk: `risk: ${e.target.value}` })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Observations</label>
            <textarea
              className="mt-1 w-full rounded border p-2 text-sm"
              rows={2}
              value={structured.observations}
              onChange={(e) => setStructured({ ...structured, observations: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Action Items</label>
            <textarea
              className="mt-1 w-full rounded border p-2 text-sm"
              rows={2}
              value={structured.action_items}
              onChange={(e) => setStructured({ ...structured, action_items: e.target.value })}
            />
          </div>

          <Button className="w-full" onClick={handleSave}>
            Save Case Note
          </Button>
        </div>
      ) : null}
    </div>
  );
}
