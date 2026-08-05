-- Allow users to promote themselves from customer to professional (one-time).
create or replace function public.promote_to_professional()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set role = 'professional'
  where id = auth.uid()
    and role = 'customer';
end;
$$;
