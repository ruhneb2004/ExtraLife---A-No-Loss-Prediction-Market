"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GlobalStyles, PageLoader, Sidebar, TopNav } from "../../../_components";
import { ArrowLeft } from "lucide-react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import {
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
import { formatTimeLeft } from "~~/utils/scaffold-eth/time";

const FALLBACK_APY = 3.5;
const PRIZE_POOL_SHARE = 60;
const CREATOR_SHARE = 40;

export const PoolDetailContent = () => {
  const params = useParams();
  const router = useRouter();
  const { isConnected, isReconnecting, status } = useAccount();
  const [betAmount, setBetAmount] = useState(0);
  const [checkComplete, setCheckComplete] = useState(false);

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

      notification.info("Placing bet... Please approve LINK spending.");
      await placeBet(poolId, side, betAmount);
      notification.success(`Successfully bet ${betAmount} LINK on ${side ? "YES" : "NO"}!`);

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

  const canClaimCreatorRewards = pool.isCreator && pool.resolved && pool.creatorPrincipal > BigInt(0);

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
                <div className="mb-12 p-6 border-l-4 border-[#a88ff0] bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wider">Current Pool Size</h3>
                  <p className="text-[#a88ff0] text-3xl md:text-4xl font-black tracking-tight">
                    {parseFloat(pool.totalPrincipalFormatted).toFixed(2)} LINK
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-black mb-6 border-b-2 border-black pb-2 inline-block">
                    Current Betting Distribution:
                  </h3>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-4 bg-[#4ade80]/10 rounded-xl border border-[#4ade80]">
                      <span className="text-lg font-bold text-[#22c55e]">YES</span>
                      <span className="text-lg font-semibold text-black">
                        {parseFloat(pool.yesPrincipalFormatted).toFixed(2)} LINK
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#f87171]/10 rounded-xl border border-[#f87171]">
                      <span className="text-lg font-bold text-[#ef4444]">NO</span>
                      <span className="text-lg font-semibold text-black">
                        {parseFloat(pool.noPrincipalFormatted).toFixed(2)} LINK
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-8 p-5 bg-[#a88ff0]/5 rounded-xl border-2 border-[#a88ff0]/30">
                  <h4 className="text-sm font-bold text-black mb-4 uppercase tracking-wide">Projected Returns</h4>
                  <div className={pool.isCreator ? "grid grid-cols-2 gap-6" : ""}>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium">Prize Pool (60%)</p>
                      <p className="text-xl font-bold text-black">{projectedYield.prizePool.toFixed(4)} LINK</p>
                    </div>
                    {pool.isCreator && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium">Your Reward (40%)</p>
                        <p className="text-xl font-bold text-[#a88ff0]">
                          {projectedYield.creatorReward.toFixed(4)} LINK
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-4">Estimated based on ~{apyFormatted} APY from Aave V3</p>
                </div>

                {metrics && parseFloat(metrics.currentTotalYieldFormatted) > 0 && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Accrued So Far</h4>
                    <p className="text-lg font-bold text-black">
                      {parseFloat(metrics.currentTotalYieldFormatted).toFixed(6)} LINK
                    </p>
                  </div>
                )}

                {userBet?.hasBet && (
                  <div className="mb-8 p-6 bg-[#a88ff0]/10 rounded-xl border-2 border-[#a88ff0]">
                    <h4 className="text-lg font-bold text-black mb-2">Your Bet</h4>
                    <p className="text-gray-600">
                      You bet{" "}
                      <span className="font-bold">{parseFloat(userBet.principalFormatted).toFixed(2)} LINK</span> on{" "}
                      <span className={`font-bold ${userBet.side ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {userBet.side ? "YES" : "NO"}
                      </span>
                    </p>
                  </div>
                )}
              </>
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

                <div className="mb-8 p-6 border-l-4 border-[#a88ff0] bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wider">Final Pool Size</h3>
                  <p className="text-[#a88ff0] text-3xl md:text-4xl font-black tracking-tight">
                    {parseFloat(pool.totalPrincipalFormatted).toFixed(2)} LINK
                  </p>
                </div>

                {userBet?.hasBet && pool.resolved && userPayout && (
                  <div className="mb-8 p-6 rounded-xl border border-gray-200 bg-gray-50">
                    <div className="mb-4">
                      <h4 className="text-xl font-bold text-black mb-1">
                        {userPayout.isWinner ? "You Won" : "You Lost"}
                      </h4>
                      <p className="text-gray-500 text-sm">
                        You bet on <span className="font-semibold text-black">{userBet.side ? "YES" : "NO"}</span>
                        {" · "}Outcome was{" "}
                        <span className="font-semibold text-black">{pool.outcome ? "YES" : "NO"}</span>
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                      <p className="text-gray-600 text-center">
                        You invested{" "}
                        <span className="font-bold text-black">{userPayout.principal.toFixed(4)} LINK</span>
                        {userPayout.isWinner && userPayout.winnings > 0 && (
                          <span className="text-green-600"> (+{userPayout.winnings.toFixed(4)} winnings)</span>
                        )}
                      </p>
                      <p className="text-center mt-3 text-lg">
                        You get back{" "}
                        <span className="font-bold text-black text-xl">{userPayout.total.toFixed(4)} LINK</span>
                      </p>
                    </div>

                    {!userBet.claimed ? (
                      <button
                        onClick={handleClaim}
                        disabled={isClaiming}
                        className="w-full py-4 rounded-xl text-xl font-bold bg-[#a88ff0] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#9370db] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isClaiming ? "Claiming..." : `Claim ${userPayout.total.toFixed(4)} LINK`}
                      </button>
                    ) : (
                      <p className="text-gray-500 font-medium text-center py-2">Already claimed</p>
                    )}
                  </div>
                )}

                {canClaimCreatorRewards && creatorPayout && (
                  <div className="mb-8 p-6 rounded-xl border border-gray-200 bg-gray-50">
                    <div className="mb-4">
                      <h4 className="text-xl font-bold text-black mb-1">Creator Rewards</h4>
                      <p className="text-gray-500 text-sm">Your pool has been resolved</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                      <p className="text-gray-600 text-center">
                        You invested{" "}
                        <span className="font-bold text-black">{creatorPayout.principal.toFixed(4)} LINK</span>
                        <span className="text-[#a88ff0]"> (+{creatorPayout.reward.toFixed(4)} creator reward)</span>
                      </p>
                      <p className="text-center mt-3 text-lg">
                        You get back{" "}
                        <span className="font-bold text-black text-xl">{creatorPayout.total.toFixed(4)} LINK</span>
                      </p>
                    </div>

                    <button
                      onClick={handleClaimCreatorRewards}
                      disabled={isClaimingCreator}
                      className="w-full py-4 rounded-xl text-xl font-bold bg-[#a88ff0] text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#9370db] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isClaimingCreator ? "Claiming..." : `Claim ${creatorPayout.total.toFixed(4)} LINK`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {pool.isLive && !userBet?.hasBet && !pool.isCreator && (
            <div className="sticky top-8">
              <div
                className="w-full md:w-[400px] bg-white rounded-[40px] p-8 border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                <p className="text-gray-400 text-xl font-bold tracking-wide uppercase mb-1">BET AMOUNT (LINK)</p>

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

                <div className="space-y-4">
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

              <div className="absolute -z-10 top-4 -right-4 w-full h-full rounded-[40px] bg-gray-100 border border-gray-200 hidden lg:block"></div>
            </div>
          )}

          {pool.isLive && pool.isCreator && !userBet?.hasBet && (
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

          {pool.isLive && userBet?.hasBet && (
            <div className="sticky top-8">
              <div
                className="w-full md:w-[400px] bg-[#a88ff0]/10 rounded-[40px] p-8 border-[3px] border-[#a88ff0]"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                <h3 className="text-2xl font-bold text-black mb-4">Bet Placed! </h3>
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
