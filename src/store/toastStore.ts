import { create } from 'zustand';

export type ToastType = 'success' | 'error';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'success',
  show: (message, type = 'success') => {
    if (timer) clearTimeout(timer);
    set({ visible: true, message, type });
    timer = setTimeout(
      () => {
        set({ visible: false });
        timer = null;
      },
      type === 'error' ? 5000 : 3000,
    );
  },
  hide: () => {
    if (timer) clearTimeout(timer);
    set({ visible: false });
  },
}));
