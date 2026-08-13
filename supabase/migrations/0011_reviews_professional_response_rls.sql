-- Migration 0011: Reviews - Professional response RLS
-- Adds RLS policy allowing professionals to respond to reviews directed at them.

-- Professionals can update reviews where they are the professional (for adding/editing response)
-- Note: Application layer ensures only the 'response' field is modified.
create policy "professionals respond to reviews" on public.reviews
  for update
  using (professional_id = auth.uid())
  with check (professional_id = auth.uid());
