"use client";

import Image from "next/image";
import { useMemo } from "react";

import { SUPPORTED_TOKENS, getTokenMetadata } from "@/lib/tokens";
import type { TokenSymbol } from "@/types/token";

const tokenIcons: Record<TokenSymbol, string> = {
  ETH: "/eth.svg",
  USDC: "/usdc.svg",
};

type TokenInputProps = {
  label: string;
  token: TokenSymbol;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect?: (symbol: TokenSymbol) => void;
  balance?: string;
  usdEstimate?: string;
  readOnly?: boolean;
  disabled?: boolean;
};

export function TokenInput({
  label,
  token,
  amount,
  onAmountChange,
  onTokenSelect,
  balance,
  usdEstimate,
  readOnly,
  disabled,
}: TokenInputProps) {
  const selectedToken = useMemo(() => getTokenMetadata(token), [token]);

  return (
    <div className="rounded-2xl border border-[rgba(87,92,108,0.45)] bg-[#11141d] p-4 text-white">
      <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{label}</span>
        {balance ? <span className="font-medium text-white/50">{balance}</span> : null}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="a-tooltip" data-tooltip={`${selectedToken.symbol} · ${selectedToken.name}`}>
            <button
              type="button"
              onClick={() => {
                if (!onTokenSelect) return;
                const currentIdx = SUPPORTED_TOKENS.findIndex((item) => item.symbol === token);
                const next = SUPPORTED_TOKENS[(currentIdx + 1) % SUPPORTED_TOKENS.length];
                onTokenSelect(next.symbol);
              }}
              disabled={!onTokenSelect || disabled}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(93,99,116,0.6)] bg-[#0d1019] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Seleccionar token ${selectedToken.symbol}`}
            >
              <span className="sr-only">{selectedToken.symbol}</span>
              <Image src={tokenIcons[token]} alt="" width={24} height={24} priority className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-end gap-1">
          <input
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={amount}
            readOnly={readOnly}
            disabled={disabled}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="0.0"
            className="w-full rounded-xl border border-transparent bg-[#0a0d16] px-4 py-3 text-right text-2xl font-semibold text-white outline-none transition focus:border-[var(--accent)] focus:bg-[#0f1320] disabled:cursor-not-allowed disabled:opacity-60"
          />
          {usdEstimate ? (
            <span className="text-xs font-medium text-[var(--muted)]">≈ {usdEstimate}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

