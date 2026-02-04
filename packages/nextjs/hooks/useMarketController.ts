"use client";

import { useCallback } from "react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "./scaffold-eth";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

// Get USDC address from the deployed MarketController contract
const getUsdcAddress = (chainId: number): `0x${string}` | undefined => {
  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  if (!contracts?.MarketController) return undefined;
  // We'll read it from the contract, but for now use hardcoded fallbacks
  const USDC_FALLBACK: Record<number, `0x${string}`> = {
    84532: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f", // Base Sepolia
    11155111: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // Sepolia
  };
  return USDC_FALLBACK[chainId];
};

// Get MarketController address from deployedContracts (auto-updated on deploy)
const getMarketControllerAddress = (chainId: number): `0x${string}` | undefined => {
  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  return contracts?.MarketController?.address as `0x${string}` | undefined;
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
  yesPrincipal: bigint;
  noPrincipal: bigint;
  totalYesWeight: bigint;
  totalNoWeight: bigint;
  finalTotalYield: bigint;
  // Computed fields
  isLive: boolean;
  timeLeftSeconds: number;
  totalPrincipalFormatted: string;
  yesPrincipalFormatted: string;
  noPrincipalFormatted: string;
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
  const { data, isLoading, refetch } = useScaffoldReadContract({
    contractName: "MarketController",
    functionName: "poolCount",
  });

  return {
    poolCount: data ? Number(data) : 0,
    isLoading,
    refetch,
  };
};

/**
 * Hook to get a single pool's data
 */
export const usePool = (poolId: number) => {
  const { data, isLoading, refetch } = useScaffoldReadContract({
    contractName: "MarketController",
    functionName: "pools",
    args: [BigInt(poolId)],
  });

  const pool: PoolData | null = data
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
        yesPrincipal: data[8],
        noPrincipal: data[9],
        totalYesWeight: data[10],
        totalNoWeight: data[11],
        finalTotalYield: data[12],
        // Computed
        isLive: !data[6] && BigInt(Math.floor(Date.now() / 1000)) < data[2],
        timeLeftSeconds: Math.max(0, Number(data[2]) - Math.floor(Date.now() / 1000)),
        totalPrincipalFormatted: formatUnits(data[4], 6),
        yesPrincipalFormatted: formatUnits(data[8], 6),
        noPrincipalFormatted: formatUnits(data[9], 6),
      }
    : null;

  return {
    pool,
    isLoading,
    refetch,
  };
};

/**
 * Hook to get all pools
 */
