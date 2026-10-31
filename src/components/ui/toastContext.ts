import { createContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastApi = {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);
