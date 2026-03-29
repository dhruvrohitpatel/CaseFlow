"use client";

import Link from "next/link";
import { useState } from "react";

import { saveVoiceServiceEntryAction } from "@/app/actions/voice-service-entry";
import { VoiceNoteRecorder } from "@/components/voice/VoiceNoteRecorder";
import type { Database } from "@/lib/database.types";

type Client = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "id" | "client_id" | "full_name"
>;
type ServiceType = Database["public"]["Tables"]["service_types"]["Row"];

type VoiceServiceEntryProps = {
  clients: Client[];
  serviceTypes: ServiceType[];
};

function formatNotes(structured: Record<string, string>): string {
  const parts: string[] = [];

  if (structured.summary) {
    parts.push(`SUMMARY\n${structured.summary}`);
  }
  if (structured.observations) {
    parts.push(`KEY OBSERVATIONS\n${structured.observations}`);
  }
  if (structured.action_items) {
    parts.push(`ACTION ITEMS\n${structured.action_items}`);
  }
  if (structured.mood_risk) {
    parts.push(`MOOD / RISK\n${structured.mood_risk}`);
  }
  if (structured.suggested_followup_date) {
    parts.push(`SUGGESTED FOLLOW-UP: ${structured.suggested_followup_date}`);
  }

  return parts.join("\n\n");
}

const nativeSelectClassName =
  "flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";

export function VoiceServiceEntry({ clients, serviceTypes }: VoiceServiceEntryProps) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [savedClientId, setSavedClientId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  const handleSave = async ({
    transcript,
    structured,
  }: {
    transcript: string;
    structured: Record<string, string>;
  }) => {
    setSaveError("");

    if (!selectedClientId) {
      setSaveError("Please select a client before saving.");
      return;
    }

    // Match AI-detected service type name to a UUID; fall back to first available type
    const serviceTypeName = (structured.service_type ?? "").toLowerCase();
    const matchedType =
      serviceTypes.find((st) => st.name.toLowerCase() === serviceTypeName) ??
      serviceTypes[0];

    if (!matchedType) {
      setSaveError("No service types found. Contact your administrator.");
      return;
    }

    const notes = formatNotes(structured) || transcript.slice(0, 2000);
    const serviceDate = new Date().toISOString().slice(0, 10);

    const result = await saveVoiceServiceEntryAction({
      clientPublicId: selectedClientId,
      notes,
      serviceTypeId: matchedType.id,
      serviceDate,
    });

    if (result.success) {
      setSavedClientId(result.clientPublicId);
    } else {
      setSaveError(result.error);
    }
  };

  if (savedClientId) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Voice note saved.{" "}
          <Link className="font-medium underline" href={`/clients/${savedClientId}`}>
            View client profile
          </Link>
        </div>
        <button
          className="text-sm text-stone-500 underline hover:text-stone-700"
          onClick={() => {
            setSavedClientId(null);
            setSelectedClientId("");
          }}
        >
          Record another note
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="clientSelect">
          Client
        </label>
        <select
          className={nativeSelectClassName}
          id="clientSelect"
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
        >
          <option value="">Choose a client...</option>
          {clients.map((client) => (
            <option key={client.client_id} value={client.client_id}>
              {client.full_name} ({client.client_id})
            </option>
          ))}
        </select>
      </div>

      {selectedClientId ? (
        <VoiceNoteRecorder clientId={selectedClientId} onSave={handleSave} />
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
          <p className="text-sm text-stone-500">Select a client above to start recording.</p>
        </div>
      )}

      {saveError ? (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{saveError}</div>
      ) : null}
    </div>
  );
}
