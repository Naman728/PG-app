import { createContext } from "react";

export type ModalOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm?: () => void | Promise<void>;
};

export type ModalContextValue = {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
};

export const ModalContext = createContext<ModalContextValue | null>(null);
