-- Security Enhancement Migration: Implement comprehensive security logging and monitoring
-- This addresses the optional security enhancements from the security review

-- 1. Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'admin_action', 'suspicious_login', 'code_validation', etc.
    user_id UUID, -- Can be null for anonymous events
    session_token TEXT,
    ip_address INET,
    user_agent TEXT,
    event_details JSONB DEFAULT '{}',
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID
);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view all audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (public.is_admin());

-- System can insert audit logs (no user restriction for system events)
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Only admins can resolve audit logs
CREATE POLICY "Admins can update audit logs" 
ON public.security_audit_logs 
FOR UPDATE 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. Create session anomaly tracking
CREATE TABLE IF NOT EXISTS public.session_anomalies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT NOT NULL,
    anomaly_type TEXT NOT NULL, -- 'ip_change', 'location_change', 'rapid_requests', etc.
    previous_value TEXT,
    current_value TEXT,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    investigated BOOLEAN DEFAULT false,
    false_positive BOOLEAN DEFAULT false
);

-- Enable RLS on session anomalies
ALTER TABLE public.session_anomalies ENABLE ROW LEVEL SECURITY;

-- Only admins can access anomaly data
CREATE POLICY "Admins can manage session anomalies" 
ON public.session_anomalies 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Create security logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type_param TEXT,
    user_id_param UUID DEFAULT NULL,
    session_token_param TEXT DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    event_details_param JSONB DEFAULT '{}',
    risk_level_param TEXT DEFAULT 'low'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.security_audit_logs (
        event_type,
        user_id,
        session_token,
        ip_address,
        user_agent,
        event_details,
        risk_level
    ) VALUES (
        event_type_param,
        user_id_param,
        session_token_param,
        ip_address_param,
        user_agent_param,
        event_details_param,
        risk_level_param
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- 4. Create anomaly detection function
CREATE OR REPLACE FUNCTION public.detect_session_anomaly(
    session_token_param TEXT,
    current_ip INET,
    current_user_agent TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    last_ip INET;
    last_user_agent TEXT;
    anomaly_detected BOOLEAN := false;
BEGIN
    -- Get the most recent IP and user agent for this session
    SELECT ds.ip_address, ds.user_agent
    INTO last_ip, last_user_agent
    FROM public.demo_sessions ds
    WHERE ds.session_token = session_token_param
    AND ds.expires_at > now()
    ORDER BY ds.created_at DESC
    LIMIT 1;
    
    -- Check for IP address change (excluding private/local networks)
    IF last_ip IS NOT NULL AND last_ip != current_ip THEN
        -- Only flag public IP changes as anomalous
        IF NOT (last_ip << '10.0.0.0/8'::inet OR 
                last_ip << '172.16.0.0/12'::inet OR 
                last_ip << '192.168.0.0/16'::inet OR
                current_ip << '10.0.0.0/8'::inet OR 
                current_ip << '172.16.0.0/12'::inet OR 
                current_ip << '192.168.0.0/16'::inet) THEN
            
            INSERT INTO public.session_anomalies (
                session_token, anomaly_type, previous_value, current_value, confidence_score
            ) VALUES (
                session_token_param, 'ip_change', host(last_ip), host(current_ip), 0.75
            );
            
            anomaly_detected := true;
        END IF;
    END IF;
    
    -- Check for significant user agent change
    IF last_user_agent IS NOT NULL AND last_user_agent != current_user_agent THEN
        -- Simple heuristic: if user agent is completely different, flag it
        IF length(last_user_agent) > 10 AND length(current_user_agent) > 10 THEN
            INSERT INTO public.session_anomalies (
                session_token, anomaly_type, previous_value, current_value, confidence_score
            ) VALUES (
                session_token_param, 'user_agent_change', last_user_agent, current_user_agent, 0.60
            );
            
            anomaly_detected := true;
        END IF;
    END IF;
    
    -- Log security event if anomaly detected
    IF anomaly_detected THEN
        PERFORM public.log_security_event(
            'session_anomaly_detected',
            NULL,
            session_token_param,
            current_ip,
            current_user_agent,
            jsonb_build_object(
                'anomaly_types', ARRAY['ip_change', 'user_agent_change'],
                'previous_ip', host(last_ip),
                'current_ip', host(current_ip)
            ),
            'medium'
        );
    END IF;
    
    RETURN anomaly_detected;
END;
$$;

-- 5. Enhanced access code validation with security logging
CREATE OR REPLACE FUNCTION public.validate_demo_access_code_secure(
    access_code TEXT,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    code_record public.demo_access_codes%ROWTYPE;
    validation_result UUID;
BEGIN
    -- Call original validation function
    validation_result := public.validate_demo_access_code(access_code);
    
    -- Log the validation attempt
    IF validation_result IS NOT NULL THEN
        -- Successful validation
        PERFORM public.log_security_event(
            'demo_code_validation_success',
            NULL,
            NULL,
            ip_address_param,
            user_agent_param,
            jsonb_build_object(
                'access_code_id', validation_result,
                'code_prefix', left(access_code, 4) || '***'
            ),
            'low'
        );
    ELSE
        -- Failed validation - potential brute force attempt
        PERFORM public.log_security_event(
            'demo_code_validation_failed',
            NULL,
            NULL,
            ip_address_param,
            user_agent_param,
            jsonb_build_object(
                'attempted_code', left(access_code, 4) || '***'
            ),
            'medium'
        );
        
        -- Check for rapid failed attempts from same IP (simple rate limiting detection)
        IF (SELECT COUNT(*) 
            FROM public.security_audit_logs 
            WHERE event_type = 'demo_code_validation_failed'
            AND ip_address = ip_address_param
            AND created_at > now() - interval '5 minutes') > 5 THEN
            
            -- Log high-risk brute force attempt
            PERFORM public.log_security_event(
                'potential_brute_force_attack',
                NULL,
                NULL,
                ip_address_param,
                user_agent_param,
                jsonb_build_object(
                    'failed_attempts_in_5min', (
                        SELECT COUNT(*) 
                        FROM public.security_audit_logs 
                        WHERE event_type = 'demo_code_validation_failed'
                        AND ip_address = ip_address_param
                        AND created_at > now() - interval '5 minutes'
                    )
                ),
                'high'
            );
        END IF;
    END IF;
    
    RETURN validation_result;
END;
$$;

-- 6. Enhanced rotating code validation with security logging
CREATE OR REPLACE FUNCTION public.validate_rotating_access_code_secure(
    access_code TEXT,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    validation_result BOOLEAN;
BEGIN
    -- Call original validation function
    validation_result := public.validate_rotating_access_code(access_code);
    
    -- Log the validation attempt
    IF validation_result THEN
        PERFORM public.log_security_event(
            'rotating_code_validation_success',
            NULL,
            NULL,
            ip_address_param,
            user_agent_param,
            jsonb_build_object(
                'code_prefix', left(access_code, 6) || '***'
            ),
            'low'
        );
    ELSE
        PERFORM public.log_security_event(
            'rotating_code_validation_failed',
            NULL,
            NULL,
            ip_address_param,
            user_agent_param,
            jsonb_build_object(
                'attempted_code', left(access_code, 6) || '***'
            ),
            'medium'
        );
    END IF;
    
    RETURN validation_result;
END;
$$;

-- 7. Admin activity logging trigger function
CREATE OR REPLACE FUNCTION public.log_admin_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Only log if the current user is an admin
    IF public.is_admin() THEN
        PERFORM public.log_security_event(
            'admin_' || TG_OP || '_' || TG_TABLE_NAME,
            auth.uid(),
            NULL,
            NULL,
            NULL,
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'operation', TG_OP,
                'old_data', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
                'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
            ),
            'low'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 8. Apply admin activity logging to sensitive tables
CREATE TRIGGER audit_demo_access_codes_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.demo_access_codes
    FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity();

CREATE TRIGGER audit_demo_requests_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.demo_requests
    FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity();

CREATE TRIGGER audit_user_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity();

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_risk_level ON public.security_audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_ip_address ON public.security_audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_session_anomalies_session_token ON public.session_anomalies(session_token);
CREATE INDEX IF NOT EXISTS idx_session_anomalies_created_at ON public.session_anomalies(created_at);

-- 10. Create a function to get security dashboard data (instead of a view with RLS)
CREATE OR REPLACE FUNCTION public.get_security_dashboard(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    event_type TEXT,
    risk_level TEXT,
    event_count BIGINT,
    unique_ips BIGINT,
    unique_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Only allow admins to access security dashboard
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        DATE(sal.created_at) as date,
        sal.event_type,
        sal.risk_level,
        COUNT(*) as event_count,
        COUNT(DISTINCT sal.ip_address) as unique_ips,
        COUNT(DISTINCT sal.user_id) as unique_users
    FROM public.security_audit_logs sal
    WHERE sal.created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
    GROUP BY DATE(sal.created_at), sal.event_type, sal.risk_level
    ORDER BY date DESC, event_count DESC;
END;
$$;