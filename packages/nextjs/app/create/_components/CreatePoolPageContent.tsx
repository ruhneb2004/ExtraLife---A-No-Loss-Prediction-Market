"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectWalletButton } from "~~/app/_components/ConnectWalletButton";
import { Sidebar } from "~~/app/_components/Sidebar";
import { TopNav } from "~~/app/_components/TopNav";
import { useCreatePool, useUsdcBalance } from "~~/hooks/useMarketController";
import { notification } from "~~/utils/scaffold-eth";

// Constants for yield calculation
const AAVE_APY = 3.5; // 3.5% APY from Aave
const CREATOR_SHARE = 40; // 40% goes to pool creator
const PRIZE_POOL_SHARE = 60; // 60% goes to prize pool

// Ensure the correct font is loaded for this page to match the design
const FontStyles = () => (
  <style jsx global>{`
    @import url("https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap");
    input::placeholder {
      color: #9ca3af;
      opacity: 1;
    }
  `}</style>
);

export const CreatePoolPageContent = () => {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [betQuestion, setBetQuestion] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [bettingPeriod, setBettingPeriod] = useState("");

  // Contract hooks
  const { createPool, isPending } = useCreatePool();
  const { balanceFormatted } = useUsdcBalance();

  // Validate and set stake amount (only positive numbers)
  const handleStakeChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setStakeAmount(value);
    }
  };

  // Validate and set betting period (only positive integers)
  const handleBettingPeriodChange = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setBettingPeriod(value);
    }
  };

  // Calculate yield based on stake amount and betting period
  const yieldCalculations = useMemo(() => {
    const stake = parseFloat(stakeAmount) || 0;
    const betDays = parseFloat(bettingPeriod) || 0;

    if (stake <= 0 || betDays <= 0) {
      return {
        totalYield: "0.000000",
        creatorYield: "0.000000",
        prizePool: "0.000000",
      };
    }

    // Calculate yield: Principal * (APY/100) * (days/365)
    const totalYield = stake * (AAVE_APY / 100) * (betDays / 365);
    const creatorYield = totalYield * (CREATOR_SHARE / 100);
    const prizePool = totalYield * (PRIZE_POOL_SHARE / 100);

    return {
      totalYield: totalYield.toFixed(6),
      creatorYield: creatorYield.toFixed(6),
      prizePool: prizePool.toFixed(6),
    };
  }, [stakeAmount, bettingPeriod]);

  const handleSubmit = async () => {
    try {
      const stake = parseFloat(stakeAmount);
      const days = parseInt(bettingPeriod);

      if (!betQuestion.trim() || stake <= 0 || days <= 0) {
        notification.error("Please fill in all fields correctly");
        return;
      }

      notification.info("Creating pool... Please approve USDC spending first.");

      await createPool(betQuestion, days, stake);

      notification.success("Pool created successfully!");
      router.push("/pools");
    } catch (error: unknown) {
      console.error("Error creating pool:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create pool";

      // Check for Aave-specific errors
      if (errorMessage.includes("51")) {
        notification.error("Aave supply cap exceeded. Try a smaller amount (e.g., 1-10 USDC) or try again later.");
      } else if (errorMessage.includes("allowance")) {
        notification.error("USDC approval failed. Please try again.");
      } else {
        notification.error(errorMessage);
      }
    }
  };

  const isFormValid = betQuestion.trim() !== "" && parseFloat(stakeAmount) > 0 && parseFloat(bettingPeriod) > 0;

  // Not Connected State
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <FontStyles />
        <Sidebar />
        <div className="ml-[240px] flex-1 flex items-center justify-center">
          <div className="bg-white border-2 border-black p-12 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-3xl">
            <h2
              className="text-3xl mb-4 text-black font-semibold"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Connect Your Wallet
            </h2>
            <p className="text-gray-500 mb-8 font-medium">Connect your wallet to create a prediction pool</p>
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    );
  }

  // Connected State (Form)
  return (
    <div className="min-h-screen bg-white relative font-sans selection:bg-[#a88ff0] selection:text-white pb-20">
      <FontStyles />
      <Sidebar />

      {/* Top Navigation */}
      <TopNav />

      <main className="flex-1 lg:ml-[240px] relative px-12 py-16 max-w-[1000px]">
        {/* Header Section */}
        <div className="mb-12">
          <h1
            className="text-4xl font-bold text-black mb-2 tracking-tight"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            Set up a bet.
          </h1>
          <p className="text-gray-500 text-lg font-light">
            Create a pool and ensure constant returns on your investments.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Your USDC Balance:{" "}
            <span className="font-semibold text-black">{parseFloat(balanceFormatted).toFixed(2)} USDC</span>
          </p>
        </div>

        {/* Form Section */}
        <div className="space-y-10 max-w-2xl">
          {/* Bet Question */}
          <div className="space-y-3">
            <label
              className="text-2xl font-bold text-black block tracking-tight"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Bet question:
            </label>
            <input
              type="text"
              value={betQuestion}
              onChange={e => setBetQuestion(e.target.value)}
              placeholder="e.g., Will ETH reach $5000 by end of 2025?"
              className="w-full border-2 border-[#cbd5e1] rounded-xl px-4 py-4 text-lg text-gray-900 focus:outline-none focus:border-black transition-colors bg-white"
            />
          </div>

          {/* Stake Amount */}
          <div className="space-y-3">
            <div>
              <label
                className="text-2xl font-bold text-black block tracking-tight leading-none"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                Stake Amount:
              </label>
              <span className="text-gray-400 text-sm font-light">Your initial investment (in USDC)</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={stakeAmount}
              onChange={e => handleStakeChange(e.target.value)}
              placeholder="0.00"
              className="w-full border-2 border-[#cbd5e1] rounded-xl px-4 py-4 text-lg text-gray-900 focus:outline-none focus:border-black transition-colors bg-white"
            />
          </div>

          {/* Betting Period */}
          <div className="space-y-3">
            <div>
              <label
                className="text-2xl font-bold text-black block tracking-tight leading-none"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                Betting Period:
              </label>
              <span className="text-gray-400 text-sm font-light">
                How long users can place bets (in days) - betting starts immediately
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={bettingPeriod}
              onChange={e => handleBettingPeriodChange(e.target.value)}
              placeholder="0"
              className="w-full border-2 border-[#cbd5e1] rounded-xl px-4 py-4 text-lg text-gray-900 focus:outline-none focus:border-black transition-colors bg-white"
            />
          </div>

          {/* Yield Preview */}
          <div className="bg-[#a88ff0]/5 border-2 border-[#a88ff0]/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-black mb-4" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Projected Returns
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  Total Yield
                </span>
                <span className="text-xl font-bold text-black" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  {yieldCalculations.totalYield} USDC
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  Your Earnings ({CREATOR_SHARE}%)
                </span>
                <span
                  className="text-xl font-bold text-[#a88ff0]"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {yieldCalculations.creatorYield} USDC
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  Winner Prize Pool ({PRIZE_POOL_SHARE}%)
                </span>
                <span className="text-xl font-bold text-black" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  {yieldCalculations.prizePool} USDC
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Estimated based on ~{AAVE_APY}% APY from Aave V3
            </p>
          </div>
        </div>

        {/* Bottom Actions Area */}
        <div className="mt-24 flex items-end justify-end relative">
          {/* Confirm Action */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-gray-500 text-sm font-light">Confirm creation of pool?</span>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isPending}
              className={`text-3xl font-bold px-16 py-4 rounded-xl border-2 border-black transition-all uppercase tracking-wide ${
                isFormValid && !isPending
                  ? "bg-[#4ade80] hover:bg-[#22c55e] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              {isPending ? "Creating..." : "YES"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
