"use client";

import { useCallback } from "react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "./scaffold-eth";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

// Get token address from the deployed MarketController contract
const getTokenAddress = (chainId: number): `0x${string}` | undefined => {
  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  if (!contracts?.MarketController) return undefined;

  // Based on the deploy script, we can determine the token
  const TOKEN_FALLBACK: Record<number, `0x${string}`> = {
    11155111: "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5", // Sepolia LINK
    84532: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f", // Base Sepolia USDC
  };
  return TOKEN_FALLBACK[chainId];
};

// Get MarketController address from deployedContracts (auto-updated on deploy)
const getMarketControllerAddress = (chainId: number): `0x${string}` | undefined => {
  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  return contracts?.MarketController?.address as `0x${string}` | undefined;
};

const getTokenDecimals = (chainId: number): number => {
  return chainId === 84532 ? 6 : 18; // USDC on Base Sepolia is 6, LINK is 18
};

const formatToken = (value: bigint, chainId: number) => {
  return formatUnits(value, getTokenDecimals(chainId));
};

export type PoolData = {
  id: number;
  creator: string;
  question: string;
  endTime: bigint;
  totalShares: bigint;
  totalPrincipal: bigint;
  creatorPrincipal: bigint;
  resolved: boolean;
  outcome: boolean;
  requestSubmitted: boolean;
  requestTime: bigint;
  ancillaryData: string; // bytes in contract
  yesPrincipal: bigint;
  noPrincipal: bigint;
  totalYesWeight: bigint;
  totalNoWeight: bigint;
  finalTotalYield: bigint;
  // Computed fields
  isLive: boolean;
  isResolutionPending: boolean;
  canSettle: boolean;
  timeLeftSeconds: number;
  totalPrincipalFormatted: string;
  yesPrincipalFormatted: string;
  noPrincipalFormatted: string;
  isCreator: boolean;
};

export type UserBetData = {
  principal: bigint;
  weight: bigint;
  side: boolean; // true = YES, false = NO
  claimed: boolean;
  principalFormatted: string;
  hasBet: boolean;
};

export type PoolMetrics = {
  currentTotalYield: bigint;
  estimatedWinnerPrize: bigint;
  estimatedCreatorFee: bigint;
  currentTotalYieldFormatted: string;
  estimatedWinnerPrizeFormatted: string;
  estimatedCreatorFeeFormatted: string;
};

/**
 * Hook to get pool count
 */
export const usePoolCount = () => {
  const { data, isLoading, refetch, isFetched } = useScaffoldReadContract({
    contractName: "MarketController",
    functionName: "poolCount",
  });

  return {
    poolCount: data !== undefined ? Number(data) : 0,
    isLoading: isLoading || !isFetched,
    refetch,
  };
};

/**
 * Hook to get a single pool's data
 */
export const usePool = (poolId: number | null) => {
  const chainId = useChainId();
  const { address } = useAccount();
  const { data, isLoading, refetch, isFetched } = useScaffoldReadContract({
    contractName: "MarketController",
    functionName: "pools",
    args: [poolId === null ? undefined : BigInt(poolId)],
  });

  const pool: PoolData | null =
    data && poolId !== null
      ? {
          id: poolId,
          creator: data[0],
          question: data[1],
          endTime: data[2],
          totalShares: data[3],
          totalPrincipal: data[4],
          creatorPrincipal: data[5],
          resolved: data[6],
          outcome: data[7],
          requestSubmitted: data[8],
          requestTime: data[9],
          ancillaryData: data[10],
          yesPrincipal: data[11],
          noPrincipal: data[12],
          totalYesWeight: data[13],
          totalNoWeight: data[14],
          finalTotalYield: data[15],
          // Computed
          isLive: !data[6] && BigInt(Math.floor(Date.now() / 1000)) < data[2],
          isResolutionPending: data[8] && !data[6],
          // UMA Liveness is 30s in the test contract
          canSettle: data[8] && !data[6] && BigInt(Math.floor(Date.now() / 1000)) > data[9] + BigInt(30),
          timeLeftSeconds: Math.max(0, Number(data[2]) - Math.floor(Date.now() / 1000)),
          totalPrincipalFormatted: formatToken(data[4], chainId),
          yesPrincipalFormatted: formatToken(data[11], chainId),
          noPrincipalFormatted: formatToken(data[12], chainId),
          isCreator: address?.toLowerCase() === data[0].toLowerCase(),
        }
      : null;

  return {
    pool,
    isLoading: (isLoading || !isFetched) && poolId !== null,
    refetch,
  };
};

/**
 * Hook to get all pools
 */
export const useAllPools = () => {
  const { poolCount, isLoading: countLoading } = usePoolCount();
  const poolIds = Array.from({ length: poolCount }, (_, i) => i + 1);

  return {
    poolCount,
    isLoading: countLoading,
    poolIds,
  };
};

/**
 * Hook to get user's bet on a pool
 */
export const useUserBet = (poolId: number | null) => {
  const { address } = useAccount();
  const chainId = useChainId();

  const { data, isLoading, refetch } = useScaffoldReadContract({
    contractName: "MarketController",
    functionName: "bets",
    args: [poolId === null ? undefined : BigInt(poolId), address],
  });

  const userBet: UserBetData | null = data
    ? {
        principal: data[0],
        weight: data[1],
        side: data[2],
        claimed: data[3],
        principalFormatted: formatToken(data[0], chainId),
        hasBet: data[0] > BigInt(0),
      }
    : null;

  return {
    userBet,
    isLoading,
    refetch,
  };
};

