import { useWorkspace } from './useWorkspace';

export function useNotifications() {
  const { notifications, addNotification, dismissNotification } = useWorkspace();
  
  return {
    notifications,
    notify: addNotification,
    dismiss: dismissNotification,
    success: (msg: string, dur?: number) => addNotification(msg, 'success', dur),
    error: (msg: string, dur?: number) => addNotification(msg, 'error', dur),
    warning: (msg: string, dur?: number) => addNotification(msg, 'warning', dur),
    info: (msg: string, dur?: number) => addNotification(msg, 'info', dur),
  };
}
