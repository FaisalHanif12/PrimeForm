import { useState, useCallback } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      return response;
    } catch (e) {
      console.error('SignIn error:', e);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async ({ fullName, email, password }: { fullName: string; email: string; password: string }) => {
    try {
      setLoading(true);
      const response = await authService.signup({ fullName, email, password });
      return response;
    } catch (e) {
      console.error('SignUp error:', e);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const sendReset = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const response = await authService.forgotPassword(email);
      return response;
    } catch (e) {
      console.error('SendReset error:', e);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string) => {
    try {
      setLoading(true);
      const response = await authService.verifyResetOTP(email, otp);
      return response;
    } catch (e) {
      console.error('VerifyOTP error:', e);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    try {
      setLoading(true);
      const response = await authService.resetPassword(email, otp, newPassword);
      return response;
    } catch (e) {
      console.error('ResetPassword error:', e);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, signIn, signUp, sendReset, verifyOTP, resetPassword };
}


