-- Create core tables for ConectaIOS real estate platform (handling existing types)

-- Create enum types only if they don't exist
DO $$ BEGIN
    CREATE TYPE public.property_status AS ENUM ('active', 'sold', 'rented', 'inactive', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.property_type AS ENUM ('apartment', 'house', 'commercial', 'land', 'farm');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'broker', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'broker',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (drop if exists first)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;  
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create conectaios_brokers table
CREATE TABLE IF NOT EXISTS public.conectaios_brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  creci TEXT,
  company_name TEXT,
  company_phone TEXT,
  website TEXT,
  bio TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 6.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.conectaios_brokers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brokers can manage their own data" ON public.conectaios_brokers;
CREATE POLICY "Brokers can manage their own data" ON public.conectaios_brokers
  FOR ALL USING (auth.uid() = user_id);

-- Create conectaios_properties table  
CREATE TABLE IF NOT EXISTS public.conectaios_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type property_type DEFAULT 'apartment',
  status property_status DEFAULT 'active',
  price DECIMAL(12,2),
  area DECIMAL(8,2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking_spots INTEGER,
  address TEXT,
  city TEXT,
  state TEXT,
  zipcode TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  photos TEXT[],
  video_url TEXT,
  tour_360_url TEXT,
  condominium_fee DECIMAL(10,2),
  iptu DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.conectaios_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own properties" ON public.conectaios_properties;
CREATE POLICY "Users can manage their own properties" ON public.conectaios_properties
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.conectaios_properties;
CREATE POLICY "Properties are viewable by everyone" ON public.conectaios_properties
  FOR SELECT USING (true);

-- Create conectaios_clients table
CREATE TABLE IF NOT EXISTS public.conectaios_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  preferred_locations TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.conectaios_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own clients" ON public.conectaios_clients;
CREATE POLICY "Users can manage their own clients" ON public.conectaios_clients
  FOR ALL USING (auth.uid() = user_id);

-- Create deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.conectaios_properties(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.conectaios_clients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'negotiating',
  offer_amount DECIMAL(12,2),
  commission_amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own deals" ON public.deals;
CREATE POLICY "Users can manage their own deals" ON public.deals
  FOR ALL USING (auth.uid() = user_id);

-- Create conectaios_tasks table
CREATE TABLE IF NOT EXISTS public.conectaios_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.conectaios_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.conectaios_tasks;
CREATE POLICY "Users can manage their own tasks" ON public.conectaios_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Create conectaios_notes table
CREATE TABLE IF NOT EXISTS public.conectaios_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.conectaios_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own notes" ON public.conectaios_notes;
CREATE POLICY "Users can manage their own notes" ON public.conectaios_notes
  FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps  
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conectaios_brokers_updated_at ON public.conectaios_brokers;
CREATE TRIGGER update_conectaios_brokers_updated_at
  BEFORE UPDATE ON public.conectaios_brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conectaios_properties_updated_at ON public.conectaios_properties;
CREATE TRIGGER update_conectaios_properties_updated_at
  BEFORE UPDATE ON public.conectaios_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conectaios_clients_updated_at ON public.conectaios_clients;
CREATE TRIGGER update_conectaios_clients_updated_at
  BEFORE UPDATE ON public.conectaios_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conectaios_tasks_updated_at ON public.conectaios_tasks;
CREATE TRIGGER update_conectaios_tasks_updated_at
  BEFORE UPDATE ON public.conectaios_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conectaios_notes_updated_at ON public.conectaios_notes;
CREATE TRIGGER update_conectaios_notes_updated_at
  BEFORE UPDATE ON public.conectaios_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();