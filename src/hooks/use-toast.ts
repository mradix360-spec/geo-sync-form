import type { ReactNode } from "react";
import { toast as sonnerToast } from "@/components/ui/sonner";

export type ToastProps = {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
};

export type ToastActionElement = ReactNode;

export function useToast() {
  return {
    toasts: [] as never[],
    toast: ({ title, description }: ToastProps) =>
      sonnerToast(String(title ?? ""), description ? { description: String(description as any) } : undefined),
    dismiss: (id?: string) => sonnerToast.dismiss(id),
  };
}

export const toast = (props: ToastProps | string) => {
  if (typeof props === "string") return sonnerToast(props);
  const { title, description } = props;
  return sonnerToast(String(title ?? ""), description ? { description: String(description as any) } : undefined);
};