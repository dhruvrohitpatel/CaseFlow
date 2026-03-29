import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding, serializeVector } from "@/lib/ai/embeddings";
import { getGeminiApiKey } from "@/lib/env";

const BATCH_SIZE = 25;

async function backfillEmbeddings() {
  getGeminiApiKey();

  const supabase = createSupabaseAdminClient();
  let totalUpdated = 0;
  let totalFailed = 0;

  for (;;) {
    const { data: entries, error } = await supabase
      .from("service_entries")
      .select("id, notes")
      .is("embedding", null)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      throw new Error(error.message);
    }

    if (!entries || entries.length === 0) {
      break;
    }

    console.log(`Backfilling ${entries.length} service entries...`);
    let updatedThisBatch = 0;

    for (const entry of entries) {
      try {
        const embedding = serializeVector(await generateEmbedding(entry.notes));
        const { error: updateError } = await supabase
          .from("service_entries")
          .update({ embedding })
          .eq("id", entry.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        totalUpdated += 1;
        updatedThisBatch += 1;
        console.log(`✓ ${entry.id}`);
      } catch (error) {
        totalFailed += 1;
        console.error(`✗ ${entry.id}`, error);
      }
    }

    if (updatedThisBatch === 0) {
      throw new Error(
        "No embeddings were written in the last batch. Stopping to avoid retrying the same failed rows forever.",
      );
    }
  }

  console.log(
    `Semantic search backfill complete. Updated ${totalUpdated} entries. Failed ${totalFailed} entries.`,
  );
}

backfillEmbeddings().catch((error) => {
  console.error("Embedding backfill failed:", error);
  process.exitCode = 1;
});
