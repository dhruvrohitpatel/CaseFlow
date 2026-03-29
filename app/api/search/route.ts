import { NextRequest, NextResponse } from "next/server";

import { generateEmbedding } from "@/lib/ai/embeddings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const [embedding, supabase] = await Promise.all([
      generateEmbedding(query),
      createSupabaseServerClient(),
    ]);

    const { data, error } = await supabase.rpc("match_service_notes", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 10,
    });

    if (error) throw error;

    return NextResponse.json({ results: data ?? [] });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}