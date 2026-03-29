create extension if not exists vector;

alter table public.service_entries
  add column if not exists embedding vector(768);

create index if not exists service_entries_embedding_cosine_idx
  on public.service_entries
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

drop function if exists public.match_service_notes(vector(768), double precision, integer);
drop function if exists public.match_service_notes(vector, double precision, integer);

create or replace function public.match_service_notes(
  query_embedding vector(768),
  match_threshold double precision default 0.55,
  match_count integer default 8
)
returns table (
  service_entry_id uuid,
  client_public_id text,
  client_name text,
  service_date date,
  service_type_name text,
  note_preview text,
  notes text,
  similarity double precision
)
language sql
stable
set search_path = public
as $$
  select
    se.id as service_entry_id,
    c.client_id as client_public_id,
    c.full_name as client_name,
    se.service_date,
    st.name as service_type_name,
    case
      when char_length(se.notes) > 220 then left(se.notes, 220) || '...'
      else se.notes
    end as note_preview,
    se.notes,
    1 - (se.embedding <=> query_embedding) as similarity
  from public.service_entries se
  join public.clients c on c.id = se.client_id
  join public.service_types st on st.id = se.service_type_id
  where se.embedding is not null
    and 1 - (se.embedding <=> query_embedding) >= match_threshold
  order by se.embedding <=> query_embedding, se.service_date desc, se.created_at desc
  limit greatest(match_count, 1);
$$;
