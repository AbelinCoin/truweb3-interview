import JSBI from 'jsbi';
import { Pool, Route, Trade } from '@uniswap/v4-sdk';
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core';
import { PublicClient, parseAbiItem } from 'viem';
import { TickMath } from '@uniswap/v3-sdk';

import { STATE_VIEW_ABI } from '@/lib/abis';
import { assertAddress } from '@/lib/config';
import { WrappedNativeCurrency, findTokenSymbolByAddress, getToken, nativeCurrency } from '@/lib/tokens';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const FEE_CANDIDATES = [100, 300, 500, 1000, 2000, 2500, 3000, 5000, 10000];
const TICK_SPACING_CANDIDATES = [1, 5, 10, 15, 20, 25, 30, 45, 50, 60, 75, 100, 120, 200];

const INITIALIZE_EVENT = parseAbiItem(
  'event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)'
);

type PoolKey = {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
};

export type PoolConfiguration = {
  poolKey: PoolKey;
  poolId: `0x${string}`;
};

export type PoolState = {
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
};

let cachedConfig: PoolConfiguration | null = null;

function ensureNativeCurrency(): WrappedNativeCurrency {
  if (!nativeCurrency) {
    throw new Error('Native currency is not configured');
  }
  return nativeCurrency;
}

function mapCurrency(address: string): Currency {
  const lower = address.toLowerCase();
  const native = ensureNativeCurrency();
  if (lower === ZERO_ADDRESS) {
    return native;
  }
  if (native.address.toLowerCase() === lower) {
    return native;
  }
  if (native.wrapped.address.toLowerCase() === lower) {
    return native.wrapped;
  }
  const symbol = findTokenSymbolByAddress(address);
  if (!symbol) {
    throw new Error(`Unsupported currency address: ${address}`);
  }
  if (symbol === 'ETH') {
    return native.wrapped;
  }
  return getToken(symbol);
}

async function discoverPoolFromLogs(client: PublicClient): Promise<PoolConfiguration | null> {
  const poolManager = assertAddress('poolManager');
  const wethAddress = assertAddress('weth').toLowerCase();
  const usdcAddress = assertAddress('usdc').toLowerCase();

  const logs = await client.getLogs({
    address: poolManager,
    event: INITIALIZE_EVENT,
    fromBlock: 0n,
    toBlock: 'latest',
  });

  for (let i = logs.length - 1; i >= 0; i -= 1) {
    const log = logs[i];
    const args = log.args;
    if (!args) continue;

    const currency0 = (args.currency0 as `0x${string}`).toLowerCase();
    const currency1 = (args.currency1 as `0x${string}`).toLowerCase();

    const matchesPair =
      (currency0 === wethAddress || currency0 === ZERO_ADDRESS) && currency1 === usdcAddress ||
      (currency1 === wethAddress || currency1 === ZERO_ADDRESS) && currency0 === usdcAddress;

    if (!matchesPair) continue;

    return {
      poolKey: {
        currency0: args.currency0 as `0x${string}`,
        currency1: args.currency1 as `0x${string}`,
        fee: Number(args.fee),
        tickSpacing: Number(args.tickSpacing),
        hooks: args.hooks as `0x${string}`,
      },
      poolId: args.id as `0x${string}`,
    };
  }

  return null;
}

export async function discoverPoolConfiguration(client: PublicClient): Promise<PoolConfiguration> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const logConfig = await discoverPoolFromLogs(client);
  if (logConfig) {
    cachedConfig = logConfig;
    return logConfig;
  }

  const stateView = assertAddress('stateView');
  const chainNative = ensureNativeCurrency();
  const usdc = getToken('USDC');
  const hooksCandidates: `0x${string}`[] = [ZERO_ADDRESS as `0x${string}`];

  for (const fee of FEE_CANDIDATES) {
    for (const tickSpacing of TICK_SPACING_CANDIDATES) {
      for (const hooks of hooksCandidates) {
        try {
          const poolId = Pool.getPoolId(chainNative, usdc, fee, tickSpacing, hooks) as `0x${string}`;
          await client.readContract({
            address: stateView,
            abi: STATE_VIEW_ABI,
            functionName: 'getLiquidity',
            args: [poolId],
          });

          const poolKey = Pool.getPoolKey(chainNative, usdc, fee, tickSpacing, hooks);

          cachedConfig = {
            poolKey: {
              currency0: poolKey.currency0 as `0x${string}`,
              currency1: poolKey.currency1 as `0x${string}`,
              fee: poolKey.fee,
              tickSpacing: poolKey.tickSpacing,
              hooks: poolKey.hooks as `0x${string}`,
            },
            poolId,
          };

          return cachedConfig;
        } catch {
          continue;
        }
      }
    }
  }

  throw new Error('Unable to discover ETH/USDC pool configuration on Sepolia');
}

