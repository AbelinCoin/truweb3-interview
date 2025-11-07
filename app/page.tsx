"use client";

import { useEffect, useMemo, useState } from "react";

import { LiquidityForm } from "@/components/LiquidityForm";
import { SwapForm } from "@/components/SwapForm";
import { WalletStatus } from "@/components/WalletStatus";

const tabs = [
  { id: "swap", label: "Swap" },
  { id: "liquidity", label: "Liquidity" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("swap");
  const [booting, setBooting] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 520);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setTabLoading(false), 260);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleTabChange = (tabId: TabId) => {
    if (tabId === activeTab) return;
    setTabLoading(true);
    setActiveTab(tabId);
  };

  const tabView = useMemo(() => {
    if (activeTab === "liquidity") {
      return <LiquidityForm />;
    }
    return <SwapForm />;
  }, [activeTab]);

  if (booting) {
    return (
      <div className="page-shell">
        <div className="card-panel w-full max-w-sm px-12 py-14 text-center">
          <div className="mx-auto page-loader" />
          <p className="mt-4 text-sm font-medium text-[var(--muted)]">Bienvenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <main className="card-panel w-full max-w-xl px-8 py-8 sm:px-10 sm:py-9">
        <header className="flex items-start justify-between gap-6">
          <div className="flex flex-col items-start justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--muted)]">
              Uniswap V4 · Sepolia
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">ETH ⇄ USDC</h1>
            <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
              Administra swaps y liquidez concentrada con una interfaz minimalista y animaciones
              fluidas.
            </p>
          </div>

          <WalletStatus />
        </header>

        <nav className="mt-6 flex gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-button ${isActive ? "tab-button--active" : ""}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section className="relative mt-6">
          {tabLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-[#0c0f17]/85">
              <div className="page-loader" />
            </div>
          ) : null}
          <div
            key={activeTab}
            className={`fade-in-up ${tabLoading ? "opacity-0" : "opacity-100"}`}
            style={{ transition: "opacity 0.25s ease" }}
          >
            {tabView}
          </div>
        </section>
      </main>
    </div>
  );
}
