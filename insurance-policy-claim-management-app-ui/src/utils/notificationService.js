import toast from 'react-hot-toast';

/**
 * Enterprise standard notification service.
 * Uses the backend as the single source of truth for messages.
 */
class NotificationService {

  success(response, fallback = "Operation successful") {
    const message = typeof response === 'string' ? response : (response?.message || fallback);
    toast.success(message, { duration: 3000 });
  }

  error(error, fallback = "An unexpected error occurred") {
    const message = typeof error === 'string' ? error : (error?.message || fallback);
    toast.error(message, { duration: 4000 });
  }

  warning(message, duration = 4000) {
    const text = typeof message === 'string' ? message : (message?.message || "Warning");
    toast(text, { 
      duration,
      icon: '⚠️',
      style: {
        borderLeft: '4px solid #f59e0b'
      }
    });
  }

  info(message, duration = 3000) {
    const text = typeof message === 'string' ? message : (message?.message || "Information");
    toast(text, {
      duration,
      icon: 'ℹ️',
      style: {
        borderLeft: '4px solid #3b82f6'
      }
    });
  }
}

export const notify = new NotificationService();