export async function fetchPoolState(client: PublicClient, poolId: `0x${string}`): Promise<PoolState> {
  const stateView = assertAddress('stateView');
  const [slot0, liquidity] = await Promise.all([
    client.readContract({
      address: stateView,
      abi: STATE_VIEW_ABI,
      functionName: 'getSlot0',
      args: [poolId],
    }),
    client.readContract({
      address: stateView,
      abi: STATE_VIEW_ABI,
      functionName: 'getLiquidity',
      args: [poolId],
    }),
  ]);

  const [sqrtPriceX96, tick] = slot0 as [bigint, number, number, number];

  return {
    sqrtPriceX96,
    tick,
    liquidity: liquidity as bigint,
  };
}

export async function buildPool(client: PublicClient): Promise<{ pool: Pool; config: PoolConfiguration }>
{
  const config = await discoverPoolConfiguration(client);
  const state = await fetchPoolState(client, config.poolId);

  const currency0 = mapCurrency(config.poolKey.currency0);
  const currency1 = mapCurrency(config.poolKey.currency1);

  const pool = new Pool(
    currency0,
    currency1,
    config.poolKey.fee,
    config.poolKey.tickSpacing,
    config.poolKey.hooks,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick,
  );

  return { pool, config };
}

export function currencyEquals(a: Currency, b: Currency): boolean {
  if (a.isNative && b.isNative) return true;
  return a.wrapped.address.toLowerCase() === b.wrapped.address.toLowerCase();
}

export function resolveZeroForOne(pool: Pool, input: Currency): boolean {
  return currencyEquals(pool.currency0, input);
}

export function fullRangeTicks(tickSpacing: number): { tickLower: number; tickUpper: number } {
  const tickLower = Math.floor(TickMath.MIN_TICK / tickSpacing) * tickSpacing;
  const tickUpper = Math.ceil(TickMath.MAX_TICK / tickSpacing) * tickSpacing;
  return { tickLower, tickUpper };
}

export function centeredTicks(tickCurrent: number, tickSpacing: number, range: number = 100): {
  tickLower: number;
  tickUpper: number;
} {
  const span = tickSpacing * range;
  const rawLower = tickCurrent - span;
  const rawUpper = tickCurrent + span;
  const tickLower = Math.floor(rawLower / tickSpacing) * tickSpacing;
  const tickUpper = Math.ceil(rawUpper / tickSpacing) * tickSpacing;
  return {
    tickLower: Math.max(tickLower, Math.floor(TickMath.MIN_TICK / tickSpacing) * tickSpacing),
    tickUpper: Math.min(tickUpper, Math.ceil(TickMath.MAX_TICK / tickSpacing) * tickSpacing),
  };
}

export function createTrade(
  pool: Pool,
  inputAmount: CurrencyAmount<Currency>,
  outputAmount: CurrencyAmount<Currency>,
  tradeType: TradeType,
) {
  const route = new Route([pool], inputAmount.currency, outputAmount.currency);
  return Trade.createUncheckedTrade({ route, inputAmount, outputAmount, tradeType });
}

export function parseSlippage(slippage: string): Percent {
  const value = Number.parseFloat(slippage || '0');
  const bips = Math.round(value * 100);
  return new Percent(JSBI.BigInt(bips), JSBI.BigInt(10_000));
}

