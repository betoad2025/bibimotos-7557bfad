
-- Table to track franchise transfer invites sent to leads
CREATE TABLE public.franchise_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES public.franchise_leads(id) ON DELETE SET NULL,
  email text NOT NULL,
  phone text,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one active invite per franchise at a time
CREATE UNIQUE INDEX franchise_invites_active_unique ON public.franchise_invites (franchise_id) WHERE status = 'pending';

ALTER TABLE public.franchise_invites ENABLE ROW LEVEL SECURITY;

-- Super admins can manage invites
CREATE POLICY "Super admins manage franchise invites" ON public.franchise_invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
