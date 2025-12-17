-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin', 'franchise_admin', 'driver', 'passenger', 'merchant');
CREATE TYPE public.person_type AS ENUM ('pf', 'pj');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.ride_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.delivery_status AS ENUM ('pending', 'accepted', 'picked_up', 'delivered', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.service_type AS ENUM ('ride', 'delivery', 'pharmacy');

-- PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  person_type person_type DEFAULT 'pf',
  cpf TEXT,
  cnpj TEXT,
  rg TEXT,
  state_registration TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  document_front_url TEXT,
  document_back_url TEXT,
  selfie_url TEXT,
  selfie_with_doc_url TEXT,
  kyc_status kyc_status DEFAULT 'pending',
  kyc_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- USER ROLES TABLE
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- CITIES TABLE
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  population INTEGER,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- FRANCHISES TABLE
CREATE TABLE public.franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  base_price DECIMAL(10, 2) DEFAULT 5.00,
  price_per_km DECIMAL(10, 2) DEFAULT 2.00,
  credit_debit_per_ride DECIMAL(10, 2) DEFAULT 1.00,
  surge_percentage DECIMAL(5, 2) DEFAULT 0,
  surge_fixed_amount DECIMAL(10, 2) DEFAULT 0,
  surge_start_hour INTEGER,
  surge_end_hour INTEGER,
  surge_days TEXT[],
  surge_keep_for_franchise BOOLEAN DEFAULT false,
  surge_franchise_percentage DECIMAL(5, 2) DEFAULT 0,
  driver_fee_type TEXT DEFAULT 'fixed',
  driver_fee_amount DECIMAL(10, 2) DEFAULT 1.00,
  payment_gateway TEXT,
  payment_api_key TEXT,
  payment_webhook_url TEXT,
  monthly_fee DECIMAL(10, 2) DEFAULT 299.00,
  contract_start_date DATE,
  contract_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- DRIVERS TABLE
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  vehicle_plate TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_year INTEGER,
  cnh_number TEXT,
  cnh_category TEXT,
  cnh_expiry DATE,
  cnh_front_url TEXT,
  cnh_back_url TEXT,
  crlv_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_online BOOLEAN DEFAULT false,
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  credits DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- PASSENGERS TABLE
CREATE TABLE public.passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  favorite_addresses JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- MERCHANTS TABLE
CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  business_address TEXT NOT NULL,
  business_lat DECIMAL(10, 8),
  business_lng DECIMAL(11, 8),
  business_phone TEXT,
  business_type TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RIDES TABLE
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  passenger_id UUID REFERENCES public.passengers(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  service_type service_type DEFAULT 'ride',
  status ride_status DEFAULT 'pending',
  origin_address TEXT NOT NULL,
  origin_lat DECIMAL(10, 8) NOT NULL,
  origin_lng DECIMAL(11, 8) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat DECIMAL(10, 8) NOT NULL,
  destination_lng DECIMAL(11, 8) NOT NULL,
  distance_km DECIMAL(10, 2),
  estimated_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  surge_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  promo_code TEXT,
  is_promotional BOOLEAN DEFAULT false,
  driver_rating INTEGER,
  passenger_rating INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- DELIVERIES TABLE
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  status delivery_status DEFAULT 'pending',
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8) NOT NULL,
  pickup_lng DECIMAL(11, 8) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10, 8) NOT NULL,
  delivery_lng DECIMAL(11, 8) NOT NULL,
  package_description TEXT,
  package_size TEXT,
  distance_km DECIMAL(10, 2),
  estimated_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  recipient_name TEXT,
  recipient_phone TEXT,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- CREDIT TRANSACTIONS TABLE
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL,
  payment_id TEXT,
  payment_status payment_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- PROMOTIONS TABLE
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false,
  code TEXT UNIQUE,
  description TEXT,
  discount_type TEXT DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  min_ride_value DECIMAL(10, 2),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- KNOWN PLACES TABLE
CREATE TABLE public.known_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- FRANCHISE LEADS TABLE
CREATE TABLE public.franchise_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT NOT NULL,
  state TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- SUPPORT CONVERSATIONS TABLE
CREATE TABLE public.support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_ai_handled BOOLEAN DEFAULT true,
  city_identified TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- SUPPORT MESSAGES TABLE
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.support_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL,
  sender_id UUID,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  file_url TEXT,
  is_from_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ANALYTICS EVENTS TABLE
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- NEIGHBORHOODS STATS TABLE
CREATE TABLE public.neighborhood_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID REFERENCES public.franchises(id) ON DELETE CASCADE NOT NULL,
  neighborhood TEXT NOT NULL,
  ride_count INTEGER DEFAULT 0,
  delivery_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (franchise_id, neighborhood)
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.known_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhood_stats ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER FUNCTION FOR ROLE CHECK
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- FUNCTION TO GET USER'S FRANCHISE
CREATE OR REPLACE FUNCTION public.get_user_franchise_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.id FROM public.franchises f
  WHERE f.owner_id = _user_id
  UNION
  SELECT d.franchise_id FROM public.drivers d WHERE d.user_id = _user_id
  UNION
  SELECT p.franchise_id FROM public.passengers p WHERE p.user_id = _user_id
  UNION
  SELECT m.franchise_id FROM public.merchants m WHERE m.user_id = _user_id
  LIMIT 1
