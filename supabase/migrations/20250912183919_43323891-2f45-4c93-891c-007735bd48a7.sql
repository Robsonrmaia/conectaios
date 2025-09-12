-- Create notifications system tables
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own notifications
CREATE POLICY "Users can manage their own notifications"
ON public.notifications
FOR ALL
USING (auth.uid() = user_id);

-- Create property analytics table
CREATE TABLE public.property_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  views_count INTEGER DEFAULT 0,
  contacts_count INTEGER DEFAULT 0,
  matches_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on property analytics
ALTER TABLE public.property_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for property analytics
CREATE POLICY "Users can view analytics for their properties"
ON public.property_analytics
FOR SELECT
USING (property_id IN (
  SELECT id FROM properties WHERE user_id = auth.uid()
));

CREATE POLICY "System can manage property analytics"
ON public.property_analytics
FOR ALL
USING (true);

-- Create market stats table
CREATE TABLE public.market_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  property_type TEXT,
  listing_type TEXT,
  city TEXT,
  neighborhood TEXT,
  total_count INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  rented_count INTEGER DEFAULT 0,
  avg_price NUMERIC,
  avg_days_to_sell INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on market stats
ALTER TABLE public.market_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for public market stats viewing
CREATE POLICY "Authenticated users can view market stats"
ON public.market_stats
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add auto-cleanup fields to properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS marked_as_sold_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS marked_as_rented_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sale_status TEXT DEFAULT 'available';

-- Create trigger for updating updated_at on notifications
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at on property_analytics
CREATE TRIGGER update_property_analytics_updated_at
BEFORE UPDATE ON public.property_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update property analytics
CREATE OR REPLACE FUNCTION public.update_property_analytics(
  _property_id UUID,
  _activity_type TEXT DEFAULT 'view'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update analytics record
  INSERT INTO public.property_analytics (property_id, last_activity, views_count, contacts_count, matches_count)
  VALUES (
    _property_id, 
    now(), 
    CASE WHEN _activity_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN _activity_type = 'contact' THEN 1 ELSE 0 END,
    CASE WHEN _activity_type = 'match' THEN 1 ELSE 0 END
  )
  ON CONFLICT (property_id) DO UPDATE SET
    last_activity = now(),
    views_count = property_analytics.views_count + CASE WHEN _activity_type = 'view' THEN 1 ELSE 0 END,
    contacts_count = property_analytics.contacts_count + CASE WHEN _activity_type = 'contact' THEN 1 ELSE 0 END,
    matches_count = property_analytics.matches_count + CASE WHEN _activity_type = 'match' THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$;

-- Create function to send notification
CREATE OR REPLACE FUNCTION public.send_notification(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _message TEXT,
  _data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (_user_id, _type, _title, _message, _data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;