"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GlobalStyles, Sidebar, TopNav } from "../../../_components";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
// 40% goes to pool creator
import {
  formatTimeLeft,
  useClaim,
  useClaimCreatorRewards,
  usePlaceBet,
  usePool,
  usePoolMetrics,
  useUserBet,
} from "~~/hooks/useMarketController";
import { notification } from "~~/utils/scaffold-eth";

// Constants for yield projection
const AAVE_APY = 3.5; // Approximate Aave V3 APY for USDC
const PRIZE_POOL_SHARE = 60; // 60% goes to winners
const CREATOR_SHARE = 40; // 40% goes to pool creator

export const PoolDetailContent = () => {
  const params = useParams();
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [betAmount, setBetAmount] = useState(0);

  const poolId = Number(params.id);
  const { pool, isLoading: poolLoading, refetch: refetchPool } = usePool(poolId);
  const { userBet, refetch: refetchBet } = useUserBet(poolId);
  const { metrics } = usePoolMetrics(poolId);

  // Contract write hooks
  const { placeBet, isPending: isBetting } = usePlaceBet();
  const { claim, isPending: isClaiming } = useClaim();
  const { claimCreatorRewards, isPending: isClaimingCreator } = useClaimCreatorRewards();

  // Calculate projected yield based on pool size and remaining time
  const projectedYield = useMemo(() => {
    if (!pool) {
      return { totalYield: 0, prizePool: 0, creatorReward: 0 };
    }

    const totalPrincipal = parseFloat(pool.totalPrincipalFormatted);
    const daysRemaining = pool.timeLeftSeconds / (24 * 60 * 60);

    // If pool is resolved or ended, show actual yield from metrics
    if (!pool.isLive && metrics) {
      const actualYield = parseFloat(metrics.currentTotalYieldFormatted);
      return {
        totalYield: actualYield,
        prizePool: actualYield * (PRIZE_POOL_SHARE / 100),
        creatorReward: actualYield * (CREATOR_SHARE / 100),
      };
    }

    // Project yield for remaining duration: Principal * (APY/100) * (days/365)
    const projectedTotalYield = totalPrincipal * (AAVE_APY / 100) * (daysRemaining / 365);
    const projectedPrizePool = projectedTotalYield * (PRIZE_POOL_SHARE / 100);
    const projectedCreatorReward = projectedTotalYield * (CREATOR_SHARE / 100);

    return {
      totalYield: projectedTotalYield,
      prizePool: projectedPrizePool,
      creatorReward: projectedCreatorReward,
    };
  }, [pool, metrics]);

  const handlePlaceBet = async (side: boolean) => {
    try {
      if (betAmount <= 0) {
        notification.error("Please enter an amount");
        return;
      }

      notification.info("Placing bet... Please approve USDC spending.");
      await placeBet(poolId, side, betAmount);
      notification.success(`Successfully bet ${betAmount} USDC on ${side ? "YES" : "NO"}!`);

      setBetAmount(0);
      refetchPool();
      refetchBet();
    } catch (error: unknown) {
      console.error("Error placing bet:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to place bet";
      notification.error(errorMessage);
    }
  };

  const handleClaim = async () => {
    try {
      notification.info("Claiming winnings...");
      await claim(poolId);
      notification.success("Successfully claimed your winnings!");
      refetchBet();
    } catch (error: unknown) {
      console.error("Error claiming:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to claim";
      notification.error(errorMessage);
    }
  };

  const handleClaimCreatorRewards = async () => {
    try {
      notification.info("Claiming creator rewards...");
      await claimCreatorRewards(poolId);
      notification.success("Successfully claimed creator rewards!");
      refetchPool();
    } catch (error: unknown) {
      console.error("Error claiming creator rewards:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to claim creator rewards";
      notification.error(errorMessage);
    }
  };

  // Loading state
  if (poolLoading) {
    return (
      <div className="flex min-h-screen w-full bg-white relative overflow-x-hidden font-sans items-center justify-center">
        <GlobalStyles />
        <Loader2 className="animate-spin text-[#a88ff0]" size={48} />
      </div>
    );
  }

  // Pool not found
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

  const isCreator = address?.toLowerCase() === pool.creator.toLowerCase();
  const canClaimCreatorRewards = isCreator && pool.resolved && pool.creatorPrincipal > BigInt(0);

  return (
    <div className="flex min-h-screen w-full bg-white relative overflow-x-hidden font-sans selection:bg-[#a88ff0] selection:text-white pb-20">
      <GlobalStyles />

      <Sidebar />

      {/* Top Navigation */}
      <TopNav />

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
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4 leading-[1.1] tracking-tight">
              {pool.question}
            </h1>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-12">
              <div className={`w-3 h-3 rounded-full ${pool.isLive ? "bg-[#4ade80] animate-pulse" : "bg-[#f87171]"}`} />
              <span className={`font-medium text-sm ${pool.isLive ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                {pool.isLive
                  ? formatTimeLeft(pool.timeLeftSeconds)
                  : pool.resolved
                    ? "Resolved"
                    : "Betting period over"}
              </span>
            </div>

            {pool.isLive ? (
              <>
                {/* Pool Stats */}
                <div className="mb-12 p-6 border-l-4 border-[#a88ff0] bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wider">Current Pool Size</h3>
                  <p className="text-[#a88ff0] text-3xl md:text-4xl font-black tracking-tight">
                    {parseFloat(pool.totalPrincipalFormatted).toFixed(2)} USDC
                  </p>
                </div>

                {/* Betting Distribution */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-black mb-6 border-b-2 border-black pb-2 inline-block">
                    Current Betting Distribution:
                  </h3>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-4 bg-[#4ade80]/10 rounded-xl border border-[#4ade80]">
                      <span className="text-lg font-bold text-[#22c55e]">YES</span>
                      <span className="text-lg font-semibold text-black">
                        {parseFloat(pool.yesPrincipalFormatted).toFixed(2)} USDC
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#f87171]/10 rounded-xl border border-[#f87171]">
                      <span className="text-lg font-bold text-[#ef4444]">NO</span>
                      <span className="text-lg font-semibold text-black">
                        {parseFloat(pool.noPrincipalFormatted).toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Projected Yield */}
                <div className="mb-8 p-5 bg-[#a88ff0]/5 rounded-xl border-2 border-[#a88ff0]/30">
                  <h4 className="text-sm font-bold text-black mb-4 uppercase tracking-wide">Projected Returns</h4>
                  <div className={isCreator ? "grid grid-cols-2 gap-6" : ""}>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium">Prize Pool (60%)</p>
                      <p className="text-xl font-bold text-black">{projectedYield.prizePool.toFixed(4)} USDC</p>
                    </div>
                    {isCreator && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium">Your Reward (40%)</p>
                        <p className="text-xl font-bold text-[#a88ff0]">
                          {projectedYield.creatorReward.toFixed(4)} USDC
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-4">Estimated based on ~{AAVE_APY}% APY from Aave V3</p>
                </div>

                {/* Current Accrued Yield (if any) */}
                {metrics && parseFloat(metrics.currentTotalYieldFormatted) > 0 && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Accrued So Far</h4>
                    <p className="text-lg font-bold text-black">
                      {parseFloat(metrics.currentTotalYieldFormatted).toFixed(6)} USDC
                    </p>
                  </div>
                )}

                {/* User's Existing Bet */}
                {userBet?.hasBet && (
                  <div className="mb-8 p-6 bg-[#a88ff0]/10 rounded-xl border-2 border-[#a88ff0]">
                    <h4 className="text-lg font-bold text-black mb-2">Your Bet</h4>
                    <p className="text-gray-600">
                      You bet{" "}
                      <span className="font-bold">{parseFloat(userBet.principalFormatted).toFixed(2)} USDC</span> on{" "}
                      <span className={`font-bold ${userBet.side ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {userBet.side ? "YES" : "NO"}
                      </span>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Results Section for Resolved/Closed Pools */}
                {pool.resolved ? (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">AND THE RESULT IS:</h2>
                    <p
                      className={`text-7xl md:text-8xl font-black mb-4 ${pool.outcome ? "text-[#10b981]" : "text-[#f87171]"}`}
                    >
                      {pool.outcome ? "YES" : "NO"}!
                    </p>
                  </div>
                ) : (
                  <div className="mb-12 p-6 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Awaiting Resolution</h3>
                    <p className="text-yellow-700">
                      Betting period has ended. Waiting for the pool creator to resolve the outcome.
                    </p>
                  </div>
                )}

                {/* Final Stats */}
                <div className="mb-8 p-6 border-l-4 border-[#a88ff0] bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wider">Final Pool Size</h3>
                  <p className="text-[#a88ff0] text-3xl md:text-4xl font-black tracking-tight">
                    {parseFloat(pool.totalPrincipalFormatted).toFixed(2)} USDC
                  </p>
                </div>

                {/* User Claim Section */}
                {userBet?.hasBet && pool.resolved && (
                  <div className="mb-8 p-6 bg-[#a88ff0]/10 rounded-xl border-2 border-[#a88ff0]">
                    <h4 className="text-lg font-bold text-black mb-2">Your Bet</h4>
                    <p className="text-gray-600 mb-4">
                      You bet{" "}
                      <span className="font-bold">{parseFloat(userBet.principalFormatted).toFixed(2)} USDC</span> on{" "}
                      <span className={`font-bold ${userBet.side ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {userBet.side ? "YES" : "NO"}
                      </span>
                      {userBet.side === pool.outcome && " 🎉 You won!"}
                    </p>
                    {!userBet.claimed ? (
                      <button
                        onClick={handleClaim}
                        disabled={isClaiming}
                        className="w-full py-4 rounded-xl text-xl font-bold bg-[#a88ff0] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#9370db] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isClaiming ? "Claiming..." : "Claim Principal + Winnings"}
                      </button>
                    ) : (
                      <p className="text-green-600 font-semibold">✓ Already claimed</p>
                    )}
                  </div>
                )}

                {/* Creator Claim Section */}
                {canClaimCreatorRewards && (
                  <div className="mb-8 p-6 bg-yellow-50 rounded-xl border-2 border-yellow-400">
                    <h4 className="text-lg font-bold text-black mb-2">Creator Rewards</h4>
                    <p className="text-gray-600 mb-4">
                      As the pool creator, you can claim your principal + 40% of the yield.
                    </p>
                    <button
                      onClick={handleClaimCreatorRewards}
                      disabled={isClaimingCreator}
                      className="w-full py-4 rounded-xl text-xl font-bold bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-500 transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isClaimingCreator ? "Claiming..." : "Claim Creator Rewards"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Side - Betting Card (only show for live pools with no existing bet and not creator) */}
          {pool.isLive && !userBet?.hasBet && !isCreator && (
            <div className="sticky top-8">
              <div
                className="w-full md:w-[400px] bg-white rounded-[40px] p-8 border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {/* BUY Label */}
                <p className="text-gray-400 text-xl font-bold tracking-wide uppercase mb-1">BET AMOUNT (USDC)</p>

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
                    disabled={!isConnected || isBetting || betAmount <= 0}
                    onClick={() => handlePlaceBet(true)}
                    className={`w-full py-5 rounded-2xl text-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] ${
                      isConnected && !isBetting && betAmount > 0
                        ? "bg-[#4ade80] text-black hover:bg-[#22c55e]"
                        : "bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed"
                    }`}
                  >
                    {isBetting ? "Betting..." : "YES"}
                  </button>

                  {/* NO Button */}
                  <button
                    disabled={!isConnected || isBetting || betAmount <= 0}
                    onClick={() => handlePlaceBet(false)}
                    className={`w-full py-5 rounded-2xl text-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] ${
                      isConnected && !isBetting && betAmount > 0
                        ? "bg-[#f87171] text-black hover:bg-[#ef4444]"
                        : "bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed"
                    }`}
                  >
                    {isBetting ? "Betting..." : "NO"}
                  </button>
                </div>

                {!isConnected && (
                  <p className="text-center text-gray-400 font-medium text-sm mt-6">Connect wallet to place a bet</p>
                )}
              </div>

              {/* Decorative background element behind card */}
              <div className="absolute -z-10 top-4 -right-4 w-full h-full rounded-[40px] bg-gray-100 border border-gray-200 hidden lg:block"></div>
            </div>
          )}

          {/* Show message for creator that they can't bet */}
          {pool.isLive && isCreator && !userBet?.hasBet && (
            <div className="sticky top-8">
              <div
                className="w-full md:w-[400px] bg-gray-50 rounded-[40px] p-8 border-[3px] border-gray-300"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                <h3 className="text-2xl font-bold text-black mb-4">You created this pool</h3>
                <p className="text-gray-600">
                  As the pool creator, you cannot place bets on your own pool. You will earn 40% of the yield as your
                  creator reward once the pool is resolved.
                </p>
              </div>
            </div>
          )}

          {/* Show bet placed message if user already bet */}
          {pool.isLive && userBet?.hasBet && (
            <div className="sticky top-8">
              <div
                className="w-full md:w-[400px] bg-[#a88ff0]/10 rounded-[40px] p-8 border-[3px] border-[#a88ff0]"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                <h3 className="text-2xl font-bold text-black mb-4">Bet Placed! 🎉</h3>
                <p className="text-gray-600">
                  You already placed a bet on this pool. Wait for the betting period to end and the pool to be resolved
                  to claim your winnings.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
