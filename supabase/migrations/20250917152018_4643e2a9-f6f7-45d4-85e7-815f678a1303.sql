-- Create a table for managing rotating access codes
CREATE TABLE public.rotating_access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT 50 -- Allow multiple uses per code
);

-- Enable Row Level Security
ALTER TABLE public.rotating_access_codes ENABLE ROW LEVEL SECURITY;

-- Policy for reading active codes (for validation)
CREATE POLICY "Anyone can read active rotating codes for validation" 
ON public.rotating_access_codes 
FOR SELECT 
USING (is_active = true AND expires_at > now());

-- Create function to generate new rotating access codes
CREATE OR REPLACE FUNCTION public.generate_rotating_access_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  code_val TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  -- Deactivate old codes
  UPDATE public.rotating_access_codes 
  SET is_active = false 
  WHERE is_active = true AND expires_at <= now();
  
  -- Generate a 20-character alphanumeric code
  code_val := 'SPARK-';
  FOR i IN 1..15 LOOP
    code_val := code_val || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  
  -- Insert the new access code (expires in 7 days)
  INSERT INTO public.rotating_access_codes (
    code,
    expires_at,
    max_uses
  ) VALUES (
    code_val,
    now() + interval '7 days',
    100
  );
  
  RETURN code_val;
END;
$function$;

-- Create function to validate rotating access codes
CREATE OR REPLACE FUNCTION public.validate_rotating_access_code(access_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  code_record public.rotating_access_codes%ROWTYPE;
BEGIN
  SELECT * INTO code_record 
  FROM public.rotating_access_codes 
  WHERE code = access_code 
    AND is_active = true 
    AND expires_at > now()
    AND (max_uses IS NULL OR usage_count < max_uses);
    
  IF FOUND THEN
    -- Update usage count and last used
    UPDATE public.rotating_access_codes 
    SET usage_count = usage_count + 1,
        last_used_at = now()
    WHERE id = code_record.id;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$function$;

-- Generate the first code
SELECT public.generate_rotating_access_code();