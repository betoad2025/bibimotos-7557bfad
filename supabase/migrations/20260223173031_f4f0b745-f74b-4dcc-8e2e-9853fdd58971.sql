-- Allow super admins to view all passengers (needed for dashboard stats)
CREATE POLICY "Super admins can view all passengers"
ON public.passengers
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));
