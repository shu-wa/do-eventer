-- Supabase installs pgcrypto in the extensions schema. Keep security-definer
-- functions on an empty search_path while addressing cryptographic functions
-- by their trusted schema-qualified names.

create or replace function public.create_event_invite(target_event_id uuid, valid_for interval default interval '7 days', allowed_uses integer default 50)
returns text language plpgsql security definer set search_path = '' as $$
declare raw_token text;
begin
  if not private.can_manage_event(target_event_id) then raise exception 'not_allowed'; end if;
  raw_token := upper(encode(extensions.gen_random_bytes(10), 'hex'));
  insert into public.event_invites(event_id, token_hash, created_by, expires_at, max_uses)
  values (target_event_id, encode(extensions.digest(raw_token, 'sha256'), 'hex'), auth.uid(), now() + valid_for, allowed_uses);
  return raw_token;
end;
$$;

create or replace function public.join_event_by_invite(raw_token text)
returns table(event_id uuid, membership_status public.membership_status)
language plpgsql security definer set search_path = '' as $$
declare selected_invite public.event_invites%rowtype;
declare selected_event public.events%rowtype;
begin
  select * into selected_invite from public.event_invites
  where token_hash = encode(extensions.digest(upper(trim(raw_token)), 'sha256'), 'hex')
    and revoked_at is null and (expires_at is null or expires_at > now())
    and (max_uses is null or use_count < max_uses)
  for update;
  if selected_invite.id is null then raise exception 'invalid_invite'; end if;
  select * into selected_event from public.events where id = selected_invite.event_id;
  insert into public.event_members(event_id, user_id, role, status)
  values (selected_invite.event_id, auth.uid(), 'member', case when selected_event.join_policy = 'auto' then 'approved' else 'pending' end)
  on conflict (event_id, user_id) do update set status = excluded.status, updated_at = now();
  update public.event_invites set use_count = use_count + 1 where id = selected_invite.id;
  return query select selected_invite.event_id, case when selected_event.join_policy = 'auto' then 'approved'::public.membership_status else 'pending'::public.membership_status end;
end;
$$;

revoke all on function public.create_event_invite(uuid, interval, integer) from public;
revoke all on function public.join_event_by_invite(text) from public;
grant execute on function public.create_event_invite(uuid, interval, integer) to authenticated;
grant execute on function public.join_event_by_invite(text) to authenticated;
