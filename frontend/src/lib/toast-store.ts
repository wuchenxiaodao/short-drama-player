import { create } from 'zustand';

interface ToastState {
  message: string;
  type: 'error' | 'success' | 'info';
  visible: boolean;
  showToast: (message: string, type?: 'error' | 'success' | 'info') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  showToast: (message, type = 'info') => set({ message, type, visible: true }),
  hideToast: () => set({ visible: false }),
}));
