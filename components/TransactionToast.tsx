"use client";

import { useEffect } from "react";

type ToastStatus = "pending" | "success" | "error";

export interface TransactionToastProps {
  status: ToastStatus;
  message: string;
  hash?: string;
  onDismiss?: () => void;
}

const statusStyles: Record<ToastStatus, string> = {
  pending: "a-alert--info",
  success: "a-alert--primary",
  error: "a-alert--warn",
};

export function TransactionToast({ status, message, hash, onDismiss }: TransactionToastProps) {
  useEffect(() => {
    if (status === "success") {
      const timeout = setTimeout(() => onDismiss?.(), 5000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [status, onDismiss]);

  return (
    <div className="fixed top-6 right-6 z-50 flex w-[320px] flex-col gap-3">
      <div
        className={`a-alert ${statusStyles[status]} glass-card toast-animate rounded-2xl border border-[rgba(82,88,103,0.55)] bg-[#10131c] text-white shadow-[0_18px_40px_rgba(0,0,0,0.55)]`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="a-alert--title text-base font-semibold tracking-wide text-white">
              {status === "pending" && "Transacción en curso"}
              {status === "success" && "Transacción confirmada"}
              {status === "error" && "Transacción fallida"}
            </p>
            <p className="a-alert--subTitle mt-1 text-sm text-slate-100/80">{message}</p>
            {hash ? (
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]"
              >
                Ver en Etherscan ↗
              </a>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="a-button is-circle a-button--medium bg-[#151925]/70 text-white hover:bg-[#1c2130]"
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

