-- Criar tabela de motoristas
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle_type TEXT,
  license_plate TEXT,
  status TEXT NOT NULL DEFAULT 'disponivel',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas RLS para drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drivers"
  ON public.drivers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drivers"
  ON public.drivers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drivers"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drivers"
  ON public.drivers FOR DELETE
  USING (auth.uid() = user_id);

-- Criar tabela de rotas
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  driver_id UUID REFERENCES public.drivers(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planejada',
  date DATE NOT NULL,
  origin_address TEXT,
  origin_lat DECIMAL(10, 8),
  origin_lng DECIMAL(11, 8),
  destination_address TEXT,
  destination_lat DECIMAL(10, 8),
  destination_lng DECIMAL(11, 8),
  total_distance DECIMAL(10, 2),
  estimated_duration INTEGER,
  optimization_type TEXT DEFAULT 'distance',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas RLS para routes
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routes"
  ON public.routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routes"
  ON public.routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routes"
  ON public.routes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routes"
  ON public.routes FOR DELETE
  USING (auth.uid() = user_id);

-- Criar tabela de paradas das rotas
CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  coleta_id UUID REFERENCES public.coletas(id),
  stop_order INTEGER NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  type TEXT NOT NULL CHECK (type IN ('coleta', 'entrega')),
  status TEXT NOT NULL DEFAULT 'pendente',
  scheduled_time TIMESTAMP WITH TIME ZONE,
  completed_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas RLS para route_stops
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stops from their routes"
  ON public.route_stops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_stops.route_id
      AND routes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stops to their routes"
  ON public.route_stops FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_stops.route_id
      AND routes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stops from their routes"
  ON public.route_stops FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_stops.route_id
      AND routes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stops from their routes"
  ON public.route_stops FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.routes
      WHERE routes.id = route_stops.route_id
      AND routes.user_id = auth.uid()
    )
  );