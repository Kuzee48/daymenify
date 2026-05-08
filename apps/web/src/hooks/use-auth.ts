'use client';

import { useCallback } from 'react';

import { apiClient } from '@/lib/api';
import { useAuthStore, type AuthTokens, type User } from '@/store/auth-store';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export function useAuth() {
  const {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    isHydrated,
    login: storeLogin,
    logout: storeLogout,
    setUser,
    setLoading,
  } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      try {
        const response = await apiClient.post<AuthResponse>(
          '/auth/login',
          credentials
        );
        const { user, tokens } = response.data;
        storeLogin(user, tokens);
        return { success: true, user };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        const message =
          err.response?.data?.message || 'Login gagal. Silakan coba lagi.';
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [storeLogin, setLoading]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      setLoading(true);
      try {
        const response = await apiClient.post<AuthResponse>(
          '/auth/register',
          data
        );
        const { user, tokens } = response.data;
        storeLogin(user, tokens);
        return { success: true, user };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        const message =
          err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.';
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [storeLogin, setLoading]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Proceed with local logout even if API call fails
    } finally {
      storeLogout();
    }
  }, [storeLogout]);

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      setLoading(true);
      try {
        const response = await apiClient.patch<{ data: User }>(
          '/auth/profile',
          data
        );
        setUser(response.data);
        return { success: true };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        const message =
          err.response?.data?.message || 'Update gagal. Silakan coba lagi.';
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading]
  );

  return {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    isHydrated,
    login,
    register,
    logout,
    updateProfile,
  };
}
