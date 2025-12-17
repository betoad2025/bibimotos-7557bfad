-- Add driver vehicle documentation columns
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS motorcycle_photo_url text,
ADD COLUMN IF NOT EXISTS motorcycle_plate_photo_url text,
ADD COLUMN IF NOT EXISTS insurance_document_url text,
ADD COLUMN IF NOT EXISTS registration_complete boolean DEFAULT false;

-- Create notification broadcasts table
CREATE TABLE IF NOT EXISTS public.notification_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id),
  title text NOT NULL,
  content text NOT NULL,
  html_content text,
  recipient_type text NOT NULL, -- 'drivers', 'passengers', 'merchants', 'all'
  recipient_filter jsonb DEFAULT '{}',
  sent_count integer DEFAULT 0,
  status text DEFAULT 'draft', -- 'draft', 'sending', 'sent', 'failed'
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone
);

ALTER TABLE public.notification_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchise admins can manage their broadcasts" 
ON public.notification_broadcasts FOR ALL 
USING (franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid()));

CREATE POLICY "Super admins can manage all broadcasts"
ON public.notification_broadcasts FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Create blocked notifications table (users who should not receive notifications)
CREATE TABLE IF NOT EXISTS public.notification_blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id),
  user_id uuid NOT NULL,
  blocked_by uuid NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notification_blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchise admins can manage blocked users"
ON public.notification_blocked_users FOR ALL
USING (franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid()));

-- Create driver approval notifications log
CREATE TABLE IF NOT EXISTS public.driver_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  franchise_id uuid REFERENCES public.franchises(id),
  extracted_data jsonb DEFAULT '{}',
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamp with time zone,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.driver_approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchise admins can view their approval requests"
ON public.driver_approval_requests FOR SELECT
USING (franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid()));

CREATE POLICY "Franchise admins can update approval requests"
ON public.driver_approval_requests FOR UPDATE
USING (franchise_id IN (SELECT id FROM franchises WHERE owner_id = auth.uid()));

CREATE POLICY "Drivers can insert their own approval requests"
ON public.driver_approval_requests FOR INSERT
WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Add rating and ride count to passengers table
ALTER TABLE public.passengers
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS total_rides integer DEFAULT 0;

-- Create user selected role preference table
CREATE TABLE IF NOT EXISTS public.user_role_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  selected_role text NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_role_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own role preference"
ON public.user_role_preferences FOR ALL
USING (user_id = auth.uid());

-- Enable realtime for driver approval requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_approval_requests;