"use client";

import { useCallback, useMemo, useState } from "react";
import { Position, V4PositionManager } from "@uniswap/v4-sdk";
import { parseUnits, formatUnits } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import type { TransactionToastProps } from "@/components/TransactionToast";
import { buildPool, centeredTicks, fullRangeTicks, parseSlippage } from "@/lib/pool";
import { getToken, nativeCurrency } from "@/lib/tokens";
import { assertAddress } from "@/lib/config";
import { PERMIT2_ABI } from "@/lib/abis";

type LiquidityState = {
  tokenA: "ETH";
  tokenB: "USDC";
  amountA: string;
  amountB: string;
  slippage: string;
  fullRange: boolean;
  deadlineMinutes: number;
};

const DEFAULT_STATE: LiquidityState = {
  tokenA: "ETH",
  tokenB: "USDC",
  amountA: "",
  amountB: "",
  slippage: "0.50",
  fullRange: true,
  deadlineMinutes: 20,
};

const MAX_UINT_160 = (1n << 160n) - 1n;
const PERMIT_BUFFER_SECONDS = 600n;
const ONE_YEAR_SECONDS = 365n * 24n * 60n * 60n;

export function useLiquidity() {
  const { address, status } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [state, setState] = useState<LiquidityState>(DEFAULT_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<TransactionToastProps | null>(null);

  const resetToast = useCallback(() => setToast(null), []);

  const updateAmountA = useCallback((value: string) => {
    setState((current) => ({ ...current, amountA: value }));
  }, []);

  const updateAmountB = useCallback((value: string) => {
    setState((current) => ({ ...current, amountB: value }));
  }, []);

  const toggleFullRange = useCallback(() => {
    setState((current) => ({ ...current, fullRange: !current.fullRange }));
  }, []);

  const updateSlippage = useCallback((value: string) => {
    setState((current) => ({ ...current, slippage: value }));
  }, []);

  const updateDeadline = useCallback((minutes: number) => {
    setState((current) => ({ ...current, deadlineMinutes: minutes }));
  }, []);

  const ensurePermitAllowance = useCallback(
    async (tokenAddress: `0x${string}`, requiredAmount: bigint) => {
      if (!publicClient || !walletClient || !address) return;

      const permit2 = assertAddress("permit2");
      const positionManager = assertAddress("positionManager");

      try {
        const [amount, expiration] = (await publicClient.readContract({
          address: permit2,
          abi: PERMIT2_ABI,
          functionName: "allowance",
          args: [address, tokenAddress, positionManager],
        })) as [bigint, bigint, bigint];

        const now = BigInt(Math.floor(Date.now() / 1000));

        if (amount >= requiredAmount && expiration > now + PERMIT_BUFFER_SECONDS) {
          return;
        }

        await walletClient.writeContract({
          address: permit2,
          abi: PERMIT2_ABI,
          functionName: "approve",
          args: [tokenAddress, positionManager, MAX_UINT_160, now + ONE_YEAR_SECONDS],
          account: address,
        });
      } catch (error) {
        console.error("Permit2 approval failed", error);
        throw error;
      }
    },
    [address, publicClient, walletClient],
  );

  const canSubmit = useMemo(() => {
    if (status !== "connected") return false;
    if (isSubmitting) return false;
    if (!state.amountA && !state.amountB) return false;
    return true;
  }, [state.amountA, state.amountB, status, isSubmitting]);

  const executeAddLiquidity = useCallback(async () => {
    if (!publicClient || !walletClient || !address) {
      setToast({ status: "error", message: "Conecta tu wallet antes de añadir liquidez." });
      return;
    }

    try {
      setIsSubmitting(true);
      setToast({ status: "pending", message: "Preparando posición de liquidez..." });

      const { pool, config } = await buildPool(publicClient);

      const eth = nativeCurrency;
      const usdc = getToken("USDC");
      if (!eth) throw new Error("Native currency not configured");

      let amountEthRaw: bigint;
      let amountUsdcRaw: bigint;

      try {
        amountEthRaw = state.amountA ? parseUnits(state.amountA, eth.decimals) : 0n;
        amountUsdcRaw = state.amountB ? parseUnits(state.amountB, usdc.decimals) : 0n;
      } catch {
        throw new Error("Montos inválidos");
      }

      if (amountEthRaw === 0n && amountUsdcRaw === 0n) {
        throw new Error("Ingresa montos para ETH o USDC");
      }

      const tickData = state.fullRange
        ? fullRangeTicks(config.poolKey.tickSpacing)
        : centeredTicks(pool.tickCurrent, config.poolKey.tickSpacing, 100);

      const amount0Raw = pool.currency0.isNative ? amountEthRaw : amountUsdcRaw;
      const amount1Raw = pool.currency0.isNative ? amountUsdcRaw : amountEthRaw;

      const position = Position.fromAmounts({
        pool,
        tickLower: tickData.tickLower,
        tickUpper: tickData.tickUpper,
        amount0: amount0Raw.toString(),
        amount1: amount1Raw.toString(),
        useFullPrecision: true,
      });

      const slippageTolerance = parseSlippage(state.slippage);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + state.deadlineMinutes * 60);

      const { amount0, amount1 } = position.mintAmountsWithSlippage(slippageTolerance);
      const amount0WithSlippage = BigInt(amount0.toString());
      const amount1WithSlippage = BigInt(amount1.toString());

      if (!pool.currency0.isNative && amount0WithSlippage > 0n) {
        await ensurePermitAllowance(pool.currency0.wrapped.address as `0x${string}`, amount0WithSlippage);
      }
      if (!pool.currency1.isNative && amount1WithSlippage > 0n) {
        await ensurePermitAllowance(pool.currency1.wrapped.address as `0x${string}`, amount1WithSlippage);
      }

      const useNative = pool.currency0.isNative || pool.currency1.isNative ? nativeCurrency ?? undefined : undefined;

      const params = V4PositionManager.addCallParameters(position, {
        slippageTolerance,
        deadline,
        recipient: address,
        hookData: "0x",
        createPool: false,
        useNative,
      });

      const txHash = await walletClient.sendTransaction({
        account: address,
        to: assertAddress("positionManager"),
        data: params.calldata as `0x${string}`,
        value: params.value ? BigInt(params.value) : 0n,
      });

      setToast({ status: "pending", message: "Esperando confirmación de la posición...", hash: txHash });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") {
        throw new Error("La transacción no se confirmó correctamente");
      }

      const formattedEth = formatUnits(amountEthRaw, eth.decimals);
      const formattedUsdc = formatUnits(amountUsdcRaw, usdc.decimals);
      setToast({
        status: "success",
        message: `Liquidez añadida con ${formattedEth || "0"} ETH y ${formattedUsdc || "0"} USDC`,
        hash: txHash,
      });

      setState((current) => ({ ...current, amountA: "", amountB: "" }));
    } catch (error) {
      console.error("Add liquidity failed", error);
      const message = error instanceof Error ? error.message : "Error al añadir liquidez";
      setToast({ status: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }, [address, ensurePermitAllowance, publicClient, state.amountA, state.amountB, state.deadlineMinutes, state.fullRange, state.slippage, walletClient]);

  return {
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
  } as const;
}

