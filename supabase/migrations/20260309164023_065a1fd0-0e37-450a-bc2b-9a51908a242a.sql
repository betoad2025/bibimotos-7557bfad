
-- Remove duplicate leads keeping only the oldest one per phone
DELETE FROM public.franchise_leads a
USING public.franchise_leads b
WHERE a.phone = b.phone
  AND a.created_at > b.created_at;

-- Remove duplicate leads keeping only the oldest one per email
DELETE FROM public.franchise_leads a
USING public.franchise_leads b
WHERE a.email IS NOT NULL
  AND a.email = b.email
  AND a.created_at > b.created_at;

-- Now create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS franchise_leads_phone_unique ON public.franchise_leads (phone);
CREATE UNIQUE INDEX IF NOT EXISTS franchise_leads_email_unique ON public.franchise_leads (email) WHERE email IS NOT NULL;
