-- Tabela de alertas de emergência/SOS
CREATE TABLE public.emergency_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL,
  reporter_type TEXT NOT NULL CHECK (reporter_type IN ('driver', 'passenger', 'merchant')),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('sos', 'accident', 'threat', 'medical', 'vehicle_issue', 'route_deviation', 'other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'responding', 'resolved', 'false_alarm')),
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_address TEXT,
  description TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para logs de localização em tempo real durante corridas
CREATE TABLE public.ride_location_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  speed NUMERIC,
  heading NUMERIC,
  accuracy NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_emergency_alerts_franchise ON public.emergency_alerts(franchise_id);
CREATE INDEX idx_emergency_alerts_status ON public.emergency_alerts(status);
CREATE INDEX idx_emergency_alerts_ride ON public.emergency_alerts(ride_id);
CREATE INDEX idx_ride_location_logs_ride ON public.ride_location_logs(ride_id);
CREATE INDEX idx_ride_location_logs_created ON public.ride_location_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_location_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para emergency_alerts
CREATE POLICY "Super admins can view all alerts"
  ON public.emergency_alerts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Franchise admins can view their alerts"
  ON public.emergency_alerts FOR SELECT
  TO authenticated
  USING (
    franchise_id IN (
      SELECT f.id FROM public.franchises f WHERE f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create emergency alerts"
  ON public.emergency_alerts FOR INSERT
  TO authenticated
  WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "Super admins can update all alerts"
  ON public.emergency_alerts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Franchise admins can update their alerts"
  ON public.emergency_alerts FOR UPDATE
  TO authenticated
  USING (
    franchise_id IN (
      SELECT f.id FROM public.franchises f WHERE f.owner_id = auth.uid()
    )
  );

-- Políticas RLS para ride_location_logs
CREATE POLICY "Super admins can view all location logs"
  ON public.ride_location_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Franchise admins can view their location logs"
  ON public.ride_location_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rides r
      JOIN public.franchises f ON f.id = r.franchise_id
      WHERE r.id = ride_id AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can log their location"
  ON public.ride_location_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

-- Trigger para updated_at
CREATE TRIGGER update_emergency_alerts_updated_at
  BEFORE UPDATE ON public.emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime para alertas
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_location_logs;