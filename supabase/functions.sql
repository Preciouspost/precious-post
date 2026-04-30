-- RPC: increment monthly usage count atomically
create or replace function increment_usage(p_user_id uuid, p_month_year text)
returns void as $$
begin
  insert into public.monthly_usage (user_id, month_year, count)
  values (p_user_id, p_month_year, 1)
  on conflict (user_id, month_year)
  do update set count = monthly_usage.count + 1;
end;
$$ language plpgsql security definer;
