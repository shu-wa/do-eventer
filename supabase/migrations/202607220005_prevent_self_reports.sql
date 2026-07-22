-- A user cannot create a targeted safety report against their own account.

alter table public.safety_reports
add constraint safety_reports_target_not_self
check (target_user_id is null or target_user_id <> reporter_id);
