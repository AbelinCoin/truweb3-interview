"use client";

import "@rainbow-me/rainbowkit/styles.css";

import type { ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { polygon, sepolia } from "wagmi/chains";

import { CHAIN_ID } from "@/lib/config";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

const chainMap = {
  [sepolia.id]: sepolia,
  [polygon.id]: polygon,
} as const;

const activeChain = chainMap[CHAIN_ID as keyof typeof chainMap] ?? sepolia;

const wagmiConfig = getDefaultConfig({
  appName: "Uniswap V4 Portal",
  projectId: projectId || "demo",
  chains: [activeChain],
  transports: {
    [activeChain.id]: rpcUrl ? http(rpcUrl) : http(),
  },
  ssr: true,
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#2de370",
            accentColorForeground: "#041b0d",
            borderRadius: "medium",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

