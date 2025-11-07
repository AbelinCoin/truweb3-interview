"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletStatus() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        authenticationStatus,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected = ready && account && chain;
        const unsupported = chain?.unsupported;

        const indicatorColor = unsupported
          ? "#ff6b6b"
          : connected
            ? "#fff"
            : "#888";

        const label = unsupported
          ? "Cambiar red"
          : connected
            ? account?.displayName ?? "Wallet"
            : "Connect Wallet";

        const handleClick = () => {
          if (!connected) {
            openConnectModal?.();
            return;
          }
          if (unsupported) {
            openChainModal?.();
            return;
          }
          openAccountModal?.();
        };

        return (
          <div
            aria-hidden={!ready}
            style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? "auto" : "none" }}
          >
            <button
              type="button"
              onClick={handleClick}
              className={`accent-button px-4 py-2.5 text-sm flex items-center gap-2 border border-transparent ${
                connected ? "bg-[#181b26] text-white" : ""
              }`}
            >
              <span
                className="inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: indicatorColor }}
              />
              <span
                className={`font-semibold tracking-tight text-sm ${
                  connected ? "text-white" : "text-[#041b0d]"
                } whitespace-nowrap`}
              >
                {label}
              </span>
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

