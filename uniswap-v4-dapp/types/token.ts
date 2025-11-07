export type TokenSymbol = "ETH" | "USDC";

export interface TokenMetadata {
  symbol: TokenSymbol;
  name: string;
  address: `0x${string}` | null;
  decimals: number;
  icon: string;
}

export interface TokenAmount {
  token: TokenSymbol;
  amount: string;
}

