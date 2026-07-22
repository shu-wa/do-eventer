-- Store each member's chat read position so unread counts follow the signed-in account.

alter table public.event_members
add column if not exists chat_read_at timestamptz;

create or replace function public.mark_event_chat_read(target_event_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.event_members
  set chat_read_at = greatest(coalesce(chat_read_at, '-infinity'::timestamptz), now()),
      updated_at = now()
  where event_id = target_event_id
    and user_id = auth.uid()
    and status = 'approved';
  if not found then raise exception 'membership_not_found'; end if;
end;
$$;

revoke all on function public.mark_event_chat_read(uuid) from public;
grant execute on function public.mark_event_chat_read(uuid) to authenticated;
