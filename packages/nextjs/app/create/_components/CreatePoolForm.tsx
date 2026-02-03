"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Constants for yield calculation
const AAVE_APY = 3.5; // 3.5% APY from Aave
const CREATOR_SHARE = 40; // 40% goes to pool creator
const PRIZE_POOL_SHARE = 60; // 60% goes to prize pool

/**
 * CREATE POOL FORM
 * Form to create a new prediction pool with yield calculations
 */
export const CreatePoolForm = () => {
  const router = useRouter();
  const [betQuestion, setBetQuestion] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [bettingPeriod, setBettingPeriod] = useState(""); // in days

  // Validate and set stake amount (only positive numbers)
  const handleStakeChange = (value: string) => {
    // Allow empty string or valid positive numbers
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setStakeAmount(value);
    }
  };

  // Validate and set betting period (only positive integers)
  const handleBettingPeriodChange = (value: string) => {
    // Allow empty string or valid positive integers
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

  const handleSubmit = () => {
    // TODO: Submit to smart contract
    console.log({
      betQuestion,
      stakeAmount,
      bettingPeriod,
      yieldCalculations,
    });
    // For now, redirect to pools page
    router.push("/pools");
  };

  const isFormValid = betQuestion.trim() !== "" && parseFloat(stakeAmount) > 0 && parseFloat(bettingPeriod) > 0;

  return (
    <div className="ml-[150px] min-h-screen flex">
      {/* Vertical divider line */}
      <div className="w-px bg-gray-200 ml-8" />

      {/* Main content */}
      <div className="flex-1 px-16 py-12 flex flex-col">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-3xl font-bold text-black mb-2"
            style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700 }}
          >
            Set up a bet.
          </h1>
          <p className="text-gray-500" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Create a pool and ensure constant returns on your investments.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-8 max-w-2xl">
          {/* Bet Question */}
          <div>
            <label
              className="block text-xl font-bold text-black mb-3"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Bet question:
            </label>
            <input
              type="text"
              value={betQuestion}
              onChange={e => setBetQuestion(e.target.value)}
              placeholder="e.g., Will ETH reach $5000 by end of 2025?"
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors bg-white text-black"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>

          {/* Stake Amount */}
          <div>
            <label
              className="block text-xl font-bold text-black mb-1"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Stake Amount:
            </label>
            <p className="text-sm text-gray-500 mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Your initial investment (in ETH)
            </p>
            <input
              type="text"
              inputMode="decimal"
              value={stakeAmount}
              onChange={e => handleStakeChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors bg-white text-black"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>

          {/* Betting Period */}
          <div>
            <label
              className="block text-xl font-bold text-black mb-1"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Betting Period:
            </label>
            <p className="text-sm text-gray-500 mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              How long users can place bets (in days) - betting starts immediately
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={bettingPeriod}
              onChange={e => handleBettingPeriodChange(e.target.value)}
              placeholder="0"
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors bg-white text-black"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>

          {/* Yield Preview */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-black mb-4" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Estimated Yield Preview:
            </h3>
            <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Based on {AAVE_APY}% APY from Aave
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Total Yield Generated:
                </span>
                <span
                  className="text-lg font-semibold text-black"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {yieldCalculations.totalYield} ETH
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Your Share ({CREATOR_SHARE}%):
                </span>
                <span
                  className="text-lg font-semibold text-emerald-600"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {yieldCalculations.creatorYield} ETH
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Prize Pool ({PRIZE_POOL_SHARE}%):
                </span>
                <span
                  className="text-lg font-semibold text-blue-600"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {yieldCalculations.prizePool} ETH
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section with back button and confirm */}
        <div className="mt-auto pt-12 flex items-end justify-between max-w-2xl">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="w-16 h-16 bg-[#050505] rounded-2xl flex items-center justify-center text-white hover:scale-105 hover:bg-black transition-all shadow-xl cursor-pointer"
          >
            <ChevronLeft size={36} strokeWidth={3} />
          </button>

          {/* Confirm button */}
          <div className="text-right">
            <p className="text-gray-500 text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Confirm creation of pool?
            </p>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`px-16 py-4 rounded-xl text-xl font-bold transition-all ${
                isFormValid
                  ? "bg-[#2EE59D] text-black hover:bg-[#25cc88] cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              YES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
