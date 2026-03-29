import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { formatAiFeatureError, getAiFeatureState } from "@/lib/ai/capabilities";
import { generateEmbedding, serializeVector } from "@/lib/ai/embeddings";
import { getCurrentSession } from "@/lib/auth";

const searchQuerySchema = z.object({
  q: z.string().trim().min(3).max(250),
});

export async function GET(request: NextRequest) {
  const semanticSearch = getAiFeatureState("semantic_search");
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (session.profile.role === "client") {
    return NextResponse.json({ error: "You do not have access to semantic search." }, { status: 403 });
  }

  if (!semanticSearch.enabled) {
    return NextResponse.json({ error: semanticSearch.unavailableMessage }, { status: 403 });
  }

  const parsed = searchQuerySchema.safeParse({
    q: request.nextUrl.searchParams.get("q"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter at least 3 characters to search notes." },
      { status: 400 },
    );
  }

  try {
    const embedding = serializeVector(await generateEmbedding(parsed.data.q));
    const { data, error } = await session.supabase.rpc("match_service_notes", {
      match_count: 8,
      match_threshold: 0.55,
      query_embedding: embedding,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ results: data ?? [] });
  } catch (error) {
    console.error("Semantic search failed:", error);
    return NextResponse.json(
      { error: formatAiFeatureError("semantic_search", error) },
      { status: 503 },
    );
  }
}
