import { useState, useCallback } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      await authService.login(email, password);
      return true;
    } catch (e) {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async ({ name, email, password }: { name: string; email: string; password: string }) => {
    try {
      setLoading(true);
      await authService.signup({ name, email, password });
      return true;
    } catch (e) {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendReset = useCallback(async (email: string) => {
    try {
      setLoading(true);
      await authService.forgotPassword(email);
      return true;
    } catch (e) {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, signIn, signUp, sendReset };
}


