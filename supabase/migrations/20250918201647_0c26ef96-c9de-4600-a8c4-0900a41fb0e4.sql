-- Fix critical security vulnerability: Session Hijacking Risk Through Exposed Authentication Tokens
-- Remove public read access to demo_sessions table to prevent token theft

-- Drop the overly permissive SELECT policy that allows anyone to read all session tokens
DROP POLICY IF EXISTS "Anyone can read demo sessions for validation" ON public.demo_sessions;

-- Remove the overly permissive UPDATE policy as well for better security
DROP POLICY IF EXISTS "Anyone can update demo sessions" ON public.demo_sessions;

-- Session validation will still work through the validate_demo_session() RPC function
-- which uses SECURITY DEFINER to safely check tokens without exposing the table data

-- Keep the INSERT policy for creating new sessions (needed for access code flow)
-- The "Anyone can create demo sessions" policy remains unchanged