"use client";

import { useCallback } from "react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "./scaffold-eth";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

// Get LINK token address from the deployed MarketController contract
const getLinkAddress = (chainId: number): `0x${string}` | undefined => {
  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  if (!contracts?.MarketController) return undefined;
  // We'll read it from the contract, but for now use hardcoded fallbacks
  const LINK_FALLBACK: Record<number, `0x${string}`> = {
    11155111: "0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5", // Sepolia LINK
  };
  return LINK_FALLBACK[chainId];
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
export const usePool = (poolId: number) => {
  const { data, isLoading, refetch, isFetched } = useScaffoldReadContract({
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
        totalPrincipalFormatted: formatUnits(data[4], 18),
        yesPrincipalFormatted: formatUnits(data[8], 18),
        noPrincipalFormatted: formatUnits(data[9], 18),
      }
    : null;

  return {
    pool,
    isLoading: isLoading || !isFetched,
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
        principalFormatted: formatUnits(data[0], 18),
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
        currentTotalYieldFormatted: formatUnits(data[0], 18),
        estimatedWinnerPrizeFormatted: formatUnits(data[1], 18),
        estimatedCreatorFeeFormatted: formatUnits(data[2], 18),
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
    async (question: string, durationSeconds: number, initialSeedLink: number) => {
      if (!address || !chain || !publicClient) throw new Error("Wallet not connected");

      const linkAddress = getLinkAddress(chain.id);
      const marketAddress = getMarketControllerAddress(chain.id);

      if (!linkAddress || !marketAddress) throw new Error("Unsupported chain");

      const contracts = deployedContracts[chain.id as keyof typeof deployedContracts];
      if (!contracts?.MarketController) throw new Error("Contract not found");

      const duration = BigInt(durationSeconds);
      const seedAmount = parseUnits(initialSeedLink.toString(), 18);

      // Check current allowance first
      const currentAllowance = await publicClient.readContract({
        address: linkAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, marketAddress],
      });
      console.log("Current allowance:", currentAllowance.toString());

      // Only approve if current allowance is less than needed
      if (currentAllowance < seedAmount) {
        // Step 1: Approve LINK spending
        console.log("Step 1: Approving LINK spending for amount:", seedAmount.toString());
        const approvalTxHash = await writeContractAsync({
          address: linkAddress,
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
          address: linkAddress,
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
        args: [question, duration, seedAmount],
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
    async (poolId: number, side: boolean, amountLink: number) => {
      if (!address || !chain || !publicClient) throw new Error("Wallet not connected");

      const linkAddress = getLinkAddress(chain.id);
      const marketAddress = getMarketControllerAddress(chain.id);

      if (!linkAddress || !marketAddress) throw new Error("Unsupported chain");

      const contracts = deployedContracts[chain.id as keyof typeof deployedContracts];
      if (!contracts?.MarketController) throw new Error("Contract not found");

      const amount = parseUnits(amountLink.toString(), 18);

      // Check current allowance first
      const currentAllowance = await publicClient.readContract({
        address: linkAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, marketAddress],
      });
      console.log("Current allowance:", currentAllowance.toString());

      // Only approve if current allowance is less than needed
      if (currentAllowance < amount) {
        // Step 1: Approve LINK spending
        console.log("Step 1: Approving LINK spending for amount:", amount.toString());
        const approvalTxHash = await writeContractAsync({
          address: linkAddress,
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
          address: linkAddress,
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
 * Hook to get LINK balance
 */
export const useLinkBalance = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const linkAddress = chainId ? getLinkAddress(chainId) : undefined;

  const { data, isLoading, refetch } = useReadContract({
    address: linkAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!linkAddress,
    },
  });

  return {
    balance: data,
    balanceFormatted: data ? formatUnits(data, 18) : "0",
    isLoading,
    refetch,
    chainId,
    linkAddress,
  };
};

/**
 * Hook to get contract owner address
 */
export const useContractOwner = () => {
  const { data, isLoading } = useScaffoldReadContract({
    contractName: "MarketController",
    functionName: "owner",
  });

  return {
    owner: data as `0x${string}` | undefined,
    isLoading,
  };
};

/**
 * Hook to resolve a pool (owner only)
 */
export const useResolvePool = () => {
  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "MarketController",
  });

  const resolvePool = useCallback(
    async (poolId: number, outcome: boolean) => {
      const tx = await writeContractAsync({
        functionName: "resolvePool",
        args: [BigInt(poolId), outcome],
      });
      return tx;
    },
    [writeContractAsync],
  );

  return {
    resolvePool,
    isPending,
  };
};

// Aave V3 Pool ABI (minimal for getReserveData)
const AAVE_POOL_ABI = [
  {
    inputs: [{ internalType: "address", name: "asset", type: "address" }],
    name: "getReserveData",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "configuration", type: "uint256" },
          { internalType: "uint128", name: "liquidityIndex", type: "uint128" },
          { internalType: "uint128", name: "currentLiquidityRate", type: "uint128" },
          { internalType: "uint128", name: "variableBorrowIndex", type: "uint128" },
          { internalType: "uint128", name: "currentVariableBorrowRate", type: "uint128" },
          { internalType: "uint128", name: "currentStableBorrowRate", type: "uint128" },
          { internalType: "uint40", name: "lastUpdateTimestamp", type: "uint40" },
          { internalType: "uint16", name: "id", type: "uint16" },
          { internalType: "address", name: "aTokenAddress", type: "address" },
          { internalType: "address", name: "stableDebtTokenAddress", type: "address" },
          { internalType: "address", name: "variableDebtTokenAddress", type: "address" },
          { internalType: "address", name: "interestRateStrategyAddress", type: "address" },
          { internalType: "uint128", name: "accruedToTreasury", type: "uint128" },
          { internalType: "uint128", name: "unbacked", type: "uint128" },
          { internalType: "uint128", name: "isolationModeTotalDebt", type: "uint128" },
        ],
        internalType: "struct DataTypes.ReserveData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Aave Pool addresses by chain
const AAVE_POOL_ADDRESS: Record<number, `0x${string}`> = {
  11155111: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", // Sepolia
};

// RAY = 10^27 (Aave uses 27 decimals for rates)
const RAY = BigInt(10 ** 27);

/**
 * Hook to fetch current Aave APY for LINK token
 */
export const useAaveApy = () => {
  const chainId = useChainId();
  const linkAddress = chainId ? getLinkAddress(chainId) : undefined;
  const poolAddress = chainId ? AAVE_POOL_ADDRESS[chainId] : undefined;

  const { data, isLoading, refetch } = useReadContract({
    address: poolAddress,
    abi: AAVE_POOL_ABI,
    functionName: "getReserveData",
    args: linkAddress ? [linkAddress] : undefined,
    query: {
      enabled: !!linkAddress && !!poolAddress,
      refetchInterval: 60000, // Refetch every minute
    },
  });

  // Convert liquidityRate (in RAY, 27 decimals) to APY percentage
  // Aave's liquidityRate is the interest rate per second, scaled by RAY
  // APY = ((1 + rate/SECONDS_PER_YEAR)^SECONDS_PER_YEAR - 1) * 100
  const SECONDS_PER_YEAR = 31536000; // 365 days
  const apy = data?.currentLiquidityRate
    ? (Math.pow(1 + Number(data.currentLiquidityRate) / Number(RAY) / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1) * 100
    : null;

  return {
    apy, // APY as percentage (e.g., 3.5 for 3.5%)
    apyFormatted: apy !== null ? apy.toFixed(2) : "—",
    isLoading,
    refetch,
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
