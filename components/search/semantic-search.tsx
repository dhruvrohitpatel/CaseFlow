"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type SearchResult = {
  client_name: string;
  client_public_id: string;
  note_preview: string;
  notes: string;
  service_date: string;
  service_entry_id: string;
  service_type_name: string;
  similarity: number;
};

type SemanticSearchProps = {
  description: string;
  enabled?: boolean;
  planLabel?: string;
  unavailableMessage?: string;
};

export function SemanticSearch({
  description,
  enabled = true,
  planLabel,
  unavailableMessage,
}: SemanticSearchProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 3) {
      setResults([]);
      setSearched(false);
      setError(null);
      setIsLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          error?: string;
          results?: SearchResult[];
        };

        if (!response.ok) {
          setResults([]);
          setError(payload.error ?? "Search failed.");
          setSearched(true);
          return;
        }

        setResults(payload.results ?? []);
        setSearched(true);
      } catch {
        setResults([]);
        setError("Search failed.");
        setSearched(true);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  if (!enabled) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-stone-600">{description}</p>
        <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.42)] px-5 py-6">
          <div className="flex flex-wrap items-center gap-2">
            {planLabel ? <Badge variant="outline">{planLabel}</Badge> : null}
            <p className="text-sm font-medium text-stone-950">Semantic search is optional</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {unavailableMessage ??
              "Semantic search is available as a premium search add-on for internal admin and staff teams."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-stone-600">{description}</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <Input
            aria-label="Search case notes"
            className="h-10 rounded-xl border-stone-200 bg-white pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes, referrals, follow-ups, or service details"
            type="search"
            value={query}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-stone-500">Searching case notes...</p>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
          No matching notes found for that language yet.
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((result) => (
            <article
              key={result.service_entry_id}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <Link
                    className="font-medium text-stone-950 hover:underline"
                    href={`/clients/${result.client_public_id}`}
                  >
                    {result.client_name}
                  </Link>
                  <p className="text-sm text-stone-500">
                    {result.service_type_name} • {result.service_date}
                  </p>
                  <p className="text-sm leading-6 text-stone-700">{result.note_preview}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-stone-600">
                  {Math.round(result.similarity * 100)}% match
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
