-- Fix security vulnerability in demo_requests table
-- Remove overly permissive RLS policies that allow any authenticated user to see all customer data

-- First, drop the existing permissive policies
DROP POLICY IF EXISTS "Only authenticated users can view demo requests" ON public.demo_requests;
DROP POLICY IF EXISTS "Only authenticated users can update demo requests" ON public.demo_requests;

-- Create an admin role system for proper access control
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create a user_roles table to manage admin access
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_id_param AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create secure RLS policies for demo_requests
-- Only admins can view demo requests (protecting customer contact info)
CREATE POLICY "Only admins can view demo requests" 
ON public.demo_requests 
FOR SELECT 
TO authenticated
USING (public.is_admin());

-- Only admins can update demo requests  
CREATE POLICY "Only admins can update demo requests" 
ON public.demo_requests 
FOR UPDATE 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only admins can delete demo requests
CREATE POLICY "Only admins can delete demo requests" 
ON public.demo_requests 
FOR DELETE 
TO authenticated
USING (public.is_admin());

-- Anonymous users can still create demo requests (this is needed for the contact form)
-- This policy already exists and is correct

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Only admins can manage roles
CREATE POLICY "Only admins can insert roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (public.is_admin());