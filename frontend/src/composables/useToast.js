import { ref } from 'vue';

const toasts = ref([]);

export function useToast() {
  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const toast = {
      id,
      message,
      type,
    };
    
    toasts.value.push(toast);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  return {
    toasts,
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
    removeToast
  };
}
