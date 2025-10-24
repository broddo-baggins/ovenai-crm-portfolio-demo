
import { useState } from 'react';
import { toast } from "sonner";
import { API_URL } from '@/lib/config';

export const useRegistrationHandler = () => {
  const [loading, setLoading] = useState(false);

  const register = async (email: string, password: string, name?: string): Promise<void> => {
    setLoading(true);
    
    try {
      // Call register API
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      await response.json();
      
      toast.success('Registration submitted successfully! Awaiting admin approval.');
      
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    loading
  };
};
