"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CurrencyAmount, TradeType } from "@uniswap/sdk-core";
import { SwapRouter } from "@uniswap/universal-router-sdk";
import { parseUnits, formatUnits } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { createTrade, parseSlippage, resolveZeroForOne, buildPool } from "@/lib/pool";
import { getToken, nativeCurrency } from "@/lib/tokens";
import type { TokenSymbol } from "@/types/token";
import type { TransactionToastProps } from "@/components/TransactionToast";
import { assertAddress } from "@/lib/config";
import { PERMIT2_ABI, QUOTER_ABI } from "@/lib/abis";

type SwapState = {
  inputToken: TokenSymbol;
  outputToken: TokenSymbol;
  inputAmount: string;
  outputAmount: string;
  slippage: string;
};

const INITIAL_STATE: SwapState = {
  inputToken: "ETH",
  outputToken: "USDC",
  inputAmount: "",
  outputAmount: "",
  slippage: "0.50",
};

const MAX_UINT_160 = (1n << 160n) - 1n;
const PERMIT_BUFFER_SECONDS = 600n;
const ONE_YEAR_SECONDS = 365n * 24n * 60n * 60n;

function getCurrency(symbol: TokenSymbol) {
  if (symbol === "ETH") {
    if (!nativeCurrency) {
      throw new Error("Native currency not configured");
    }
    return nativeCurrency;
  }
  return getToken(symbol);
}

