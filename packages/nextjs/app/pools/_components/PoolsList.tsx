"use client";

import { ArrowUpRight } from "lucide-react";

type Pool = {
  id: number;
  title: string;
  description: string;
  status: "live" | "closed" | "resolved";
  totalPool: string;
  participants: number;
  endsAt: string;
};

const MOCK_POOLS: Pool[] = [
  {
    id: 1,
    title: "Will 15 people bet on this event?",
    description: "Do you think ATLEAST 15 people will bet on this during this demo?",
    status: "live",
    totalPool: "2.5 ETH",
    participants: 12,
    endsAt: "2h 30m",
  },
  {
    id: 2,
    title: "Will Bitcoin hit $100k in 2024?",
    description: "Market analysis suggests a strong bullish trend. Place your predictions now.",
    status: "live",
    totalPool: "15.2 ETH",
    participants: 89,
    endsAt: "5d 12h",
  },
  {
    id: 3,
    title: "Who wins the Super Bowl?",
    description: "The odds are shifting. Lock in your choices before the playoffs begin.",
    status: "live",
    totalPool: "8.7 ETH",
    participants: 156,
    endsAt: "30d",
  },
  {
    id: 4,
    title: "ETH to flip BTC market cap?",
    description: "Will Ethereum surpass Bitcoin in total market capitalization by end of year?",
    status: "live",
    totalPool: "42.1 ETH",
    participants: 312,
    endsAt: "28d",
  },
  {
    id: 5,
    title: "Next US President prediction",
    description: "Who will win the upcoming presidential election?",
    status: "closed",
    totalPool: "125.8 ETH",
    participants: 2451,
    endsAt: "Ended",
  },
  {
    id: 6,
    title: "Will AI pass the Turing test?",
    description: "Can an AI convince a panel of judges it's human by 2025?",
    status: "live",
    totalPool: "5.3 ETH",
    participants: 67,
    endsAt: "180d",
  },
];

const getStatusStyles = (status: Pool["status"]) => {
  switch (status) {
    case "live":
      return { dot: "bg-[#86efac]", text: "Currently live!" };
    case "closed":
      return { dot: "bg-gray-400", text: "Voting closed" };
    case "resolved":
      return { dot: "bg-[#fca5a5]", text: "Resolved" };
  }
};

const PoolCard = ({ pool }: { pool: Pool }) => {
  const statusStyles = getStatusStyles(pool.status);

  return (
    <div
      className="
        group
        relative 
        bg-white 
        rounded-[32px] 
        p-8 
        flex flex-col justify-between
        shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
        hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]
        transition-all duration-300
        cursor-pointer
        min-h-[320px]
      "
      style={{ fontFamily: "'Clash Display', sans-serif" }}
    >
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${statusStyles.dot}`} />
          <span className="text-sm font-medium text-gray-600">{statusStyles.text}</span>
        </div>

        <h3 className="text-2xl font-medium leading-tight tracking-tight text-black mb-3">{pool.title}</h3>
        <p className="text-gray-500 text-base leading-relaxed font-normal">{pool.description}</p>
      </div>

      <div className="mt-6">
        {/* Pool Stats */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div>
            <span className="text-gray-400">Pool Size</span>
            <p className="text-black font-semibold text-lg">{pool.totalPool}</p>
          </div>
          <div>
            <span className="text-gray-400">Participants</span>
            <p className="text-black font-semibold text-lg">{pool.participants}</p>
          </div>
          <div>
            <span className="text-gray-400">Ends In</span>
            <p className="text-black font-semibold text-lg">{pool.endsAt}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#a88ff0]">
            {pool.status === "live" ? "Place Prediction" : "View Results"}
          </span>
          <div className="bg-[#a88ff0] p-3 rounded-2xl text-white transform transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110">
            <ArrowUpRight size={24} strokeWidth={3} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const PoolsList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {MOCK_POOLS.map(pool => (
        <PoolCard key={pool.id} pool={pool} />
      ))}
    </div>
  );
};
