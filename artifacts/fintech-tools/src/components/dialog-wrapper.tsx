import { ReactNode } from "react";
import { Dialog as BaseDialog, DialogContent as BaseDialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

// Minimal wrapper around shadcn Dialog to match design system
export function Dialog({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: ReactNode }) {
  return (
    <BaseDialog open={open} onOpenChange={onOpenChange}>
      {children}
    </BaseDialog>
  )
}

export function DialogContent({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <BaseDialogContent className={`sm:max-w-md bg-card border border-rule p-[24px] rounded-[14px] shadow-lg ${className || ""}`}>
      {children}
    </BaseDialogContent>
  )
}

export { DialogHeader, DialogTitle, DialogDescription };