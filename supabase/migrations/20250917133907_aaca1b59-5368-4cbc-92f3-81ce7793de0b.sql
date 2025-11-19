-- Fix security warnings by updating functions with proper search_path

-- Update existing functions with proper search_path
CREATE OR REPLACE FUNCTION public.validate_demo_access_code(access_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  code_record public.demo_access_codes%ROWTYPE;
BEGIN
  SELECT * INTO code_record 
  FROM public.demo_access_codes 
  WHERE code = access_code 
    AND is_active = true 
    AND expires_at > now()
    AND (max_uses IS NULL OR used_count < max_uses);
    
  IF FOUND THEN
    -- Update usage count
    UPDATE public.demo_access_codes 
    SET used_count = used_count + 1,
        last_activity = now()
    WHERE id = code_record.id;
    
    RETURN code_record.id;
  ELSE
    RETURN NULL;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_demo_session(access_code_id_param uuid, ip_address_param inet, user_agent_param text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  session_token_val TEXT;
BEGIN
  session_token_val := encode(gen_random_bytes(32), 'base64');
  
  INSERT INTO public.demo_sessions (
    session_token, 
    access_code_id, 
    ip_address, 
    user_agent, 
    expires_at
  ) VALUES (
    session_token_val,
    access_code_id_param,
    ip_address_param,
    user_agent_param,
    now() + interval '24 hours'
  );
  
  RETURN session_token_val;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_demo_session(session_token_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.demo_sessions 
    WHERE session_token = session_token_param 
      AND expires_at > now()
  );
END;
$function$;

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