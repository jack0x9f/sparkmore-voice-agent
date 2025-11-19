-- Create demo access control tables
CREATE TABLE public.demo_access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create demo sessions table
CREATE TABLE public.demo_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  access_code_id UUID REFERENCES public.demo_access_codes(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for demo_access_codes (public read for validation)
CREATE POLICY "Anyone can read active demo access codes for validation" 
ON public.demo_access_codes 
FOR SELECT 
USING (is_active = true AND expires_at > now());

-- RLS Policies for demo_sessions (public read/write for session management)
CREATE POLICY "Anyone can read demo sessions for validation" 
ON public.demo_sessions 
FOR SELECT 
USING (expires_at > now());

CREATE POLICY "Anyone can create demo sessions" 
ON public.demo_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update demo sessions" 
ON public.demo_sessions 
FOR UPDATE 
USING (expires_at > now());

-- Insert a sample access code for testing (expires in 30 days)
INSERT INTO public.demo_access_codes (code, description, max_uses, expires_at) 
VALUES ('DEMO2024', 'Demo access code for testing', 50, now() + interval '30 days');

-- Create function to validate access codes
CREATE OR REPLACE FUNCTION public.validate_demo_access_code(access_code TEXT)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create demo session
CREATE OR REPLACE FUNCTION public.create_demo_session(
  access_code_id_param UUID,
  ip_address_param INET,
  user_agent_param TEXT
)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate demo session
CREATE OR REPLACE FUNCTION public.validate_demo_session(session_token_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.demo_sessions 
    WHERE session_token = session_token_param 
      AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;