function formatAmount(value: bigint, decimals: number, precision = 6) {
  const formatted = formatUnits(value, decimals);
  if (!formatted.includes(".")) return formatted;
  const [whole, frac] = formatted.split(".");
  const trimmed = frac.slice(0, precision).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

export function useSwap() {
  const { address, status } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState<SwapState>(INITIAL_STATE);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [toast, setToast] = useState<TransactionToastProps | null>(null);
  const [poolContext, setPoolContext] = useState<Awaited<ReturnType<typeof buildPool>> | null>(null);

  const resetToast = useCallback(() => setToast(null), []);

  const loadPool = useCallback(async () => {
    if (!publicClient) return;
    try {
      const context = await buildPool(publicClient);
      setPoolContext(context);
    } catch (error) {
      console.error("Failed to load pool", error);
      const message = error instanceof Error ? error.message : String(error);
      console.error("Failed to load pool message:", message);
    }
  }, [publicClient]);

  useEffect(() => {
    void loadPool();
  }, [loadPool]);

  const switchTokens = useCallback(() => {
    setState((current) => ({
      ...current,
      inputToken: current.outputToken,
      outputToken: current.inputToken,
      inputAmount: current.outputAmount,
      outputAmount: current.inputAmount,
    }));
  }, []);

  const updateInputToken = useCallback((symbol: TokenSymbol) => {
    setState((current) => ({ ...current, inputToken: symbol }));
  }, []);

  const updateOutputToken = useCallback((symbol: TokenSymbol) => {
    setState((current) => ({ ...current, outputToken: symbol }));
  }, []);

  const updateInputAmount = useCallback((value: string) => {
    setState((current) => ({ ...current, inputAmount: value }));
  }, []);

  const updateSlippage = useCallback((value: string) => {
    setState((current) => ({ ...current, slippage: value }));
  }, []);

  const ensurePermitAllowance = useCallback(
    async (tokenAddress: `0x${string}`, requiredAmount: bigint) => {
      if (!publicClient || !walletClient || !address) return;

      const permit2 = assertAddress("permit2");
      const universalRouter = assertAddress("universalRouter");

      try {
        const [amount, expiration] = (await publicClient.readContract({
          address: permit2,
          abi: PERMIT2_ABI,
          functionName: "allowance",
          args: [address, tokenAddress, universalRouter],
        })) as unknown as [bigint, bigint, bigint];

        const now = BigInt(Math.floor(Date.now() / 1000));
        const expirationValue = Number(now + ONE_YEAR_SECONDS);

        if (amount >= requiredAmount && expiration > now + PERMIT_BUFFER_SECONDS) {
          return;
        }

        await walletClient.writeContract({
          address: permit2,
          abi: PERMIT2_ABI,
          functionName: "approve",
          args: [tokenAddress, universalRouter, MAX_UINT_160, expirationValue],
          account: address,
        });
      } catch (error) {
        console.error("Permit2 approval failed", error);
        throw error;
      }
    },
    [address, publicClient, walletClient],
  );

  const canSwap = useMemo(() => {
    if (!state.inputAmount) return false;
    if (!poolContext) return false;
    if (status !== "connected") return false;
    if (isSwapping || isEstimating) return false;
    return Number(state.inputAmount) > 0;
  }, [state.inputAmount, poolContext, status, isSwapping, isEstimating]);

  const estimate = useCallback(async () => {
    if (!publicClient || !poolContext) return;
    if (!state.inputAmount) {
      setState((current) => ({ ...current, outputAmount: "" }));
      return;
    }

    const inputCurrency = getCurrency(state.inputToken);
    const outputCurrency = getCurrency(state.outputToken);

    try {
      setIsEstimating(true);

      let amountIn: bigint;
      try {
        amountIn = parseUnits(state.inputAmount, inputCurrency.decimals);
      } catch {
        setState((current) => ({ ...current, outputAmount: "" }));
        return;
      }
      if (amountIn === 0n) {
        setState((current) => ({ ...current, outputAmount: "" }));
        return;
      }

      const zeroForOne = resolveZeroForOne(poolContext.pool, inputCurrency);

      const [amountOut] = (await publicClient.readContract({
        address: assertAddress("quoter"),
        abi: QUOTER_ABI,
        functionName: "quoteExactInputSingle",
        args: [
          {
            poolKey: poolContext.config.poolKey,
            zeroForOne,
            exactAmount: amountIn,
            hookData: "0x",
          },
        ],
      })) as [bigint, bigint];

      const formatted = formatAmount(amountOut, outputCurrency.decimals);
      setState((current) => ({ ...current, outputAmount: formatted }));
    } catch (error) {
      console.error("Swap quote failed", error);
      const message = error instanceof Error ? error.message : String(error);
      console.error("Swap quote error message:", message);
      setState((current) => ({ ...current, outputAmount: "" }));
    } finally {
      setIsEstimating(false);
    }
  }, [publicClient, poolContext, state.inputAmount, state.inputToken, state.outputToken]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void estimate();
    }, 350);

    return () => clearTimeout(timeout);
  }, [estimate]);

  const executeSwap = useCallback(async () => {
    if (!publicClient || !walletClient || !address) {
      setToast({ status: "error", message: "Conecta tu wallet antes de hacer swap." });
      return;
    }

    if (!state.inputAmount) {
      setToast({ status: "error", message: "Ingresa un monto para continuar." });
      return;
    }

    try {
      setIsSwapping(true);
      setToast({ status: "pending", message: "Firmando transacción con el router..." });

      const { pool, config } = poolContext ? poolContext : await buildPool(publicClient);
      if (!poolContext) setPoolContext({ pool, config });

      const inputCurrency = getCurrency(state.inputToken);
      const outputCurrency = getCurrency(state.outputToken);
      let amountInRaw: bigint;
      try {
        amountInRaw = parseUnits(state.inputAmount, inputCurrency.decimals);
      } catch {
        throw new Error("Monto inválido");
      }

      if (amountInRaw <= 0n) {
        throw new Error("Monto inválido");
      }

      const zeroForOne = resolveZeroForOne(pool, inputCurrency);

      if (!inputCurrency.isNative) {
        await ensurePermitAllowance(inputCurrency.wrapped.address as `0x${string}`, amountInRaw);
      }

      const slippageTolerance = parseSlippage(state.slippage);

      const [amountOut] = (await publicClient.readContract({
        address: assertAddress("quoter"),
        abi: QUOTER_ABI,
        functionName: "quoteExactInputSingle",
        args: [
          {
            poolKey: config.poolKey,
            zeroForOne,
            exactAmount: amountInRaw,
            hookData: "0x",
          },
        ],
      })) as [bigint, bigint];

      const inputAmount = CurrencyAmount.fromRawAmount(inputCurrency, amountInRaw.toString());
      const outputAmount = CurrencyAmount.fromRawAmount(outputCurrency, amountOut.toString());

      const trade = createTrade(pool, inputAmount, outputAmount, TradeType.EXACT_INPUT);

      const deadline = Math.floor(Date.now() / 1000) + 900;

      const { calldata, value } = SwapRouter.swapCallParameters(trade, {
        recipient: address,
        slippageTolerance,
        deadlineOrPreviousBlockhash: deadline.toString(),
      });

      const txHash = await walletClient.sendTransaction({
        account: address,
        to: assertAddress("universalRouter"),
        data: calldata as `0x${string}`,
        value: BigInt(value ?? "0x0"),
      });

      setToast({ status: "pending", message: "Esperando confirmación en la red...", hash: txHash });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== "success") {
        throw new Error("La transacción no se confirmó correctamente");
      }

      const formattedOut = formatAmount(amountOut, outputCurrency.decimals);
      setToast({
        status: "success",
        message: `Swap completado. Recibiste ~${formattedOut} ${outputCurrency.symbol ?? state.outputToken}`,
        hash: txHash,
      });
      setState((current) => ({ ...current, inputAmount: "", outputAmount: "" }));
      void loadPool();
    } catch (error) {
      console.error("Swap failed", error);
      const message = error instanceof Error ? error.message : "Error durante el swap";
      setToast({ status: "error", message });
    } finally {
      setIsSwapping(false);
    }
  }, [address, ensurePermitAllowance, loadPool, poolContext, publicClient, state.inputAmount, state.outputToken, state.inputToken, state.slippage, walletClient]);

  return {
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
  } as const;
}

