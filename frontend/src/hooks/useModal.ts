import { useContext } from "react";
import { ModalContext } from "../components/modals/modal-context";

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return ctx;
}
