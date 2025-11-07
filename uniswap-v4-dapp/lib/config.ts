export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 0);

type AddressKeys =
  | "universalRouter"
  | "poolManager"
  | "stateView"
  | "positionManager"
  | "quoter"
  | "permit2"
  | "weth"
  | "usdc";

type AddressMap = Record<AddressKeys, `0x${string}` | undefined>;

const DEFAULT_ADDRESSES: Partial<Record<number, AddressMap>> = {
  11155111: {
    universalRouter: "0x3A9D48A8DA508d5D9BD4e2059c32d9BfA6F3F6B2",
    poolManager: "0xE03A1074193f2FC9AfaA0c5a59C1467cE112b0C3",
    stateView: "0xe1dd9c3B278f9608A04b165ED833F5549E4E4002",
    positionManager: "0x429ba7011b7e01D1B0E205C36DdfcF2e6adF6f9D",
    quoter: "0x61b3f205bE2Daa800Fd891F17D3D7D4fE6a0D728",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    weth: "0xdd13E55209Fd76AfE204dBda4007C227904f0a81",
    usdc: "0x65aFADD39029741B3b8f0756952C74678c9cEC93",
  },
  137: {
    universalRouter: "0x1095692A6237d83C6a72F3F5eFEdb9A670C49223",
    poolManager: "0x67366782805870060151383f4bbff9dab53e5cd6",
    stateView: "0x5ea1bd7974c8a611cbab0bdcafcb1d9cc9b3ba5a",
    positionManager: "0x1ec2ebf4f37e7363fdfe3551602425af0b3ceef9",
    quoter: "0xb3d5c3dfc3a7aebff71895a7191796bffc2c81b9",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    weth: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  },
};

const ENV_KEYS: Record<AddressKeys, keyof NodeJS.ProcessEnv> = {
  universalRouter: "NEXT_PUBLIC_UNIVERSAL_ROUTER",
  poolManager: "NEXT_PUBLIC_POOL_MANAGER",
  stateView: "NEXT_PUBLIC_STATE_VIEW",
  positionManager: "NEXT_PUBLIC_POSITION_MANAGER",
  quoter: "NEXT_PUBLIC_QUOTER",
  permit2: "NEXT_PUBLIC_PERMIT2",
  weth: "NEXT_PUBLIC_WETH",
  usdc: "NEXT_PUBLIC_USDC",
};

function resolveAddress(name: AddressKeys): `0x${string}` | undefined {
  const envValue = process.env[ENV_KEYS[name]] as `0x${string}` | undefined;
  if (envValue) return envValue;
  return DEFAULT_ADDRESSES[CHAIN_ID]?.[name];
}

export const ADDRESSES: AddressMap = {
  universalRouter: resolveAddress("universalRouter"),
  poolManager: resolveAddress("poolManager"),
  stateView: resolveAddress("stateView"),
  positionManager: resolveAddress("positionManager"),
  quoter: resolveAddress("quoter"),
  permit2: resolveAddress("permit2"),
  weth: resolveAddress("weth"),
  usdc: resolveAddress("usdc"),
};

export function assertAddress(name: keyof typeof ADDRESSES): `0x${string}` {
  const value = ADDRESSES[name];
  if (!value) {
    throw new Error(`Missing configuration for ${name}`);
  }
  return value;
}

export function requireChainId(): number {
  if (!CHAIN_ID) {
    throw new Error('Missing NEXT_PUBLIC_CHAIN_ID environment variable');
  }
  return CHAIN_ID;
}

