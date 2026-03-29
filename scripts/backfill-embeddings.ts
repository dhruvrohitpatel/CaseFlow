import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: text.trim() }] },
        outputDimensionality: 768,
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini error: ${response.statusText}`);
  const data = await response.json();
  return data.embedding.values;
}

async function backfill() {
  const { data: entries, error } = await supabase
    .from("service_entries")
    .select("id, notes")
    .is("embedding", null);

  if (error) throw error;
  if (!entries?.length) {
    console.log("No entries to backfill.");
    return;
  }

  console.log(`Backfilling ${entries.length} entries...`);

  for (const entry of entries) {
    try {
      const embedding = await generateEmbedding(entry.notes);
      await supabase
        .from("service_entries")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", entry.id);
      console.log(`✓ ${entry.id}`);
    } catch (err) {
      console.error(`✗ ${entry.id}`, err);
    }
  }

  console.log("Done.");
}

backfill();