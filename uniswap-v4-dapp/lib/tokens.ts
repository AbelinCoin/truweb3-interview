import { NativeCurrency, Token } from "@uniswap/sdk-core";

import type { TokenMetadata, TokenSymbol } from "@/types/token";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 0);

const wethAddress = process.env.NEXT_PUBLIC_WETH as `0x${string}` | undefined;
const usdcAddress = process.env.NEXT_PUBLIC_USDC as `0x${string}` | undefined;

class WrappedNativeCurrency extends NativeCurrency {
  public readonly wrapped: Token;

  constructor(override readonly chainId: number) {
    super(chainId, 18, "ETH", "Ether");
    if (!wethAddress) {
      throw new Error("Missing NEXT_PUBLIC_WETH env var");
    }
    this.wrapped = new Token(chainId, wethAddress, 18, "WETH", "Wrapped Ether");
  }

  equals(other: Token | NativeCurrency): boolean {
    return other.isNative ? other.chainId === this.chainId : this.wrapped.equals(other);
  }

  get address(): string {
    return this.wrapped.address;
  }
}

export const nativeCurrency = chainId ? new WrappedNativeCurrency(chainId) : null;

const registry: Record<TokenSymbol, TokenMetadata> = {
  ETH: {
    symbol: "ETH",
    name: "Ether",
    address: nativeCurrency?.address ?? null,
    decimals: 18,
    icon: "/eth.svg",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: usdcAddress ?? null,
    decimals: 6,
    icon: "/usdc.svg",
  },
};

export function getTokenMetadata(symbol: TokenSymbol): TokenMetadata {
  return registry[symbol];
}

export function getToken(symbol: TokenSymbol): Token | NativeCurrency {
  if (symbol === "ETH") {
    if (!nativeCurrency) {
      throw new Error("Chain ID or WETH address is not configured");
    }
    return nativeCurrency;
  }

  if (!usdcAddress) {
    throw new Error("USDC address is not configured");
  }
  return new Token(chainId, usdcAddress, 6, "USDC", "USD Coin");
}

export const SUPPORTED_TOKENS: TokenMetadata[] = Object.values(registry);

export function findTokenSymbolByAddress(address: string): TokenSymbol | null {
  const lower = address.toLowerCase();
  if (nativeCurrency) {
    if (nativeCurrency.address.toLowerCase() === lower) {
      return "ETH";
    }
    if (nativeCurrency.wrapped.address.toLowerCase() === lower) {
      return "ETH";
    }
  }
  if (usdcAddress && usdcAddress.toLowerCase() === lower) {
    return "USDC";
  }
  return null;
}