export const useAllPools = () => {
  const { poolCount, isLoading: countLoading } = usePoolCount();

  // We need to fetch each pool individually
  // This is a simplified approach - in production you'd use multicall
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
export const useUserBet = (poolId: number) => {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useScaffoldReadContract({
    contractName: "MarketController",
    functionName: "bets",
    args: [BigInt(poolId), address],
  });

  const userBet: UserBetData | null = data
    ? {
        principal: data[0],
        weight: data[1],
        side: data[2],
        claimed: data[3],
        principalFormatted: formatUnits(data[0], 6),
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
export const usePoolMetrics = (poolId: number) => {
  const { data, isLoading, refetch } = useScaffoldReadContract({
    contractName: "MarketController",
    functionName: "getPoolMetrics",
    args: [BigInt(poolId)],
  });

  const metrics: PoolMetrics | null = data
    ? {
        currentTotalYield: data[0],
        estimatedWinnerPrize: data[1],
        estimatedCreatorFee: data[2],
        currentTotalYieldFormatted: formatUnits(data[0], 6),
        estimatedWinnerPrizeFormatted: formatUnits(data[1], 6),
        estimatedCreatorFeeFormatted: formatUnits(data[2], 6),
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

  // Use writeContract for full control over both transactions
  const { writeContractAsync, isPending } = useWriteContract();

  const createPool = useCallback(
    async (question: string, durationDays: number, initialSeedUsdc: number) => {
      if (!address || !chain || !publicClient) throw new Error("Wallet not connected");

      const usdcAddress = getUsdcAddress(chain.id);
      const marketAddress = getMarketControllerAddress(chain.id);

      if (!usdcAddress || !marketAddress) throw new Error("Unsupported chain");

      const contracts = deployedContracts[chain.id as keyof typeof deployedContracts];
      if (!contracts?.MarketController) throw new Error("Contract not found");

      const durationSeconds = BigInt(durationDays * 24 * 60 * 60);
      const seedAmount = parseUnits(initialSeedUsdc.toString(), 6);

      // Check current allowance first
      const currentAllowance = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, marketAddress],
      });
      console.log("Current allowance:", currentAllowance.toString());

      // Only approve if current allowance is less than needed
      if (currentAllowance < seedAmount) {
        // Step 1: Approve USDC spending
        console.log("Step 1: Approving USDC spending for amount:", seedAmount.toString());
        const approvalTxHash = await writeContractAsync({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [marketAddress, seedAmount],
        });

        // Wait for approval transaction to be fully confirmed
        console.log("Waiting for approval confirmation...", approvalTxHash);
        const approvalReceipt = await publicClient.waitForTransactionReceipt({
          hash: approvalTxHash,
          confirmations: 1,
        });
        console.log("Approval confirmed:", approvalReceipt.status);

        if (approvalReceipt.status !== "success") {
          throw new Error("Approval transaction failed");
        }

        // Verify the allowance was actually set
        const newAllowance = await publicClient.readContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, marketAddress],
        });
        console.log("New allowance after approval:", newAllowance.toString());

        if (newAllowance < seedAmount) {
          throw new Error("Allowance not set correctly. Please try again.");
        }
      } else {
        console.log("Sufficient allowance already exists, skipping approval");
      }

      // Step 2: Create pool (only after approval is confirmed)
      console.log("Step 2: Creating pool...");
      const createTxHash = await writeContractAsync({
        address: marketAddress,
        abi: contracts.MarketController.abi,
        functionName: "createPool",
        args: [question, durationSeconds, seedAmount],
      });

      // Wait for create pool transaction to be confirmed
      console.log("Waiting for createPool confirmation...", createTxHash);
      const createReceipt = await publicClient.waitForTransactionReceipt({
        hash: createTxHash,
        confirmations: 1,
      });
      console.log("Pool created:", createReceipt.status);

      if (createReceipt.status !== "success") {
        throw new Error("Create pool transaction failed");
      }

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

  // Use writeContract for both approval and bet (more control)
  const { writeContractAsync, isPending } = useWriteContract();

  const placeBet = useCallback(
    async (poolId: number, side: boolean, amountUsdc: number) => {
      if (!address || !chain || !publicClient) throw new Error("Wallet not connected");

      const usdcAddress = getUsdcAddress(chain.id);
      const marketAddress = getMarketControllerAddress(chain.id);

      if (!usdcAddress || !marketAddress) throw new Error("Unsupported chain");

      const contracts = deployedContracts[chain.id as keyof typeof deployedContracts];
      if (!contracts?.MarketController) throw new Error("Contract not found");

      const amount = parseUnits(amountUsdc.toString(), 6);

      // Check current allowance first
      const currentAllowance = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, marketAddress],
      });
      console.log("Current allowance:", currentAllowance.toString());

      // Only approve if current allowance is less than needed
      if (currentAllowance < amount) {
        // Step 1: Approve USDC spending
        console.log("Step 1: Approving USDC spending for amount:", amount.toString());
        const approvalTxHash = await writeContractAsync({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [marketAddress, amount],
        });

        // Wait for approval transaction to be fully confirmed
        console.log("Waiting for approval confirmation...", approvalTxHash);
        const approvalReceipt = await publicClient.waitForTransactionReceipt({
          hash: approvalTxHash,
          confirmations: 1,
        });
        console.log("Approval confirmed:", approvalReceipt.status);

        if (approvalReceipt.status !== "success") {
          throw new Error("Approval transaction failed");
        }

        // Verify the allowance was actually set
        const newAllowance = await publicClient.readContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, marketAddress],
        });
        console.log("New allowance after approval:", newAllowance.toString());

        if (newAllowance < amount) {
          throw new Error("Allowance not set correctly. Please try again.");
        }
      } else {
        console.log("Sufficient allowance already exists, skipping approval");
      }

      // Step 2: Place bet (only after approval is confirmed)
      console.log("Step 2: Placing bet...");
      const betTxHash = await writeContractAsync({
        address: marketAddress,
        abi: contracts.MarketController.abi,
        functionName: "placeBet",
        args: [BigInt(poolId), side, amount],
      });

      // Wait for bet transaction to be confirmed
      console.log("Waiting for placeBet confirmation...", betTxHash);
      const betReceipt = await publicClient.waitForTransactionReceipt({
        hash: betTxHash,
        confirmations: 1,
      });
      console.log("Bet placed:", betReceipt.status);

      if (betReceipt.status !== "success") {
        throw new Error("Place bet transaction failed");
      }

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
  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "MarketController",
  });

  const claim = useCallback(
    async (poolId: number) => {
      const tx = await writeContractAsync({
        functionName: "claim",
        args: [BigInt(poolId)],
      });
      return tx;
    },
    [writeContractAsync],
  );

  return {
    claim,
    isPending,
  };
};

/**
 * Hook to claim creator rewards
 */
export const useClaimCreatorRewards = () => {
  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "MarketController",
  });

  const claimCreatorRewards = useCallback(
    async (poolId: number) => {
      const tx = await writeContractAsync({
        functionName: "claimCreatorRewards",
        args: [BigInt(poolId)],
      });
      return tx;
    },
    [writeContractAsync],
  );

  return {
    claimCreatorRewards,
    isPending,
  };
};

/**
 * Hook to get USDC balance
 */
export const useUsdcBalance = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const usdcAddress = chainId ? getUsdcAddress(chainId) : undefined;

  const { data, isLoading, refetch } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdcAddress,
    },
  });

  return {
    balance: data,
    balanceFormatted: data ? formatUnits(data, 6) : "0",
    isLoading,
    refetch,
    chainId,
    usdcAddress,
  };
};

/**
 * Format time remaining
 */
export const formatTimeLeft = (seconds: number): string => {
  if (seconds <= 0) return "Ended";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};
