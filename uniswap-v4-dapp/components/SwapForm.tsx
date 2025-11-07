"use client";

import { useMemo } from "react";

import { useSwap } from "@/hooks/useSwap";
import { getTokenMetadata } from "@/lib/tokens";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { TokenInput } from "./TokenInput";
import { TransactionToast } from "./TransactionToast";

export function SwapForm() {
  const { status } = useAccount();
  const { openConnectModal } = useConnectModal();
  const {
    state,
    isEstimating,
    isSwapping,
    canSwap,
    toast,
    resetToast,
    switchTokens,
    updateInputToken,
    updateOutputToken,
    updateInputAmount,
    updateSlippage,
    executeSwap,
  } = useSwap();

  const outputToken = useMemo(() => getTokenMetadata(state.outputToken), [state.outputToken]);

  return (
    <div className="rounded-3xl border border-[rgba(87,92,108,0.45)] bg-[#10131c] p-6 text-white shadow-[0_18px_38px_rgba(0,0,0,0.45)]">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Quick Swap</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Intercambia ETH y USDC en cuestión de segundos.</p>
        </div>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(93,99,116,0.4)] bg-[#141826] text-base text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          onClick={switchTokens}
          title="Invertir pares"
        >
          ⇅
        </button>
      </header>

      <div className="mt-5 space-y-4">
        <TokenInput
          label="Pagas"
          token={state.inputToken}
          amount={state.inputAmount}
          onAmountChange={updateInputAmount}
          onTokenSelect={updateInputToken}
          disabled={isSwapping}
        />

        <TokenInput
          label="Recibes"
          token={state.outputToken}
          amount={state.outputAmount}
          onAmountChange={() => {}}
          onTokenSelect={updateOutputToken}
          readOnly
          disabled={isSwapping}
          usdEstimate={state.outputAmount ? `${state.outputAmount} ${outputToken.symbol}` : undefined}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4">
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

        <div className="flex flex-col justify-end text-xs text-[var(--muted)]">
          <span className="uppercase tracking-[0.16em]">Estado</span>
          <span className="mt-1 text-sm font-semibold text-white">
            {isSwapping ? "Ejecutando swap…" : isEstimating ? "Calculando cotización…" : "Listo"}
          </span>
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
          void executeSwap();
        }}
        disabled={status === "connected" ? !canSwap : false}
      >
        {status !== "connected" ? "Conecta tu wallet" : isSwapping ? "Swapping…" : "Swap"}
      </button>

      {toast ? <TransactionToast {...toast} onDismiss={resetToast} /> : null}
    </div>
  );
}

