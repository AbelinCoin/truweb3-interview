export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 0);

export const ADDRESSES = {
  universalRouter: process.env.NEXT_PUBLIC_UNIVERSAL_ROUTER as `0x${string}` | undefined,
  poolManager: process.env.NEXT_PUBLIC_POOL_MANAGER as `0x${string}` | undefined,
  stateView: process.env.NEXT_PUBLIC_STATE_VIEW as `0x${string}` | undefined,
  positionManager: process.env.NEXT_PUBLIC_POSITION_MANAGER as `0x${string}` | undefined,
  quoter: process.env.NEXT_PUBLIC_QUOTER as `0x${string}` | undefined,
  permit2: process.env.NEXT_PUBLIC_PERMIT2 as `0x${string}` | undefined,
  weth: process.env.NEXT_PUBLIC_WETH as `0x${string}` | undefined,
  usdc: process.env.NEXT_PUBLIC_USDC as `0x${string}` | undefined,
};

export function assertAddress(name: keyof typeof ADDRESSES): `0x${string}` {
  const value = ADDRESSES[name];
  if (!value) {
    throw new Error(`Missing environment variable for ${name}`);
  }
  return value;
}

export function requireChainId(): number {
  if (!CHAIN_ID) {
    throw new Error('Missing NEXT_PUBLIC_CHAIN_ID environment variable');
  }
  return CHAIN_ID;
}

