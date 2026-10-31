import { useMutation } from '@tanstack/react-query';
import {
  register,
  requestPasswordReset,
  signIn,
  signOut,
  updatePassword,
  type RegisterInput,
} from '../services/authService';

export function useSignIn() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signIn(email, password),
  });
}

export function useRegister() {
  return useMutation({ mutationFn: (input: RegisterInput) => register(input) });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: (email: string) => requestPasswordReset(email) });
}

export function useUpdatePassword() {
  return useMutation({ mutationFn: (password: string) => updatePassword(password) });
}

export function useSignOut() {
  return useMutation({ mutationFn: signOut });
}
