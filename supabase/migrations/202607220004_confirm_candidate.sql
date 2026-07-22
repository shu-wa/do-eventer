-- Managers can atomically promote a candidate date to the event schedule.

create or replace function public.confirm_event_date_candidate(target_candidate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate public.date_candidates%rowtype;
begin
  select * into candidate
  from public.date_candidates
  where id = target_candidate_id;

  if candidate.id is null then
    raise exception 'candidate_not_found';
  end if;
  if not private.can_manage_event(candidate.event_id) then
    raise exception 'not_allowed';
  end if;

  update public.events
  set start_date = candidate.candidate_date,
      end_date = candidate.candidate_date,
      start_time = candidate.start_time,
      end_time = null,
      time_mode = 'start',
      updated_at = now()
  where id = candidate.event_id;
end;
$$;

revoke all on function public.confirm_event_date_candidate(uuid) from public;
grant execute on function public.confirm_event_date_candidate(uuid) to authenticated;

alter publication supabase_realtime add table public.events;
