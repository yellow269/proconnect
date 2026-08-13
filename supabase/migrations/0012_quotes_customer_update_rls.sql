-- Migration 0012: Customer accept/reject quotes RLS
-- Adds RLS policy allowing customers to accept/reject quotes for their own jobs.

-- Customers can update quotes where the quote belongs to their job
-- This enables accept/reject functionality.
-- Application layer ensures only status changes are permitted.
create policy "customers update quotes" on public.quotes
  for update
  using (
    exists (
      select 1 from public.jobs
      where id = job_id and customer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.jobs
      where id = job_id and customer_id = auth.uid()
    )
  );
