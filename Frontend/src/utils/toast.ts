type ToastType = 'success' | 'error' | 'info';

export interface ToastInfo {
  id: string;
  type: ToastType;
  message: string;
}

let toastListener: ((toast: ToastInfo) => void) | null = null;

export const registerToastListener = (listener: ((toast: ToastInfo) => void) | null) => {
  toastListener = listener;
};

export const addToast = (type: ToastType, message: string) => {
  if (toastListener) {
    toastListener({ id: Math.random().toString(36).slice(2), type, message });
  }
};
