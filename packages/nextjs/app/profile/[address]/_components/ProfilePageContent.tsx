"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GlobalStyles, PageLoader, Sidebar, TopNav } from "../../../_components";
import { PoolDataFetcher } from "./PoolDataFetcher";
import { blo } from "blo";
import { normalize } from "viem/ens";
import { useEnsAvatar, useEnsName, useEnsText } from "wagmi";
import { usePoolCount } from "~~/hooks/useMarketController";

export const ProfilePageContent = () => {
  const params = useParams();
  const profileAddress = params.address as string;

  const { poolCount, isLoading: countLoading } = usePoolCount();
  const poolIds = Array.from({ length: poolCount }, (_, i) => i + 1);

  // Fetch ENS data
  const { data: ensName } = useEnsName({
    address: profileAddress as `0x${string}` | undefined,
    chainId: 1,
    query: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  });

  const normalizedEnsName = useMemo(() => {
    if (!ensName) return undefined;
    try {
      return normalize(ensName);
    } catch {
      return undefined;
    }
  }, [ensName]);

  const { data: ensAvatar } = useEnsAvatar({
    name: normalizedEnsName ?? undefined,
    chainId: 1,
    query: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  });

  // Fetch ENS text records
  const { data: description } = useEnsText({
    name: normalizedEnsName ?? undefined,
    key: "description",
    chainId: 1,
    query: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      enabled: !!normalizedEnsName,
    },
  });

  const { data: twitter } = useEnsText({
    name: normalizedEnsName ?? undefined,
    key: "com.twitter",
    chainId: 1,
    query: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      enabled: !!normalizedEnsName,
    },
  });

  const { data: github } = useEnsText({
    name: normalizedEnsName ?? undefined,
    key: "com.github",
    chainId: 1,
    query: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      enabled: !!normalizedEnsName,
    },
  });

  const { data: discord } = useEnsText({
    name: normalizedEnsName ?? undefined,
    key: "com.discord",
    chainId: 1,
    query: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      enabled: !!normalizedEnsName,
    },
  });

  const { data: instagram } = useEnsText({
    name: normalizedEnsName ?? undefined,
    key: "com.instagram",
    chainId: 1,
    query: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      enabled: !!normalizedEnsName,
    },
  });

  const { data: url } = useEnsText({
    name: normalizedEnsName ?? undefined,
    key: "url",
    chainId: 1,
    query: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      enabled: !!normalizedEnsName,
    },
  });

  const displayName = useMemo(() => {
    if (ensName) return ensName;
    return `${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}`;
  }, [ensName, profileAddress]);

  // Generate avatar URL - use ENS avatar if available, otherwise generate blockie
  const avatarUrl = useMemo(() => {
    if (ensAvatar) return ensAvatar;
    // Generate deterministic blockie avatar based on address
    try {
      return blo(profileAddress as `0x${string}`);
    } catch {
      return null;
    }
  }, [ensAvatar, profileAddress]);

  // Build social links array
  const socialLinks = useMemo(() => {
    const links: Array<{ name: string; url: string }> = [];
    if (twitter) links.push({ name: "Twitter", url: `https://twitter.com/${twitter.replace("@", "")}` });
    if (github) links.push({ name: "GitHub", url: `https://github.com/${github.replace("@", "")}` });
    if (discord)
      links.push({
        name: "Discord",
        url: discord.startsWith("http") ? discord : `https://discord.com/users/${discord}`,
      });
    if (instagram) links.push({ name: "Instagram", url: `https://instagram.com/${instagram.replace("@", "")}` });
    if (url) links.push({ name: "Website", url: url.startsWith("http") ? url : `https://${url}` });
    return links;
  }, [twitter, github, discord, instagram, url]);

  // Store pool and bet data
  const [poolsData, setPoolsData] = useState<Map<number, any>>(new Map());
  const [userBetsData, setUserBetsData] = useState<Map<number, any>>(new Map());
  const processedPoolsRef = useRef<Set<number>>(new Set());

  // Reset processed pools when address changes
  useEffect(() => {
    processedPoolsRef.current.clear();
    setPoolsData(new Map());
    setUserBetsData(new Map());
  }, [profileAddress]);

  const handlePoolData = useCallback(
    (poolId: number, pool: any, userBet: any) => {
      // Prevent duplicate processing
      if (processedPoolsRef.current.has(poolId)) return;
      processedPoolsRef.current.add(poolId);

      setPoolsData(prev => {
        const next = new Map(prev);
        next.set(poolId, pool);
        return next;
      });

      if (userBet?.hasBet) {
        setUserBetsData(prev => {
          const next = new Map(prev);
          next.set(poolId, userBet);
          return next;
        });
      }
    },
    [profileAddress],
  );

  // Calculate stats
  const stats = useMemo(() => {
    let totalBets = 0;
    let wins = 0;
    let totalProfit = 0;
    const recentBets: any[] = [];
    const createdPools: any[] = [];

    // First, collect all pools created by this address
    poolsData.forEach((pool, poolId) => {
      if (pool?.creator?.toLowerCase() === profileAddress.toLowerCase()) {
        createdPools.push({ poolId, pool });
      }
    });

    // Count bets placed by this address
    userBetsData.forEach((userBet, poolId) => {
      const pool = poolsData.get(poolId);
      if (userBet?.hasBet && pool) {
        totalBets++;

        if (pool.resolved) {
          const isWinner = userBet.side === pool.outcome;
          if (isWinner) {
            wins++;
            // Calculate profit: if winner, estimate winnings based on pool yield
            // Simplified: assume winner gets proportional share of prize pool
            const totalPrincipal = parseFloat(pool.totalPrincipalFormatted);
            const winnerSideTotal = userBet.side
              ? parseFloat(pool.yesPrincipalFormatted)
              : parseFloat(pool.noPrincipalFormatted);

            // Estimate yield (60% goes to winners)
            const estimatedYield = totalPrincipal * 0.035; // ~3.5% APY estimate
            const prizePool = estimatedYield * 0.6;
            const userShare =
              winnerSideTotal > 0 ? (parseFloat(userBet.principalFormatted) / winnerSideTotal) * prizePool : 0;

            totalProfit += userShare;
          }
        }

        // Add to recent bets
        recentBets.push({
          poolId,
          pool,
          userBet,
        });
      }
    });

    // Also add created pools to recent bets if they don't have a bet
    createdPools.forEach(({ poolId, pool }) => {
      if (!userBetsData.has(poolId)) {
        recentBets.push({
          poolId,
          pool,
          userBet: null,
          isCreator: true,
        });
      }
    });

    // Sort recent bets by pool ID (most recent first)
    recentBets.sort((a, b) => b.poolId - a.poolId);

    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

    return {
      winRate: winRate.toFixed(0),
      profit: totalProfit.toFixed(2),
      totalBets,
      createdPoolsCount: createdPools.length,
      recentBets: recentBets.slice(0, 10), // Last 10 bets
    };
  }, [poolsData, userBetsData, profileAddress]);

  // Track loading state
  const [isFetchingData, setIsFetchingData] = useState(true);

  useEffect(() => {
    if (poolIds.length > 0) {
      // Set loading to false after a delay to allow data to load
      const timer = setTimeout(() => {
        setIsFetchingData(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsFetchingData(false);
    }
  }, [poolIds.length]);

  if (countLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex min-h-screen w-full bg-white relative overflow-x-hidden font-sans">
      <GlobalStyles />
      <Sidebar />
      <TopNav />

      {/* Hidden fetchers for all pools */}
      {poolIds.map(poolId => (
        <PoolDataFetcher
          key={poolId}
          poolId={poolId}
          profileAddress={profileAddress.toLowerCase()}
          onPoolData={handlePoolData}
        />
      ))}

      <main className="flex-1 ml-[240px] py-12 pr-12 pl-8 max-w-[1400px]">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex items-start gap-8">
            {/* Avatar */}
            <div className="relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={177}
                  height={177}
                  className="w-[177px] h-[177px] rounded-full border-2 border-black"
                  onError={e => {
                    // Fallback to blockie if image fails to load
                    const target = e.target as HTMLImageElement;
                    try {
                      target.src = blo(profileAddress as `0x${string}`);
                    } catch {
                      target.style.display = "none";
                    }
                  }}
                />
              ) : (
                <div className="w-[177px] h-[177px] rounded-full bg-gray-200 border-2 border-black flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-400">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Name and Bio */}
            <div className="flex-1">
              <h1
                className="text-4xl font-semibold text-black mb-2"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {displayName}
              </h1>
              {/* Bio from ENS */}
              {description && (
                <p className="text-xl text-black mb-4" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  {description}
                </p>
              )}

              {/* Social Links from ENS */}
              {socialLinks.length > 0 && (
                <div className="flex gap-4 flex-wrap">
                  {socialLinks.map(social => (
                    <a // ✅ Added <a tag here!
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-200 rounded-full text-sm font-medium text-black cursor-pointer hover:bg-gray-300 transition-colors"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      {social.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Win Rate */}
          <div className="relative">
            <div className="absolute inset-0 bg-black rounded-2xl translate-x-1 translate-y-1"></div>
            <div className="relative bg-white rounded-2xl border-2 border-black p-6">
              <p className="text-2xl font-normal text-black mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Win Rate
              </p>
              <p
                className="text-6xl font-bold text-[#A684FF] mb-2"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {stats.winRate}%
              </p>
              <p className="text-xs font-semibold text-[#05DF72]" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Up 7.2% from last week!
              </p>
            </div>
          </div>

          {/* Profit */}
          <div className="relative">
            <div className="absolute inset-0 bg-black rounded-2xl translate-x-1 translate-y-1"></div>
            <div className="relative bg-[#A684FF] rounded-2xl border-2 border-black p-6">
              <p className="text-2xl font-normal text-black mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Profit
              </p>
              <p className="text-6xl font-bold text-white mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                ${stats.profit}
              </p>
              <p className="text-xs font-semibold text-black" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Lifetime earnings
              </p>
            </div>
          </div>

          {/* Bets Made */}
          <div className="relative">
            <div className="absolute inset-0 bg-black rounded-2xl translate-x-1 translate-y-1"></div>
            <div className="relative bg-white rounded-2xl border-2 border-black p-6">
              <p className="text-2xl font-normal text-black mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Bets made
              </p>
              <p
                className="text-6xl font-bold text-[#A684FF] mb-2"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {stats.totalBets}
              </p>
              <p className="text-xs font-semibold text-black" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                Top 5% in India
              </p>
            </div>
          </div>
        </div>

        {/* Recent Bets */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-4xl font-semibold text-black" style={{ fontFamily: "'Clash Display', sans-serif" }}>
              Recent Bets
            </h2>
            <div className="h-1 bg-[#A684FF] flex-1 max-w-[214px]"></div>
          </div>

          {stats.recentBets.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-black p-8 text-center">
              <p className="text-gray-500" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                {isFetchingData ? "Loading data..." : "No bets or pools found"}
              </p>
              <p className="text-sm text-gray-400 mt-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                {poolIds.length === 0
                  ? "No pools exist yet"
                  : isFetchingData
                    ? `Checking ${poolIds.length} pools...`
                    : `Searched ${poolIds.length} pools`}
              </p>
              {!isFetchingData && poolIds.length > 0 && (
                <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                  Address: {profileAddress}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentBets.map(({ poolId, pool, userBet, isCreator }) => (
                <Link key={poolId} href={`/pool/${poolId}`}>
                  <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-black rounded-2xl translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-all"></div>
                    <div className="relative bg-white rounded-2xl border-2 border-black p-6 flex items-center justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-5 mb-2">
                          <span className="text-base text-black" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                            {isCreator ? "Created" : "Bet"} |
                          </span>
                          {pool?.isLive && (
                            <div className="px-2 py-0.5 bg-[#7AFEBC] rounded-full border border-[#05DF72]">
                              <span
                                className="text-xs font-semibold text-black"
                                style={{ fontFamily: "'Clash Display', sans-serif" }}
                              >
                                LIVE
                              </span>
                            </div>
                          )}
                        </div>
                        <h3
                          className="text-2xl font-medium text-black"
                          style={{ fontFamily: "'Clash Display', sans-serif" }}
                        >
                          {pool?.question || "Loading..."}
                        </h3>
                      </div>
                      <div className="text-right">
                        {userBet?.hasBet ? (
                          <>
                            <p
                              className="text-sm font-medium text-black mb-1"
                              style={{ fontFamily: "'Clash Display', sans-serif" }}
                            >
                              Wagered
                            </p>
                            <p
                              className="text-2xl font-semibold text-[#A684FF]"
                              style={{ fontFamily: "'Clash Display', sans-serif" }}
                            >
                              {userBet.principalFormatted} LINK
                            </p>
                          </>
                        ) : isCreator ? (
                          <>
                            <p
                              className="text-sm font-medium text-black mb-1"
                              style={{ fontFamily: "'Clash Display', sans-serif" }}
                            >
                              Created Pool
                            </p>
                            <p
                              className="text-2xl font-semibold text-[#A684FF]"
                              style={{ fontFamily: "'Clash Display', sans-serif" }}
                            >
                              {pool?.totalPrincipalFormatted || "0"} LINK
                            </p>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
