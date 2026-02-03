"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Search } from "lucide-react";
import { PoolData, formatTimeLeft, usePool, usePoolCount } from "~~/hooks/useMarketController";

type PoolStatus = "live" | "closed" | "resolved";

const getPoolStatus = (pool: PoolData): PoolStatus => {
  if (pool.resolved) return "resolved";
  if (pool.isLive) return "live";
  return "closed";
};

const getStatusStyles = (status: PoolStatus) => {
  switch (status) {
    case "live":
      return { dot: "bg-[#86efac]", text: "Currently live!" };
    case "closed":
      return { dot: "bg-gray-400", text: "Voting closed" };
    case "resolved":
      return { dot: "bg-[#fca5a5]", text: "Resolved" };
  }
};

export const PoolsExplorer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { poolCount, isLoading: countLoading } = usePoolCount();

  // Generate pool IDs (1 to poolCount)
  const poolIds = Array.from({ length: poolCount }, (_, i) => i + 1);

  if (countLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#a88ff0]" size={48} />
      </div>
    );
  }

  if (poolCount === 0) {
    return (
      <div
        className="bg-white rounded-[32px] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        <p className="text-gray-400 text-xl">No pools found</p>
        <p className="text-gray-500 text-sm mt-2">Be the first to create a prediction pool!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search pools..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-none outline-none text-black placeholder-gray-400 focus:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {["all", "live", "closed"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`h-14 px-6 rounded-2xl font-medium capitalize transition-all ${
                statusFilter === status
                  ? "bg-[#a88ff0] text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-gray-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
              }`}
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              {status === "all" ? "All Pools" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {poolIds.map(poolId => (
          <PoolCardWithFilter key={poolId} poolId={poolId} searchQuery={searchQuery} statusFilter={statusFilter} />
        ))}
      </div>
    </div>
  );
};

// Wrapper component that handles filtering
const PoolCardWithFilter = ({
  poolId,
  searchQuery,
  statusFilter,
}: {
  poolId: number;
  searchQuery: string;
  statusFilter: string;
}) => {
  const { pool, isLoading } = usePool(poolId);
  const router = useRouter();

  // Don't render if still loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-[32px] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[320px] flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!pool) return null;

  // Apply filters
  const status = getPoolStatus(pool);
  const matchesSearch = pool.question.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesStatus =
    statusFilter === "all" ||
    (statusFilter === "live" && status === "live") ||
    (statusFilter === "closed" && (status === "closed" || status === "resolved"));

  if (!matchesSearch || !matchesStatus) return null;

  const statusStyles = getStatusStyles(status);

  const handleClick = () => {
    router.push(`/pool/${pool.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white rounded-[32px] p-8 flex flex-col justify-between shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer min-h-[320px]"
      style={{ fontFamily: "'Clash Display', sans-serif" }}
    >
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${statusStyles.dot}`} />
          <span className="text-sm font-medium text-gray-600">{statusStyles.text}</span>
        </div>

        <h3 className="text-2xl font-medium leading-tight tracking-tight text-black mb-3">{pool.question}</h3>
        <p className="text-gray-500 text-base leading-relaxed font-normal">
          Yes: {parseFloat(pool.yesPrincipalFormatted).toFixed(2)} USDC | No:{" "}
          {parseFloat(pool.noPrincipalFormatted).toFixed(2)} USDC
        </p>
      </div>

      <div className="mt-6">
        {/* Pool Stats */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div>
            <span className="text-gray-400">Pool Size</span>
            <p className="text-black font-semibold text-lg">
              {parseFloat(pool.totalPrincipalFormatted).toFixed(2)} USDC
            </p>
          </div>
          <div>
            <span className="text-gray-400">Time Left</span>
            <p className="text-black font-semibold text-lg">
              {pool.isLive ? formatTimeLeft(pool.timeLeftSeconds) : "Ended"}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#a88ff0]">
            {status === "live" ? "Place Prediction" : "View Results"}
          </span>
          <div className="bg-[#a88ff0] p-3 rounded-2xl text-white transform transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110">
            <ArrowUpRight size={24} strokeWidth={3} />
          </div>
        </div>
      </div>
    </div>
  );
};
