"use client";

import { useEffect, useRef } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { usePool } from "~~/hooks/useMarketController";
import { formatUnits } from "viem";
import { useChainId } from "wagmi";

const getTokenDecimals = (chainId: number): number => {
  return chainId === 84532 ? 6 : 18; // USDC on Base Sepolia is 6, LINK is 18
};

const formatToken = (value: bigint, chainId: number) => {
  return formatUnits(value, getTokenDecimals(chainId));
};

/**
 * Component to fetch pool data and check if it matches the creator address
 */
export const PoolDataFetcher = ({
  poolId,
  profileAddress,
  onPoolData,
}: {
  poolId: number;
  profileAddress: string;
  onPoolData: (poolId: number, pool: any, userBet: any) => void;
}) => {
  const chainId = useChainId();
  const { pool, isLoading: poolLoading } = usePool(poolId);
  const hasProcessedRef = useRef<string>("");
  
  // Fetch bet for the profile address (not the connected wallet)
  const { data: betData, isLoading: betLoading } = useScaffoldReadContract({
    contractName: "MarketController",
    functionName: "bets",
    args: [BigInt(poolId), profileAddress as `0x${string}`],
  });

  useEffect(() => {
    // Reset if address changes
    const key = `${poolId}-${profileAddress}`;
    if (hasProcessedRef.current === key) {
      // Already processed this pool for this address
      return;
    }
    
    // Wait for both pool and bet data to load
    if (poolLoading || betLoading) return;
    
    // Mark as processed
    hasProcessedRef.current = key;
    
    // If pool doesn't exist, return early
    if (!pool) {
      return;
    }
    
    const normalizedProfileAddress = profileAddress.toLowerCase();
    const isCreator = pool.creator?.toLowerCase() === normalizedProfileAddress;
    
    // Format bet data if it exists
    let userBet = null;
    if (betData && betData[0] > BigInt(0)) {
      userBet = {
        principal: betData[0],
        weight: betData[1],
        side: betData[2],
        claimed: betData[3],
        principalFormatted: formatToken(betData[0], chainId),
        hasBet: true,
      };
    }

    // Call onPoolData if this pool is relevant (created by or bet by profile address)
    if (isCreator || userBet?.hasBet) {
      onPoolData(poolId, pool, userBet);
    }
  }, [pool, betData, poolLoading, betLoading, poolId, profileAddress, chainId, onPoolData]);

  return null;
};
