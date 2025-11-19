-- Fix critical security vulnerability: Demo Access Codes Could Be Stolen and Misused
-- Remove public read access to access code tables to prevent code enumeration attacks

-- Drop the overly permissive SELECT policy on demo_access_codes
DROP POLICY IF EXISTS "Anyone can read active demo access codes for validation" ON public.demo_access_codes;

-- Drop the overly permissive SELECT policy on rotating_access_codes  
DROP POLICY IF EXISTS "Anyone can read active rotating codes for validation" ON public.rotating_access_codes;

-- Access code validation will continue to work through the secure RPC functions:
-- - validate_demo_access_code() 
-- - validate_rotating_access_code()
-- These use SECURITY DEFINER to safely validate codes without exposing table data