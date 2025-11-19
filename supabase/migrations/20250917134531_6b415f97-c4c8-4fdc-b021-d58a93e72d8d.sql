-- Update function to generate longer alphanumeric codes
CREATE OR REPLACE FUNCTION public.generate_demo_access_code(
  request_id_param UUID,
  description_param TEXT DEFAULT NULL,
  expires_hours_param INTEGER DEFAULT 24,
  max_uses_param INTEGER DEFAULT 1
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_val TEXT;
  code_record_id UUID;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  -- Generate a 16-character alphanumeric code
  code_val := '';
  FOR i IN 1..16 LOOP
    code_val := code_val || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  
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