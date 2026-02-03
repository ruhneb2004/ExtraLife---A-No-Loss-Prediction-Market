"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConnectWalletButton, GlobalStyles, Sidebar } from "../../../_components";
import { getPoolById } from "../../../data/dummy";
import { ArrowLeft } from "lucide-react";
import { useAccount } from "wagmi";

export const PoolDetailContent = () => {
  const params = useParams();
  const router = useRouter();
  const { isConnected } = useAccount();
  const [betAmount, setBetAmount] = useState(0);

  const poolId = Number(params.id);
  const pool = getPoolById(poolId);

  if (!pool) {
    return (
      <div className="flex min-h-screen w-full bg-white relative overflow-x-hidden font-sans">
        <GlobalStyles />
        <Sidebar />
        <main className="flex-1 ml-[240px] relative py-12 px-12 flex items-center justify-center">
          <div
            className="bg-white rounded-[32px] p-12 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            <p className="text-gray-400 text-xl">Pool not found</p>
            <button onClick={() => router.push("/pools")} className="mt-4 text-[#a88ff0] hover:underline">
              Back to pools
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isLive = pool.status === "Currently live!";

  return (
    <div className="flex min-h-screen w-full bg-white relative overflow-x-hidden font-sans selection:bg-[#a88ff0] selection:text-white pb-20">
      <GlobalStyles />

      <Sidebar />

      {/* Connect Wallet Button - Top Right */}
      <div className="fixed top-8 right-8 z-30">
        <ConnectWalletButton />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 ml-[240px] relative py-12 pr-12 pl-8 max-w-[1400px]">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors mb-12"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Pool Detail Layout */}
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Left Side - Pool Info */}
          <div className="flex-1 max-w-2xl" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            {/* Timer Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#a88ff0] font-bold tracking-wide text-sm bg-[#a88ff0]/10 px-3 py-1 rounded-full">
                {pool.timeLeft}
              </span>
              <div className="w-3 h-3 rounded-full bg-[#4ade80] animate-pulse" />
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 leading-[1.1] tracking-tight">
              {pool.title}
            </h1>

            {/* Description */}
            <p className="text-gray-500 text-lg md:text-xl font-light mb-12 max-w-xl leading-relaxed">
              {pool.description}
            </p>

            {/* Prize Pool */}
            <div className="mb-12 p-6 border-l-4 border-[#a88ff0] bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wider">Current prize pool</h3>
              <p className="text-[#a88ff0] text-3xl md:text-4xl font-black tracking-tight">
                {pool.prizePool} {pool.prizePoolCurrency}
              </p>
            </div>

            {/* Top Bets */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-black mb-6 border-b-2 border-black pb-2 inline-block">
                Top bets on this event:
              </h3>
              <div className="flex flex-col">
                {pool.topBets.map((bet, index) => (
                  <div
                    key={bet.id}
                    className={`flex items-center gap-4 py-4 ${index !== pool.topBets.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full shrink-0 border border-black ${bet.isHighest ? "bg-[#a88ff0]" : "bg-[#fbbf24]"}`}
                    />
                    <span className={`text-lg ${bet.isHighest ? "font-bold text-black" : "text-gray-500 font-normal"}`}>
                      {bet.isHighest
                        ? `Highest Bettor in BOLD: ${bet.amount.toFixed(2)}$`
                        : `${bet.username}: ${bet.amount.toFixed(2)}$`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Betting Card */}
          <div className="sticky top-8">
            <div
              className="w-full md:w-[400px] bg-white rounded-[40px] p-8 border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              {/* BUY Label */}
              <p className="text-gray-400 text-xl font-bold tracking-wide uppercase mb-1">BUY</p>

              {/* Amount - Editable */}
              <div className="flex items-baseline mb-8">
                <span className="text-[5rem] leading-none font-black text-black tracking-tighter mr-1">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={betAmount || ""}
                  placeholder="0"
                  onChange={e => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      setBetAmount(value);
                    } else if (e.target.value === "") {
                      setBetAmount(0);
                    }
                  }}
                  className="text-[5rem] leading-none font-black text-black tracking-tighter bg-transparent border-none outline-none w-full appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-black focus:bg-white rounded-lg transition-colors"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* YES Button */}
                <button
                  disabled={!isConnected || !isLive}
                  className={`w-full py-5 rounded-2xl text-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] ${
                    isConnected && isLive
                      ? "bg-[#4ade80] text-black hover:bg-[#22c55e]"
                      : "bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed"
                  }`}
                >
                  YES
                </button>

                {/* NO Button */}
                <button
                  disabled={!isConnected || !isLive}
                  className={`w-full py-5 rounded-2xl text-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] ${
                    isConnected && isLive
                      ? "bg-[#f87171] text-black hover:bg-[#ef4444]"
                      : "bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed"
                  }`}
                >
                  NO
                </button>
              </div>

              {!isConnected && (
                <p className="text-center text-gray-400 font-medium text-sm mt-6">Connect wallet to place a bet</p>
              )}

              {!isLive && isConnected && (
                <p className="text-center text-gray-400 font-medium text-sm mt-6">This pool is closed</p>
              )}
            </div>

            {/* Decorative background element behind card */}
            <div className="absolute -z-10 top-4 -right-4 w-full h-full rounded-[40px] bg-gray-100 border border-gray-200 hidden lg:block"></div>
          </div>
        </div>
      </main>
    </div>
  );
};
