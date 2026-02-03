"use client";

import { useEffect, useState } from "react";
import { ConnectWalletButton, GlobalStyles, Sidebar, TopNav } from "../../_components";
import { PoolsExplorer } from "./PoolsExplorer";
import { useAccount } from "wagmi";

export const PoolsPageContent = () => {
  const { isConnected, isReconnecting, status } = useAccount();
  const [checkComplete, setCheckComplete] = useState(false);

  // Wait for wagmi to fully initialize
  useEffect(() => {
    if (isReconnecting || status === "connecting") {
      return;
    }

    if (status === "connected" || status === "disconnected") {
      const timer = setTimeout(() => {
        setCheckComplete(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReconnecting, status]);

  // Show loading state while checking connection
  if (!checkComplete) {
    return (
      <div className="flex min-h-screen w-full bg-white items-center justify-center">
        <GlobalStyles />
        <p className="text-gray-400 text-xl" style={{ fontFamily: "'Clash Display', sans-serif" }}>
          Loading...
        </p>
      </div>
    );
  }

  // Show connect prompt if not connected
  if (!isConnected) {
    return (
      <div className="flex min-h-screen w-full bg-white items-center justify-center px-8">
        <GlobalStyles />
        <div
          className="bg-white rounded-[32px] py-16 px-20 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center w-full max-w-2xl"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          <h2 className="text-black text-3xl font-medium mb-3">Connect Your Wallet</h2>
          <p className="text-gray-500 text-base mb-8">You need to connect your wallet to view prediction pools</p>
          <ConnectWalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-white relative overflow-x-hidden font-sans selection:bg-[#a88ff0] selection:text-white">
      <GlobalStyles />

      <Sidebar />

      {/* Top Navigation */}
      <TopNav />

      {/* Main Content Area */}
      <main className="flex-1 ml-[150px] relative py-12 px-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-medium text-black mb-4" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Prediction Pools
          </h1>
          <p className="text-gray-500 text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Browse active pools and place your predictions
          </p>
        </div>

        {/* Pools Explorer with Search */}
        <PoolsExplorer />
      </main>
    </div>
  );
};
