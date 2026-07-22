-- Candidate-date availability polling with member-scoped visibility.

create table public.date_candidates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  candidate_date date not null,
  start_time time not null,
  note text check (char_length(note) <= 240),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, candidate_date, start_time)
);

create table public.date_candidate_votes (
  candidate_id uuid not null references public.date_candidates(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  choice text not null check (choice in ('yes', 'maybe', 'no')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (candidate_id, user_id)
);

create index date_candidates_event_idx on public.date_candidates(event_id, candidate_date, start_time);
create index date_candidate_votes_user_idx on public.date_candidate_votes(user_id, updated_at);

create trigger date_candidates_updated_at before update on public.date_candidates
for each row execute function private.set_updated_at();

create trigger date_candidate_votes_updated_at before update on public.date_candidate_votes
for each row execute function private.set_updated_at();

alter table public.date_candidates enable row level security;
alter table public.date_candidate_votes enable row level security;

create policy date_candidates_read_members on public.date_candidates for select to authenticated
using (private.is_event_member(event_id));

create policy date_candidates_create_managers on public.date_candidates for insert to authenticated
with check (private.can_manage_event(event_id) and created_by = auth.uid());

create policy date_candidates_update_managers on public.date_candidates for update to authenticated
using (private.can_manage_event(event_id)) with check (private.can_manage_event(event_id));

create policy date_candidates_delete_managers on public.date_candidates for delete to authenticated
using (private.can_manage_event(event_id));

create policy date_candidate_votes_read_members on public.date_candidate_votes for select to authenticated
using (exists (
  select 1 from public.date_candidates candidate
  where candidate.id = candidate_id and private.is_event_member(candidate.event_id)
));

create policy date_candidate_votes_create_own on public.date_candidate_votes for insert to authenticated
with check (user_id = auth.uid() and exists (
  select 1 from public.date_candidates candidate
  where candidate.id = candidate_id and private.is_event_member(candidate.event_id)
));

create policy date_candidate_votes_update_own on public.date_candidate_votes for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy date_candidate_votes_delete_own on public.date_candidate_votes for delete to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on public.date_candidates to authenticated;
grant select, insert, update, delete on public.date_candidate_votes to authenticated;

alter publication supabase_realtime add table public.date_candidates;
alter publication supabase_realtime add table public.date_candidate_votes;
