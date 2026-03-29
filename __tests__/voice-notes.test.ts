import { afterEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// structuredNoteSchema — Zod validation on processVoiceNote output
// ---------------------------------------------------------------------------
describe("structuredNoteSchema", () => {
  it("accepts a fully valid note", async () => {
    const { structuredNoteSchema } = await import("@/lib/ai/processVoiceNote");
    const valid = {
      summary: "Client presented well.",
      service_type: "Therapy",
      observations: "Client appeared calm and engaged.",
      action_items: "Schedule follow-up in two weeks.",
      mood_risk: "low",
      suggested_followup_date: "2026-04-15",
    };
    expect(structuredNoteSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts null for suggested_followup_date", async () => {
    const { structuredNoteSchema } = await import("@/lib/ai/processVoiceNote");
    const valid = {
      summary: "Brief session.",
      service_type: "Intake",
      observations: "First meeting.",
      action_items: "None at this time.",
      mood_risk: "medium",
      suggested_followup_date: null,
    };
    expect(structuredNoteSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a note with missing required fields", async () => {
    const { structuredNoteSchema } = await import("@/lib/ai/processVoiceNote");
    const incomplete = { summary: "Only summary present." };
    expect(structuredNoteSchema.safeParse(incomplete).success).toBe(false);
  });

  it("rejects a note where a string field is a number", async () => {
    const { structuredNoteSchema } = await import("@/lib/ai/processVoiceNote");
    const invalid = {
      summary: 42, // wrong type
      service_type: "Assessment",
      observations: "Normal.",
      action_items: "None.",
      mood_risk: "low",
      suggested_followup_date: null,
    };
    expect(structuredNoteSchema.safeParse(invalid).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isVoiceNotesEnabled — capability gate
// ---------------------------------------------------------------------------
describe("isVoiceNotesEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns true when OPENAI_API_KEY is set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key");
    vi.stubEnv("GEMINI_API_KEY", "");
    const { isVoiceNotesEnabled } = await import("@/lib/ai/capabilities");
    expect(isVoiceNotesEnabled()).toBe(true);
  });

  it("returns false when no AI key is set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    const { isVoiceNotesEnabled } = await import("@/lib/ai/capabilities");
    expect(isVoiceNotesEnabled()).toBe(false);
  });

  it("returns false when only GEMINI_API_KEY is set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "gemini-key-123");
    const { isVoiceNotesEnabled } = await import("@/lib/ai/capabilities");
    expect(isVoiceNotesEnabled()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ALLOWED_AUDIO_MIME_TYPES — upload validation allow-list
// ---------------------------------------------------------------------------
describe("ALLOWED_AUDIO_MIME_TYPES", () => {
  it("includes common browser recording formats", async () => {
    const { ALLOWED_AUDIO_MIME_TYPES } = await import(
      "@/app/api/ai/voice-to-notes/route"
    );
    expect(ALLOWED_AUDIO_MIME_TYPES.has("audio/webm")).toBe(true);
    expect(ALLOWED_AUDIO_MIME_TYPES.has("audio/webm;codecs=opus")).toBe(true);
    expect(ALLOWED_AUDIO_MIME_TYPES.has("audio/mp4")).toBe(true);
    expect(ALLOWED_AUDIO_MIME_TYPES.has("audio/ogg")).toBe(true);
    expect(ALLOWED_AUDIO_MIME_TYPES.has("audio/ogg;codecs=opus")).toBe(true);
  });

  it("excludes non-audio types", async () => {
    const { ALLOWED_AUDIO_MIME_TYPES } = await import(
      "@/app/api/ai/voice-to-notes/route"
    );
    expect(ALLOWED_AUDIO_MIME_TYPES.has("text/plain")).toBe(false);
    expect(ALLOWED_AUDIO_MIME_TYPES.has("video/mp4")).toBe(false);
    expect(ALLOWED_AUDIO_MIME_TYPES.has("application/json")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// POST /api/ai/voice-to-notes — auth and upload validation
// ---------------------------------------------------------------------------
describe("POST /api/ai/voice-to-notes", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mock("@/lib/auth", () => ({ getCurrentSession: vi.fn().mockResolvedValue(null) }));
    vi.mock("@/lib/ai/capabilities", () => ({
      getAiCapabilities: vi.fn().mockReturnValue({ aiProvider: "openai" }),
      isVoiceNotesEnabled: vi.fn().mockReturnValue(true),
    }));

    const { POST } = await import("@/app/api/ai/voice-to-notes/route");
    const req = new Request("http://localhost/api/ai/voice-to-notes", {
      method: "POST",
      body: new FormData(),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 403 for client role", async () => {
    vi.mock("@/lib/auth", () => ({
      getCurrentSession: vi
        .fn()
        .mockResolvedValue({ profile: { role: "client" }, supabase: {} }),
    }));
    vi.mock("@/lib/ai/capabilities", () => ({
      getAiCapabilities: vi.fn().mockReturnValue({ aiProvider: "openai" }),
      isVoiceNotesEnabled: vi.fn().mockReturnValue(true),
    }));

    const { POST } = await import("@/app/api/ai/voice-to-notes/route");
    const req = new Request("http://localhost/api/ai/voice-to-notes", {
      method: "POST",
      body: new FormData(),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(403);
  });

  it("returns 503 when OpenAI is not configured", async () => {
    vi.mock("@/lib/auth", () => ({
      getCurrentSession: vi
        .fn()
        .mockResolvedValue({ profile: { role: "staff" }, supabase: {} }),
    }));
    vi.mock("@/lib/ai/capabilities", () => ({
      getAiCapabilities: vi.fn().mockReturnValue({ aiProvider: "none" }),
      isVoiceNotesEnabled: vi.fn().mockReturnValue(false),
    }));

    const { POST } = await import("@/app/api/ai/voice-to-notes/route");
    const req = new Request("http://localhost/api/ai/voice-to-notes", {
      method: "POST",
      body: new FormData(),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(503);
  });

  it("returns 400 when audio is missing", async () => {
    vi.mock("@/lib/auth", () => ({
      getCurrentSession: vi
        .fn()
        .mockResolvedValue({ profile: { role: "admin" }, supabase: {} }),
    }));
    vi.mock("@/lib/ai/capabilities", () => ({
      getAiCapabilities: vi.fn().mockReturnValue({ aiProvider: "openai" }),
      isVoiceNotesEnabled: vi.fn().mockReturnValue(true),
    }));

    const { POST } = await import("@/app/api/ai/voice-to-notes/route");
    const req = new Request("http://localhost/api/ai/voice-to-notes", {
      method: "POST",
      body: new FormData(),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/audio/i);
  });

  it("returns 400 for an unsupported MIME type", async () => {
    vi.mock("@/lib/auth", () => ({
      getCurrentSession: vi
        .fn()
        .mockResolvedValue({ profile: { role: "staff" }, supabase: {} }),
    }));
    vi.mock("@/lib/ai/capabilities", () => ({
      getAiCapabilities: vi.fn().mockReturnValue({ aiProvider: "openai" }),
      isVoiceNotesEnabled: vi.fn().mockReturnValue(true),
    }));

    const { POST } = await import("@/app/api/ai/voice-to-notes/route");
    const formData = new FormData();
    formData.append("audio", new Blob(["data"], { type: "text/plain" }), "note.txt");

    const req = new Request("http://localhost/api/ai/voice-to-notes", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unsupported/i);
  });
});

// ---------------------------------------------------------------------------
// PREFERRED_MIME_TYPES — Safari / cross-browser fallback list
// ---------------------------------------------------------------------------
describe("PREFERRED_MIME_TYPES", () => {
  it("lists webm first and mp4 as fallback", async () => {
    const { PREFERRED_MIME_TYPES } = await import("@/components/voice/VoiceNoteRecorder");
    expect(PREFERRED_MIME_TYPES[0]).toBe("audio/webm;codecs=opus");
    expect(PREFERRED_MIME_TYPES).toContain("audio/mp4");
  });
});

// ---------------------------------------------------------------------------
// getSupportedMimeType — returns null when MediaRecorder is unavailable
// ---------------------------------------------------------------------------
describe("getSupportedMimeType", () => {
  it("returns null when MediaRecorder is not defined (Node / old browser)", async () => {
    const { getSupportedMimeType } = await import("@/components/voice/VoiceNoteRecorder");
    // In the Node/vitest environment MediaRecorder is not defined
    expect(getSupportedMimeType()).toBeNull();
  });

  it("returns first supported type when MediaRecorder is available", async () => {
    vi.stubGlobal("MediaRecorder", {
      isTypeSupported: (type: string) => type === "audio/webm",
    });

    const { getSupportedMimeType } = await import("@/components/voice/VoiceNoteRecorder");
    expect(getSupportedMimeType()).toBe("audio/webm");

    vi.unstubAllGlobals();
  });

  it("returns null when no preferred type is supported", async () => {
    vi.stubGlobal("MediaRecorder", { isTypeSupported: () => false });

    const { getSupportedMimeType } = await import("@/components/voice/VoiceNoteRecorder");
    expect(getSupportedMimeType()).toBeNull();

    vi.unstubAllGlobals();
  });
});
