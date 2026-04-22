/**
 * Toast notification hook — lightweight wrapper around react-hot-toast.
 *
 * Usage:
 *   import { useToast } from "~/components/Toast";
 *   const toast = useToast();
 *   toast.success("操作成功");
 *   toast.error("出错了");
 *
 * The actual <Toaster /> is rendered once in __root.tsx via react-hot-toast.
 * This hook simply re-exports the toast singleton so consumers have a
 * consistent import path and can later be swapped to a custom implementation
 * without touching every call-site.
 */

import toast from "react-hot-toast";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastHelpers {
  success: (message: string) => ReturnType<typeof toast.success>;
  error: (message: string) => ReturnType<typeof toast.error>;
  warning: (message: string) => ReturnType<typeof toast>;
  info: (message: string) => ReturnType<typeof toast>;
  loading: (message: string) => ReturnType<typeof toast.loading>;
  dismiss: (id?: string) => void;
}

/**
 * Convenience hook that returns toast helpers for each variant.
 * Auto-dismiss is configured globally in __root.tsx (duration: 4000).
 */
export function useToast(): ToastHelpers {
  return {
    success: (message: string) =>
      toast.success(message, {
        duration: 3000,
        ariaProps: { role: "status", "aria-live": "polite" },
      }),
    error: (message: string) =>
      toast.error(message, {
        duration: 3000,
        ariaProps: { role: "alert", "aria-live": "assertive" },
      }),
    warning: (message: string) =>
      toast(message, {
        icon: "⚠️",
        duration: 3000,
        style: { borderLeft: "4px solid #f59e0b" },
        ariaProps: { role: "status", "aria-live": "polite" },
      }),
    info: (message: string) =>
      toast(message, {
        icon: "ℹ️",
        duration: 3000,
        style: { borderLeft: "4px solid #3b82f6" },
        ariaProps: { role: "status", "aria-live": "polite" },
      }),
    loading: (message: string) => toast.loading(message),
    dismiss: (id?: string) => toast.dismiss(id),
  };
}

// Re-export the raw toast for edge cases that need the full API
export { toast };
