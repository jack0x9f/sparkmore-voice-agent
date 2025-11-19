-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create demo requests table to track all demo requests
CREATE TABLE public.demo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  access_code_generated UUID REFERENCES public.demo_access_codes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to create demo requests (for the public form)
CREATE POLICY "Anonymous users can create demo requests" 
ON public.demo_requests 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Only authenticated users (admins) can view/manage demo requests
CREATE POLICY "Only authenticated users can view demo requests" 
ON public.demo_requests 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Only authenticated users can update demo requests" 
ON public.demo_requests 
FOR UPDATE 
TO authenticated
USING (true);

-- Create trigger for timestamps
CREATE TRIGGER update_demo_requests_updated_at
BEFORE UPDATE ON public.demo_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate demo access codes
CREATE OR REPLACE FUNCTION public.generate_demo_access_code(
  request_id_param UUID,
  description_param TEXT DEFAULT NULL,
  expires_hours_param INTEGER DEFAULT 24,
  max_uses_param INTEGER DEFAULT 1
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_val TEXT;
  code_record_id UUID;
BEGIN
  -- Generate a readable code (8 characters: 4 letters + 4 numbers)
  code_val := upper(substr(md5(random()::text), 1, 4)) || lpad((random() * 9999)::int::text, 4, '0');
  
  -- Insert the access code
  INSERT INTO public.demo_access_codes (
    code,
    description,
    expires_at,
    max_uses
  ) VALUES (
    code_val,
    COALESCE(description_param, 'Generated for request #' || request_id_param),
    now() + (expires_hours_param || ' hours')::interval,
    max_uses_param
  ) RETURNING id INTO code_record_id;
  
  -- Link the code to the request
  UPDATE public.demo_requests 
  SET access_code_generated = code_record_id,
      status = 'approved',
      updated_at = now()
  WHERE id = request_id_param;
  
  RETURN code_val;
END;
$$;