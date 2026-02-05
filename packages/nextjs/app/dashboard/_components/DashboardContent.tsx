"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Loader2, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { useLinkBalance, usePool, usePoolCount, useUserBet } from "~~/hooks/useMarketController";
import { formatTimeLeft } from "~~/utils/scaffold-eth/time";

// Component to check if pool was created by user and report back
const PoolCreatorChecker = ({
  poolId,
  userAddress,
  onIsCreator,
}: {
  poolId: number;
  userAddress: string;
  onIsCreator: (poolId: number, isCreator: boolean) => void;
}) => {
  const { pool, isLoading } = usePool(poolId);

  useEffect(() => {
    if (!isLoading && pool) {
      const isCreator = pool.creator.toLowerCase() === userAddress.toLowerCase();
      onIsCreator(poolId, isCreator);
    }
  }, [pool, isLoading, poolId, userAddress, onIsCreator]);

  return null; // This component doesn't render anything
};

// Component to show user's bet in a pool
const UserPoolCard = ({ poolId }: { poolId: number }) => {
  const router = useRouter();
  const { pool, isLoading: poolLoading } = usePool(poolId);
  const { userBet, isLoading: betLoading } = useUserBet(poolId);

  // Skip if still loading or user has no bet in this pool
  if (poolLoading || betLoading) return null;
  if (!pool || !userBet?.hasBet) return null;

  const handleClick = () => {
    router.push(`/pool/${poolId}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-black text-lg leading-tight flex-1 mr-4">{pool.question}</h4>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            pool.isLive
              ? "bg-green-100 text-green-700"
              : pool.resolved
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-200 text-gray-600"
          }`}
        >
          {pool.isLive ? "Live" : pool.resolved ? "Resolved" : "Closed"}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">
          Bet:{" "}
          <span className="font-semibold text-black">{parseFloat(userBet.principalFormatted).toFixed(4)} LINK</span>
        </span>
        <span className={`font-bold ${userBet.side ? "text-green-600" : "text-red-500"}`}>
          {userBet.side ? "YES" : "NO"}
        </span>
        {pool.resolved && (
          <span className={userBet.side === pool.outcome ? "text-green-600" : "text-red-500"}>
            {userBet.side === pool.outcome ? "🎉 Won" : "Lost"}
          </span>
        )}
        {userBet.claimed && <span className="text-gray-400">✓ Claimed</span>}
      </div>
      {pool.isLive && <p className="text-gray-400 text-xs mt-2">{formatTimeLeft(pool.timeLeftSeconds)}</p>}
    </div>
  );
};

export const DashboardContent = () => {
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const { balanceFormatted, isLoading: balanceLoading } = useLinkBalance();
  const { poolCount, isLoading: countLoading } = usePoolCount();

  const [copied, setCopied] = useState(false);
  const [createdPoolsMap, setCreatedPoolsMap] = useState<Record<number, boolean>>({});

  // Count pools created by user
  const userCreatedPoolCount = Object.values(createdPoolsMap).filter(Boolean).length;

  // Callback to track which pools user created
  const handleCreatorCheck = (poolId: number, isCreator: boolean) => {
    setCreatedPoolsMap(prev => {
      if (prev[poolId] === isCreator) return prev;
      return { ...prev, [poolId]: isCreator };
    });
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  const poolIds = Array.from({ length: poolCount }, (_, i) => i + 1);

  // Get block explorer URL based on chain
  const getExplorerUrl = () => {
    if (!chain) return `https://etherscan.io/address/${address}`;
    switch (chain.id) {
      case 84532:
        return `https://sepolia.basescan.org/address/${address}`;
      case 11155111:
        return `https://sepolia.etherscan.io/address/${address}`;
      default:
        return `https://etherscan.io/address/${address}`;
    }
  };

  if (!isConnected) {
    return (
      <div
        className="bg-white rounded-[32px] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-400 text-xl">Please connect your wallet</p>
        <p className="text-gray-500 text-sm mt-2">Connect your wallet to view your dashboard</p>
      </div>
    );
  }

  // Show loading state while fetching data
  if (countLoading || balanceLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#a88ff0]" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Wallet Info Card */}
      <div
        className="bg-white rounded-[32px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        <h2 className="text-2xl font-medium text-black mb-6">Wallet Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-2">Address</p>
            <div className="flex items-center gap-3">
              <p className="text-black font-semibold text-lg">{truncatedAddress}</p>
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy address"
              >
                <Copy size={16} className={copied ? "text-purple-400" : "text-gray-500"} />
              </button>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="View on Block Explorer"
              >
                <ExternalLink size={16} className="text-gray-500" />
              </a>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-2">LINK Balance</p>
            <p className="text-black font-semibold text-lg">
              {balanceLoading ? "Loading..." : `${parseFloat(balanceFormatted).toFixed(4)} LINK`}
            </p>
          </div>
        </div>
      </div>

      {/* Hidden checkers to count user-created pools */}
      {address &&
        poolIds.map(poolId => (
          <PoolCreatorChecker key={poolId} poolId={poolId} userAddress={address} onIsCreator={handleCreatorCheck} />
        ))}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="bg-white rounded-[32px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          <p className="text-gray-400 text-sm mb-2">Pools Created</p>
          <h2 className="text-4xl font-semibold text-black">{countLoading ? "..." : userCreatedPoolCount}</h2>
        </div>

        <div
          className="bg-white rounded-[32px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          <p className="text-gray-400 text-sm mb-2">Network</p>
          <h2 className="text-2xl font-semibold text-black">{chain?.name || "Unknown"}</h2>
        </div>
      </div>

      {/* Your Bets */}
      <div
        className="bg-white rounded-[32px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        <h2 className="text-2xl font-medium text-black mb-6">Your Bets</h2>
        {countLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-[#a88ff0]" size={32} />
          </div>
        ) : poolCount === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">No pools yet</p>
            <p className="text-gray-500 text-sm mt-2">Be the first to create a prediction pool!</p>
            <button
              onClick={() => router.push("/create")}
              className="mt-4 px-6 py-3 bg-[#a88ff0] text-white font-semibold rounded-xl hover:bg-[#9370db] transition-colors"
            >
              Create Pool
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {poolIds.map(poolId => (
              <UserPoolCard key={poolId} poolId={poolId} />
            ))}
            {/* Fallback message if no bets found */}
            <div className="text-center py-4 text-gray-400 text-sm">Click on a pool to view details or place a bet</div>
          </div>
        )}
      </div>
    </div>
  );
};
