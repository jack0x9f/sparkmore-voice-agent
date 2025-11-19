import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LOCAL_SESSION_TOKEN } from '@/lib/demoAccess';

// Helper function to get client IP (best effort - may not work in all environments)
const getClientIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
};

// Helper function to get user agent
const getUserAgent = (): string => {
  return navigator.userAgent;
};

const SESSION_KEY = 'demo_session_token';

export const useDemoSession = () => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) {
      setIsValid(false);
      setLoading(false);
      return;
    }

    // Allow rotating code sessions, local demo sessions, and test sessions
    if (token === LOCAL_SESSION_TOKEN || token.startsWith('ROTATING_') || token.startsWith('TEST_')) {
      setIsValid(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('validate_demo_session', {
        session_token_param: token
      });
      
      if (error) throw error;
      setIsValid(data);
    } catch (error) {
      console.error('Session validation failed:', error);
      setIsValid(false);
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (accessCode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalized = accessCode.trim().toUpperCase();
      
      // Allow test access code for development
      if (normalized === 'TEST123' || normalized === 'DEMO') {
        const sessionToken = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(SESSION_KEY, sessionToken);
        setIsValid(true);
        return { success: true };
      }
      
      // Get client info for security logging
      const userAgent = getUserAgent();
      const ipAddress = await getClientIP();
      
      // Use the new secure validation function with logging
      const { data: isValidRotating, error: rotatingError } = await supabase.rpc('validate_rotating_access_code_secure', {
        access_code: normalized,
        ip_address_param: ipAddress,
        user_agent_param: userAgent
      });

      if (rotatingError) {
        console.error('Error validating rotating code:', rotatingError);
        return { success: false, error: 'Access verification failed' };
      }
      
      if (isValidRotating) {
        // Create a session token for rotating codes
        const sessionToken = `ROTATING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(SESSION_KEY, sessionToken);
        setIsValid(true);
        
        // Log successful session creation
        try {
          await supabase.rpc('log_security_event', {
            event_type_param: 'demo_session_created',
            ip_address_param: ipAddress,
            user_agent_param: userAgent,
            event_details_param: {
              session_type: 'rotating_code',
              access_code_prefix: normalized.substring(0, 6) + '***'
            },
            risk_level_param: 'low'
          });
        } catch (logError) {
          // Don't fail the session creation if logging fails
          console.warn('Failed to log session creation:', logError);
        }
        
        return { success: true };
      }

      return { success: false, error: 'Invalid or expired access code' };
    } catch (error) {
      return { success: false, error: 'Access verification failed' };
    }
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsValid(false);
  };

  useEffect(() => {
    checkSession();
  }, []);

  return {
    isValid,
    loading,
    createSession,
    clearSession
  };
};