$$;

-- RLS POLICIES

-- Profiles: Users can read/update their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- User Roles: Only super admins can manage
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Cities: Public read, admin write
CREATE POLICY "Anyone can view active cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Super admins can manage cities" ON public.cities FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Franchises: Owner and super admin access
CREATE POLICY "Franchise owners can view own franchise" ON public.franchises FOR SELECT USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Franchise owners can update own franchise" ON public.franchises FOR UPDATE USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage franchises" ON public.franchises FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Public can view active franchises" ON public.franchises FOR SELECT USING (is_active = true);

-- Drivers: Franchise isolation
CREATE POLICY "Drivers can view own data" ON public.drivers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Drivers can update own data" ON public.drivers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Franchise admins can view franchise drivers" ON public.drivers FOR SELECT USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Franchise admins can manage franchise drivers" ON public.drivers FOR ALL USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Super admins can manage all drivers" ON public.drivers FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Passengers: Franchise isolation
CREATE POLICY "Passengers can view own data" ON public.passengers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Passengers can update own data" ON public.passengers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Passengers can insert own data" ON public.passengers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Franchise admins can view franchise passengers" ON public.passengers FOR SELECT USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));

-- Merchants: Franchise isolation
CREATE POLICY "Merchants can view own data" ON public.merchants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Merchants can update own data" ON public.merchants FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Merchants can insert own data" ON public.merchants FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Franchise admins can view franchise merchants" ON public.merchants FOR SELECT USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Franchise admins can manage franchise merchants" ON public.merchants FOR ALL USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));

-- Rides: Franchise isolation
CREATE POLICY "Passengers can view own rides" ON public.rides FOR SELECT USING (passenger_id IN (SELECT id FROM public.passengers WHERE user_id = auth.uid()));
CREATE POLICY "Drivers can view assigned rides" ON public.rides FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Franchise admins can view franchise rides" ON public.rides FOR SELECT USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Franchise admins can manage franchise rides" ON public.rides FOR ALL USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Super admins can view all rides" ON public.rides FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- Deliveries: Franchise isolation
CREATE POLICY "Merchants can view own deliveries" ON public.deliveries FOR SELECT USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
CREATE POLICY "Drivers can view assigned deliveries" ON public.deliveries FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Franchise admins can view franchise deliveries" ON public.deliveries FOR SELECT USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Super admins can view all deliveries" ON public.deliveries FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- Credit Transactions: Driver and franchise isolation
CREATE POLICY "Drivers can view own transactions" ON public.credit_transactions FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Franchise admins can view franchise transactions" ON public.credit_transactions FOR SELECT USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Franchise admins can manage franchise transactions" ON public.credit_transactions FOR ALL USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));

-- Promotions: Franchise and global
CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Franchise admins can manage franchise promotions" ON public.promotions FOR ALL USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Super admins can manage all promotions" ON public.promotions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Known Places: Public read, franchise write
CREATE POLICY "Anyone can view known places" ON public.known_places FOR SELECT USING (is_active = true);
CREATE POLICY "Franchise admins can manage franchise places" ON public.known_places FOR ALL USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));

-- Franchise Leads: Super admin only
CREATE POLICY "Super admins can manage leads" ON public.franchise_leads FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone can insert leads" ON public.franchise_leads FOR INSERT WITH CHECK (true);

-- Support: User and franchise isolation
CREATE POLICY "Users can view own conversations" ON public.support_conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Franchise admins can view franchise conversations" ON public.support_conversations FOR SELECT USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Anyone can create conversations" ON public.support_conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view messages in own conversations" ON public.support_messages FOR SELECT USING (conversation_id IN (SELECT id FROM public.support_conversations WHERE user_id = auth.uid()));
CREATE POLICY "Franchise admins can view franchise messages" ON public.support_messages FOR SELECT USING (conversation_id IN (SELECT id FROM public.support_conversations WHERE franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid())));
CREATE POLICY "Anyone can insert messages" ON public.support_messages FOR INSERT WITH CHECK (true);

-- Analytics: Franchise isolation
CREATE POLICY "Franchise admins can view franchise analytics" ON public.analytics_events FOR SELECT USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Super admins can view all analytics" ON public.analytics_events FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone can insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- Neighborhood Stats: Franchise isolation
CREATE POLICY "Franchise admins can view franchise stats" ON public.neighborhood_stats FOR SELECT USING (franchise_id IN (SELECT id FROM public.franchises WHERE owner_id = auth.uid()));
CREATE POLICY "Super admins can view all stats" ON public.neighborhood_stats FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_franchises_updated_at BEFORE UPDATE ON public.franchises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_passengers_updated_at BEFORE UPDATE ON public.passengers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_support_conversations_updated_at BEFORE UPDATE ON public.support_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- TRIGGER TO CREATE PROFILE ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;

-- INSERT DEFAULT CITIES
INSERT INTO public.cities (name, state, subdomain, is_active) VALUES
('Jundiaí', 'SP', 'jundiai', true),
('Franca', 'SP', 'franca', true),
('São José do Rio Preto', 'SP', 'riopreto', true),
('Salvador', 'BA', 'salvador', true),
('Passos', 'MG', 'passos', true),
('Aracaju', 'SE', 'aracaju', true);