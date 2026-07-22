-- Only the event owner can appoint or remove cohosts.

create or replace function public.set_event_member_role(
  target_event_id uuid,
  target_user_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_owner_id uuid;
begin
  if new_role not in ('cohost', 'member') then
    raise exception 'invalid_role';
  end if;

  select owner_id into event_owner_id
  from public.events
  where id = target_event_id
  for update;

  if event_owner_id is null then
    raise exception 'event_not_found';
  end if;
  if event_owner_id <> auth.uid() then
    raise exception 'not_allowed';
  end if;
  if target_user_id = event_owner_id then
    raise exception 'owner_role_is_fixed';
  end if;

  update public.event_members
  set role = new_role::public.event_member_role,
      updated_at = now()
  where event_id = target_event_id
    and user_id = target_user_id
    and status = 'approved'
    and role <> 'host';

  if not found then
    raise exception 'approved_member_not_found';
  end if;
end;
$$;

revoke all on function public.set_event_member_role(uuid, uuid, text) from public;
grant execute on function public.set_event_member_role(uuid, uuid, text) to authenticated;
