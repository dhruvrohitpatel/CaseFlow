"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

type SearchResult = {
  id: string;
  client_id: string;
  client_name: string;
  notes: string;
  service_type_name: string;
  service_date: string;
  similarity: number;
};

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search case notes... (e.g. 'referred to housing' or 'food assistance')"
          className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
        />
      </div>

      {loading ? (
        <p className="text-sm text-stone-500">Searching...</p>
      ) : searched && results.length === 0 ? (
        <p className="text-sm text-stone-500">No matching notes found.</p>
      ) : results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-stone-200 bg-white p-4 text-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Link
                    href={`/clients/${r.client_id}`}
                    className="font-medium text-stone-900 hover:underline"
                  >
                    {r.client_name}
                  </Link>
                  <p className="text-stone-500">
                    {r.service_type_name} · {r.service_date}
                  </p>
                  <p className="leading-6 text-stone-700">
                    {r.notes.length > 200
                      ? r.notes.slice(0, 200) + "…"
                      : r.notes}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                  {Math.round(r.similarity * 100)}% match
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}