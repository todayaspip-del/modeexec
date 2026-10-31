import { useState, useRef, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  action?: ToastAction;
  duration?: number;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

export type ShowToastFn = (
  title: string,
  messageOrType?: string | ToastType | ToastOptions,
  maybeTypeOrOptions?: ToastType | ToastOptions,
  options?: ToastOptions
) => void;

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast: ShowToastFn = useCallback(
    (
      title: string,
      messageOrType?: string | ToastType | ToastOptions,
      maybeTypeOrOptions?: ToastType | ToastOptions,
      options?: ToastOptions
    ) => {
      let message = '';
      let type: ToastType = 'success';
      let action: ToastAction | undefined = undefined;
      let duration = 4500;

      if (typeof messageOrType === 'object' && messageOrType !== null) {
        action = messageOrType.action;
        duration = messageOrType.duration ?? (action ? 5000 : 4500);
      } else if (typeof messageOrType === 'string') {
        if (
          messageOrType === 'success' ||
          messageOrType === 'info' ||
          messageOrType === 'warning'
        ) {
          type = messageOrType as ToastType;
          if (typeof maybeTypeOrOptions === 'object' && maybeTypeOrOptions !== null) {
            action = maybeTypeOrOptions.action;
            duration = maybeTypeOrOptions.duration ?? (action ? 5000 : 4500);
          }
        } else {
          message = messageOrType;
          if (typeof maybeTypeOrOptions === 'string') {
            type = maybeTypeOrOptions as ToastType;
            if (options) {
              action = options.action;
              duration = options.duration ?? (action ? 5000 : 4500);
            }
          } else if (typeof maybeTypeOrOptions === 'object' && maybeTypeOrOptions !== null) {
            action = maybeTypeOrOptions.action;
            duration = maybeTypeOrOptions.duration ?? (action ? 5000 : 4500);
          }
        }
      }

      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      setToasts((prev) => [...prev, { id, title, message, type, action }]);

      const timeoutId = setTimeout(() => {
        timeoutsRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);

      timeoutsRef.current.set(id, timeoutId);
    },
    []
  );

  // Clear pending timers on unmount to prevent latent memory leaks
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current.clear();
    };
  }, []);

  return { toasts, showToast, dismissToast };
}