/**
 * Hook to get pool metrics (yield info)
 */
export const usePoolMetrics = (poolId: number | null) => {
  const chainId = useChainId();
  const { data, isLoading, refetch } = useScaffoldReadContract({
    contractName: "MarketController",
    functionName: "getPoolMetrics",
    args: [poolId === null ? undefined : BigInt(poolId)],
  });

  const metrics: PoolMetrics | null = data
    ? {
        currentTotalYield: data[0],
        estimatedWinnerPrize: data[1],
        estimatedCreatorFee: data[2],
        currentTotalYieldFormatted: formatToken(data[0], chainId),
        estimatedWinnerPrizeFormatted: formatToken(data[1], chainId),
        estimatedCreatorFeeFormatted: formatToken(data[2], chainId),
      }
    : null;

  return {
    metrics,
    isLoading,
    refetch,
  };
};

/**
 * Hook to create a new pool
 */
export const useCreatePool = () => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const createPool = useCallback(
    async (question: string, durationSeconds: number, initialSeed: number) => {
      if (!address || !chain || !publicClient) throw new Error("Wallet not connected");

      const tokenAddress = getTokenAddress(chain.id);
      const marketAddress = getMarketControllerAddress(chain.id);
      if (!tokenAddress || !marketAddress) throw new Error("Unsupported chain");

      const contracts = deployedContracts[chain.id as keyof typeof deployedContracts];
      if (!contracts?.MarketController) throw new Error("Contract not found");

      const duration = BigInt(durationSeconds);
      const seedAmount = parseUnits(initialSeed.toString(), getTokenDecimals(chain.id));

      const currentAllowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, marketAddress],
      });

      if (currentAllowance < seedAmount) {
        const approvalTxHash = await writeContractAsync({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [marketAddress, seedAmount],
        });
        await publicClient.waitForTransactionReceipt({ hash: approvalTxHash });
      }

      const createTxHash = await writeContractAsync({
        address: marketAddress,
        abi: contracts.MarketController.abi,
        functionName: "createPool",
        args: [question, duration, seedAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: createTxHash });

      return createTxHash;
    },
    [address, chain, publicClient, writeContractAsync],
  );

  return {
    createPool,
    isPending,
  };
};

/**
 * Hook to place a bet
 */
export const usePlaceBet = () => {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const placeBet = useCallback(
    async (poolId: number, side: boolean, amount: number) => {
      if (!address || !chain || !publicClient) throw new Error("Wallet not connected");

      const tokenAddress = getTokenAddress(chain.id);
      const marketAddress = getMarketControllerAddress(chain.id);
      if (!tokenAddress || !marketAddress) throw new Error("Unsupported chain");

      const contracts = deployedContracts[chain.id as keyof typeof deployedContracts];
      if (!contracts?.MarketController) throw new Error("Contract not found");

      const betAmount = parseUnits(amount.toString(), getTokenDecimals(chain.id));

      const currentAllowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, marketAddress],
      });

      if (currentAllowance < betAmount) {
        const approvalTxHash = await writeContractAsync({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [marketAddress, betAmount],
        });
        await publicClient.waitForTransactionReceipt({ hash: approvalTxHash });
      }

      const betTxHash = await writeContractAsync({
        address: marketAddress,
        abi: contracts.MarketController.abi,
        functionName: "placeBet",
        args: [BigInt(poolId), side, betAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: betTxHash });

      return betTxHash;
    },
    [address, chain, publicClient, writeContractAsync],
  );

  return {
    placeBet,
    isPending,
  };
};

/**
 * Hook to claim winnings
 */
export const useClaim = () => {
  const { writeContractAsync, isPending } = useScaffoldWriteContract("MarketController");
  return {
    claim: (poolId: number) => writeContractAsync({ functionName: "claim", args: [BigInt(poolId)] }),
    isPending,
  };
};

/**
 * Hook to claim creator rewards
 */
export const useClaimCreatorRewards = () => {
  const { writeContractAsync, isPending } = useScaffoldWriteContract("MarketController");
  return {
    claimCreatorRewards: (poolId: number) =>
      writeContractAsync({ functionName: "claimCreatorRewards", args: [BigInt(poolId)] }),
    isPending,
  };
};

/**
 * Hook to request resolution from UMA Oracle
 */
export const useRequestResolution = () => {
  const { writeContractAsync, isPending } = useScaffoldWriteContract("MarketController");
  return {
    requestResolution: (poolId: number) =>
      writeContractAsync({ functionName: "requestResolution", args: [BigInt(poolId)] }),
    isPending,
  };
};

/**
 * Hook to settle resolution from UMA Oracle
 */
export const useSettleResolution = () => {
  const { writeContractAsync, isPending } = useScaffoldWriteContract("MarketController");
  return {
    settleResolution: (poolId: number) =>
      writeContractAsync({ functionName: "settleResolution", args: [BigInt(poolId)] }),
    isPending,
  };
};

/**
 * Hook to get token balance
 */
export const useLinkBalance = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const tokenAddress = chainId ? getTokenAddress(chainId) : undefined;

  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!tokenAddress },
  });

  return {
    balance: data,
    balanceFormatted: data ? formatToken(data, chainId) : "0",
    isLoading,
    refetch,
    chainId,
    tokenAddress,
  };
};

/**
 * Hook to get Aave APY (dummy)
 * @returns 3.5% APY
 */
export const useAaveApy = () => {
  return {
    apy: 3.5,
    apyFormatted: "3.50",
    isLoading: false,
  };
};
