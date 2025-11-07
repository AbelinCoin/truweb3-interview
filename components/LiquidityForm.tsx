"use client";

import { useLiquidity } from "@/hooks/useLiquidity";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { TokenInput } from "./TokenInput";
import { TransactionToast } from "./TransactionToast";

export function LiquidityForm() {
  const { status } = useAccount();
  const { openConnectModal } = useConnectModal();
  const {
    state,
    toast,
    resetToast,
    isSubmitting,
    canSubmit,
    updateAmountA,
    updateAmountB,
    updateSlippage,
    updateDeadline,
    toggleFullRange,
    executeAddLiquidity,
  } = useLiquidity();

  return (
    <div className="rounded-3xl border border-[rgba(87,92,108,0.45)] bg-[#10131c] p-6 text-white shadow-[0_18px_38px_rgba(0,0,0,0.45)]">
      <header>
        <h2 className="text-lg font-semibold text-white">Añadir liquidez</h2>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Aporta ETH y USDC equilibrados para acuñar una posición en el Pool Manager v4.
        </p>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <TokenInput
          label="Monto"
          token={state.tokenA}
          amount={state.amountA}
          onAmountChange={updateAmountA}
          disabled={isSubmitting}
        />
        <TokenInput
          label="Monto"
          token={state.tokenB}
          amount={state.amountB}
          onAmountChange={updateAmountB}
          disabled={isSubmitting}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--muted)]">
            Slippage (%)
          </span>
          <input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={state.slippage}
            onChange={(event) => updateSlippage(event.target.value)}
            className="rounded-xl border border-[rgba(93,99,116,0.45)] bg-[#0d1018] px-3 py-2 text-right text-base font-semibold text-white outline-none transition focus:border-[var(--accent)]"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--muted)]">
            Deadline (min)
          </span>
          <input
            type="number"
            min={1}
            max={120}
            value={state.deadlineMinutes}
            onChange={(event) => updateDeadline(Number(event.target.value))}
            className="rounded-xl border border-[rgba(93,99,116,0.45)] bg-[#0d1018] px-3 py-2 text-right text-base font-semibold text-white outline-none transition focus:border-[var(--accent)]"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--muted)]">Rango</span>
          <button
            type="button"
            onClick={toggleFullRange}
            className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
              state.fullRange
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[rgba(93,99,116,0.45)] bg-[#0d1018] text-white hover:border-[var(--accent)]"
            }`}
          >
            {state.fullRange ? "Rango completo" : "Rango personalizado"}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="accent-button mt-6 w-full px-6 py-3 text-center text-base font-semibold text-[#041b0d] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => {
          if (status !== "connected") {
            openConnectModal?.();
            return;
          }
          void executeAddLiquidity();
        }}
        disabled={status === "connected" ? !canSubmit : false}
      >
        {status !== "connected" ? "Conecta tu wallet" : isSubmitting ? "Confirmando…" : "Añadir liquidez"}
      </button>

      {toast ? <TransactionToast {...toast} onDismiss={resetToast} /> : null}
    </div>
  );
}

