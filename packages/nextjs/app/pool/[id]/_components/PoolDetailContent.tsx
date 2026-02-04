"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GlobalStyles, PageLoader, Sidebar, TopNav } from "../../../_components";
import { ArrowLeft } from "lucide-react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import {
  formatTimeLeft,
  useAaveApy,
  useClaim,
  useClaimCreatorRewards,
  usePlaceBet,
  usePool,
  usePoolMetrics,
  useRequestResolution,
  useSettleResolution,
  useUserBet,
} from "~~/hooks/useMarketController";
import { notification } from "~~/utils/scaffold-eth";

const FALLBACK_APY = 3.5;
const PRIZE_POOL_SHARE = 60;
const CREATOR_SHARE = 40;

export const PoolDetailContent = () => {
  const params = useParams();
  const router = useRouter();
  const { address, isReconnecting, status } = useAccount();
  const [betAmount, setBetAmount] = useState(0);
  const [checkComplete, setCheckComplete] = useState(false);

  const poolId = useMemo(() => (params.id ? (isNaN(Number(params.id)) ? null : Number(params.id)) : null), [params.id]);

  const { pool, isLoading: poolLoading, refetch: refetchPool } = usePool(poolId);
  const { userBet, refetch: refetchBet } = useUserBet(poolId);
  const { metrics } = usePoolMetrics(poolId);
  const { apy: fetchedApy, apyFormatted } = useAaveApy();

  const currentApy = fetchedApy ?? FALLBACK_APY;

  const { placeBet, isPending: isBetting } = usePlaceBet();
  const { claim, isPending: isClaiming } = useClaim();
  const { claimCreatorRewards, isPending: isClaimingCreator } = useClaimCreatorRewards();
  const { requestResolution, isPending: isRequesting } = useRequestResolution();
  const { settleResolution, isPending: isSettling } = useSettleResolution();

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

  const projectedYield = useMemo(() => {
    if (!pool) {
      return { totalYield: 0, prizePool: 0, creatorReward: 0 };
    }

    const totalPrincipal = parseFloat(pool.totalPrincipalFormatted);
    const daysRemaining = pool.timeLeftSeconds / (24 * 60 * 60);

    if (!pool.isLive && metrics) {
      const actualYield = parseFloat(metrics.currentTotalYieldFormatted);
      return {
        totalYield: actualYield,
        prizePool: actualYield * (PRIZE_POOL_SHARE / 100),
        creatorReward: actualYield * (CREATOR_SHARE / 100),
      };
    }

    const currentAccruedYield = metrics ? parseFloat(metrics.currentTotalYieldFormatted) : 0;
    const futureYield = totalPrincipal * (currentApy / 100) * (daysRemaining / 365);
    const projectedTotalYield = currentAccruedYield + futureYield;

    const projectedPrizePool = projectedTotalYield * (PRIZE_POOL_SHARE / 100);
    const projectedCreatorReward = projectedTotalYield * (CREATOR_SHARE / 100);

    return {
      totalYield: projectedTotalYield,
      prizePool: projectedPrizePool,
      creatorReward: projectedCreatorReward,
    };
  }, [pool, metrics, currentApy]);

  const userPayout = useMemo(() => {
    if (!pool || !userBet?.hasBet || !pool.resolved) {
      return null;
    }

    const userPrincipal = parseFloat(userBet.principalFormatted);
    const isWinner = userBet.side === pool.outcome;

    if (!isWinner) {
      return {
        isWinner: false,
        principal: userPrincipal,
        winnings: 0,
        total: userPrincipal,
      };
    }

    const prizePool = projectedYield.prizePool;
    const userWeight = Number(userBet.weight);
    const totalWinningWeight = userBet.side ? Number(pool.totalYesWeight) : Number(pool.totalNoWeight);

    const userShare = totalWinningWeight > 0 ? (userWeight / totalWinningWeight) * prizePool : 0;

    return {
      isWinner: true,
      principal: userPrincipal,
      winnings: userShare,
      total: userPrincipal + userShare,
    };
  }, [pool, userBet, projectedYield]);

  const creatorPayout = useMemo(() => {
    if (!pool || !pool.resolved) {
      return null;
    }

    const creatorPrincipal = parseFloat(formatUnits(pool.creatorPrincipal, 18));
    const creatorReward = projectedYield.creatorReward;

    return {
      principal: creatorPrincipal,
      reward: creatorReward,
      total: creatorPrincipal + creatorReward,
    };
  }, [pool, projectedYield]);

  const handlePlaceBet = async (side: boolean) => {
    try {
      if (betAmount <= 0) {
        notification.error("Please enter an amount");
        return;
      }

      if (poolId === null) {
        notification.error("Invalid pool ID");
        return;
      }

      notification.info("Placing bet... Please approve token spending.");
      await placeBet(poolId, side, betAmount);
      notification.success(`Successfully bet ${betAmount} on ${side ? "YES" : "NO"}!`);

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
      if (poolId === null) {
        notification.error("Invalid pool ID");
        return;
      }
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
      if (poolId === null) {
        notification.error("Invalid pool ID");
        return;
      }
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

  const handleRequestResolution = async () => {
    try {
      if (poolId === null) {
        notification.error("Invalid pool ID");
        return;
      }
      notification.info("Requesting resolution from UMA oracle...");
      await requestResolution(poolId);
      notification.success("Resolution requested successfully!");
      refetchPool();
    } catch (error: unknown) {
      console.error("Error requesting resolution:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to request resolution";
      notification.error(errorMessage);
    }
  };

  const handleSettleResolution = async () => {
    try {
      if (poolId === null) {
        notification.error("Invalid pool ID");
        return;
      }
      notification.info("Settling oracle resolution...");
      await settleResolution(poolId);
      notification.success("Pool resolved successfully!");
      refetchPool();
    } catch (error: unknown) {
      console.error("Error settling resolution:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to settle resolution";
      notification.error(errorMessage);
    }
  };

  if (poolId === null || !checkComplete || poolLoading) {
    return <PageLoader />;
  }

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

  const getPoolStatus = () => {
    if (pool.resolved) return { text: "Resolved", className: "bg-[#f87171]" };
    if (pool.isResolutionPending) return { text: "Resolution Pending", className: "bg-yellow-400 animate-pulse" };
    if (pool.isLive) return { text: "Live", className: "bg-[#4ade80] animate-pulse" };
    return { text: "Betting Ended", className: "bg-[#f87171]" };
  };

  const statusInfo = getPoolStatus();

  return (
    <div className="flex min-h-screen w-full bg-white relative overflow-x-hidden font-sans selection:bg-[#a88ff0] selection:text-white pb-20">
      <GlobalStyles />
      <Sidebar />
      <TopNav />

      <main className="flex-1 ml-[240px] relative py-12 pr-12 pl-8 max-w-[1400px]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors mb-12"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="flex-1 max-w-2xl" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4 leading-[1.1] tracking-tight">
              {pool.question}
            </h1>

            <div className="flex items-center gap-2 mb-12">
              <div className={`w-3 h-3 rounded-full ${statusInfo.className}`} />
              <span className={`font-medium text-sm text-black`}>
                {pool.isLive ? formatTimeLeft(pool.timeLeftSeconds) : statusInfo.text}
              </span>
            </div>

            {pool.isLive ? (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">Place your bet</h2>
                <div className="flex items-center gap-4 mb-4">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={betAmount}
                    onChange={e => setBetAmount(Number(e.target.value))}
                    className="w-full h-14 px-4 bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-none outline-none text-black placeholder-gray-400 focus:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePlaceBet(true)}
                    disabled={isBetting}
                    className="w-full py-4 rounded-xl text-xl font-bold bg-green-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-600 transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBetting ? "Betting..." : "Bet on YES"}
                  </button>
                  <button
                    onClick={() => handlePlaceBet(false)}
                    disabled={isBetting}
                    className="w-full py-4 rounded-xl text-xl font-bold bg-red-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBetting ? "Betting..." : "Bet on NO"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {pool.resolved ? (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-black mb-4 uppercase tracking-wide">AND THE RESULT IS:</h2>
                    <p
                      className={`text-7xl md:text-8xl font-black mb-4 ${
                        pool.outcome ? "text-[#10b981]" : "text-[#f87171]"
                      }`}
                    >
                      {pool.outcome ? "YES" : "NO"}!
                    </p>
                  </div>
                ) : (
                  <div className="mb-12 p-6 bg-blue-50 border-2 border-blue-400 rounded-xl">
                    <h3 className="text-lg font-bold text-blue-800 mb-2">🔮 Oracle Resolution</h3>
                    {!pool.requestSubmitted ? (
                      <>
                        <p className="text-blue-700 mb-6">
                          The betting period has ended. Anyone can now request the oracle to resolve the outcome.
                        </p>
                        <button
                          onClick={handleRequestResolution}
                          disabled={isRequesting}
                          className="w-full py-4 rounded-xl text-xl font-bold bg-blue-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-600 transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRequesting ? "Requesting..." : "Request Resolution"}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-blue-700 mb-6">
                          Resolution has been requested. The outcome will be available after the liveness period (30s
                          for testnet).
                        </p>
                        <button
                          onClick={handleSettleResolution}
                          disabled={isSettling || !pool.canSettle}
                          className="w-full py-4 rounded-xl text-xl font-bold bg-green-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-600 transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSettling ? "Settling..." : "Settle Resolution"}
                        </button>
                        {!pool.canSettle && (
                          <p className="text-xs text-center mt-2 text-gray-500">Settlement is not yet available.</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {userPayout && (
                  <div className="mb-12 p-6 bg-green-50 border-2 border-green-400 rounded-xl">
                    <h3 className="text-lg font-bold text-green-800 mb-2">Your Payout</h3>
                    <p className="text-green-700 mb-6">
                      {userPayout.isWinner
                        ? "Congratulations! You won this round."
                        : "Sorry, you didn't win this round."}
                    </p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">Principal</span>
                      <span className="font-bold text-black">{userPayout.principal.toFixed(2)} LINK</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">Winnings</span>
                      <span className="font-bold text-black">{userPayout.winnings.toFixed(2)} LINK</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-xl">
                      <span className="text-black">Total</span>
                      <span className="text-black">{userPayout.total.toFixed(2)} LINK</span>
                    </div>
                    {!userBet?.claimed && userPayout.isWinner && (
                      <button
                        onClick={handleClaim}
                        disabled={isClaiming}
                        className="w-full mt-6 py-4 rounded-xl text-xl font-bold bg-green-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-600 transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isClaiming ? "Claiming..." : "Claim Winnings"}
                      </button>
                    )}
                  </div>
                )}

                {canClaimCreatorRewards && (
                  <div className="mb-12 p-6 bg-purple-50 border-2 border-purple-400 rounded-xl">
                    <h3 className="text-lg font-bold text-purple-800 mb-2">Creator Rewards</h3>
                    <p className="text-purple-700 mb-6">As the creator of this pool, you can claim your rewards.</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">Principal</span>
                      <span className="font-bold text-black">{creatorPayout?.principal.toFixed(2)} LINK</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">Reward</span>
                      <span className="font-bold text-black">{creatorPayout?.reward.toFixed(2)} LINK</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-xl">
                      <span className="text-black">Total</span>
                      <span className="text-black">{creatorPayout?.total.toFixed(2)} LINK</span>
                    </div>
                    <button
                      onClick={handleClaimCreatorRewards}
                      disabled={isClaimingCreator}
                      className="w-full mt-6 py-4 rounded-xl text-xl font-bold bg-purple-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-600 transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isClaimingCreator ? "Claiming..." : "Claim Rewards"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="w-full lg:w-[400px] lg:min-w-[400px] bg-white rounded-[32px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-bold text-black mb-6" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Pool Metrics
            </h3>

            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Liquidity</span>
                <span className="text-black font-bold text-lg">
                  {parseFloat(pool.totalPrincipalFormatted).toFixed(2)} LINK
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Prize Pool (Projected)</span>
                <span className="text-black font-bold text-lg">{projectedYield.prizePool.toFixed(2)} LINK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Creator Rewards (Projected)</span>
                <span className="text-black font-bold text-lg">{projectedYield.creatorReward.toFixed(2)} LINK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Aave APY</span>
                <span className="text-black font-bold text-lg">{apyFormatted}%</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t-2 border-gray-100">
              <h4 className="text-xl font-bold text-black mb-4" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Bet Distribution
              </h4>
              <div className="relative w-full h-4 bg-red-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-green-400"
                  style={{
                    width: `${
                      (Number(pool.totalYesWeight) / (Number(pool.totalYesWeight) + Number(pool.totalNoWeight))) * 100
                    }%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="font-semibold text-green-600">
                  YES: {parseFloat(pool.yesPrincipalFormatted).toFixed(2)} LINK
                </span>
                <span className="font-semibold text-red-600">
                  NO: {parseFloat(pool.noPrincipalFormatted).toFixed(2)} LINK
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
