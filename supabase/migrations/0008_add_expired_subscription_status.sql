-- Add 'expired' to subscription_status enum (used for SUSPENDED PayFast ITN notifications)
alter type public.subscription_status add value if not exists 'expired';
