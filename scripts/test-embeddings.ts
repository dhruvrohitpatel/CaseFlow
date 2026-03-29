const NOTES = [
  "Client came in requesting help with food. Referred to ICM food bank and provided a grocery voucher.",
  "Family is experiencing housing instability. Connected client to Habitat for Humanity and submitted Section 8 application.",
  "Client mentioned skipping meals due to financial hardship. Enrolled in WIC program.",
  "Session focused on mental health. Client reported anxiety and difficulty sleeping. Referred to counseling.",
  "Client is unemployed. Provided resume assistance and referred to job training program.",
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: text.trim() }] },
        outputDimensionality: 768,
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini error: ${response.statusText}`);
  const data = await response.json();
  return data.embedding.values;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

async function testSearch(query: string, noteEmbeddings: number[][]) {
  console.log(`\nQuery: "${query}"`);
  const queryEmbedding = await generateEmbedding(query);

  const results = NOTES
    .map((note, i) => ({
      note,
      score: cosineSimilarity(queryEmbedding, noteEmbeddings[i]),
    }))
    .sort((a, b) => b.score - a.score);

  results.forEach((r) => {
    console.log(`  ${(r.score * 100).toFixed(1)}% — ${r.note.slice(0, 60)}...`);
  });
}

async function main() {
  console.log("Generating embeddings for test notes...");
  const noteEmbeddings = await Promise.all(NOTES.map(generateEmbedding));
  console.log("✓ Done\n");

  await testSearch("food assistance", noteEmbeddings);
  await testSearch("housing problems", noteEmbeddings);
  await testSearch("mental health support", noteEmbeddings);
  await testSearch("hungry", noteEmbeddings); // semantic test — word not in any note
  await testSearch("employment", noteEmbeddings);
}

main();