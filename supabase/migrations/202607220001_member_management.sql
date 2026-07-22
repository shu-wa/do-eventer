-- Participant attendance and host-side join request review.

create or replace function private.can_review_event_member(target_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.event_members manager
    join public.event_members applicant on applicant.event_id = manager.event_id
    where manager.user_id = auth.uid()
      and manager.status = 'approved'
      and manager.role in ('host', 'cohost')
      and applicant.user_id = target_user_id
      and applicant.status = 'pending'
  );
$$;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
using (id = auth.uid() or private.shares_event(id) or private.can_review_event_member(id));

create or replace function public.set_my_attendance(target_event_id uuid, attendance text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if attendance not in ('参加', '未定', '不参加') then raise exception 'invalid_attendance'; end if;
  update public.event_members
  set attendance_label = attendance,
      updated_at = now()
  where event_id = target_event_id
    and user_id = auth.uid()
    and status = 'approved';
  if not found then raise exception 'membership_not_found'; end if;
end;
$$;

create or replace function public.review_event_join_request(
  target_event_id uuid,
  target_user_id uuid,
  decision text
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if decision not in ('approved', 'declined') then raise exception 'invalid_decision'; end if;
  if not private.can_manage_event(target_event_id) then raise exception 'not_allowed'; end if;
  perform 1 from public.events where id = target_event_id for update;
  if not found then raise exception 'event_not_found'; end if;
  if decision = 'approved' and (
    select count(*) from public.event_members
    where event_id = target_event_id and status = 'approved'
  ) >= (
    select capacity from public.events where id = target_event_id
  ) then raise exception 'event_full'; end if;

  update public.event_members
  set status = decision::public.membership_status,
      attendance_label = case when decision = 'approved' then '未定' else attendance_label end,
      updated_at = now()
  where event_id = target_event_id
    and user_id = target_user_id
    and role = 'member'
    and status = 'pending';

  if not found then raise exception 'request_not_found'; end if;
end;
$$;

revoke all on function public.review_event_join_request(uuid, uuid, text) from public, anon;
grant execute on function public.review_event_join_request(uuid, uuid, text) to authenticated;
revoke all on function public.set_my_attendance(uuid, text) from public, anon;
grant execute on function public.set_my_attendance(uuid, text) to authenticated;
