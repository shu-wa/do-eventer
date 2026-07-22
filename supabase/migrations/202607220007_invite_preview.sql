-- Reveal only the event name and date/time before an invite is accepted.

create or replace function public.preview_event_invite(raw_token text)
returns table(
  event_id uuid,
  event_title text,
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  time_mode public.event_time_mode
)
language sql stable security definer set search_path = '' as $$
  select
    event.id,
    event.title,
    event.start_date,
    event.end_date,
    event.start_time,
    event.end_time,
    event.time_mode
  from public.event_invites invite
  join public.events event on event.id = invite.event_id
  where invite.token_hash = encode(extensions.digest(upper(trim(raw_token)), 'sha256'), 'hex')
    and invite.revoked_at is null
    and (invite.expires_at is null or invite.expires_at > now())
    and (invite.max_uses is null or invite.use_count < invite.max_uses)
    and event.status <> 'cancelled'
  limit 1;
$$;

revoke all on function public.preview_event_invite(text) from public;
grant execute on function public.preview_event_invite(text) to authenticated;
