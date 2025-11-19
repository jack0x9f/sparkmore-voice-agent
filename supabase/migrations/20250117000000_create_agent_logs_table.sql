-- Agent logs table for tracking AI agent interactions
-- This migration creates the necessary infrastructure for logging AI agent activities

-- Create agent_logs table
CREATE TABLE IF NOT EXISTS public.agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_input TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    result JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE public.agent_logs IS 'Stores all AI agent interaction logs including user inputs, actions taken, and results';
COMMENT ON COLUMN public.agent_logs.session_id IS 'Unique session identifier (UUID v4)';
COMMENT ON COLUMN public.agent_logs.user_input IS 'Original user command/input text';
COMMENT ON COLUMN public.agent_logs.action_taken IS 'Action type executed (e.g., email.send, whatsapp.send)';
COMMENT ON COLUMN public.agent_logs.result IS 'JSON result from the action execution';
COMMENT ON COLUMN public.agent_logs.context IS 'Request context (channel, locale, etc.)';

-- Enable Row Level Security
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can insert logs (for the edge function)
CREATE POLICY "Service role can insert agent logs" 
ON public.agent_logs 
FOR INSERT 
WITH CHECK (true);

-- Policy: Allow authenticated users to view logs (simplified - no user_roles dependency)
CREATE POLICY "Authenticated users can view agent logs" 
ON public.agent_logs 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update logs (simplified - no user_roles dependency)
CREATE POLICY "Authenticated users can update agent logs" 
ON public.agent_logs 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX idx_agent_logs_session_id ON public.agent_logs(session_id);
CREATE INDEX idx_agent_logs_created_at ON public.agent_logs(created_at DESC);
CREATE INDEX idx_agent_logs_action_taken ON public.agent_logs(action_taken);
CREATE INDEX idx_agent_logs_created_at_action ON public.agent_logs(created_at DESC, action_taken);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_agent_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_agent_logs_updated_at
    BEFORE UPDATE ON public.agent_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_logs_updated_at();

-- Grant necessary permissions
GRANT INSERT ON public.agent_logs TO service_role;
GRANT SELECT, UPDATE ON public.agent_logs TO authenticated;

-- Create a view for easy querying of recent agent activity
CREATE OR REPLACE VIEW public.recent_agent_activity AS
SELECT 
    id,
    session_id,
    user_input,
    action_taken,
    result->>'detail' as detail,
    result->>'provider' as provider,
    (result->>'duration_ms')::integer as duration_ms,
    context->>'channel' as channel,
    context->>'locale' as locale,
    created_at
FROM public.agent_logs
ORDER BY created_at DESC
LIMIT 100;

-- Grant view access to authenticated users
GRANT SELECT ON public.recent_agent_activity TO authenticated;