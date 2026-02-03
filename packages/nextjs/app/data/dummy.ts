import { CardItem } from "../_components/Card";

/**
 * Pool Bet Data
 */
export type PoolBet = {
  id: string;
  username: string;
  amount: number;
  isHighest?: boolean;
};

/**
 * Pool Detail Data
 */
export type PoolData = {
  id: number;
  title: string;
  description: string;
  status: string;
  statusColor: string;
  statusDot: string;
  timeLeft: string;
  prizePool: number;
  prizePoolCurrency: string;
  minBetAmount: number;
  topBets: PoolBet[];
};

/**
 * Mock data for landing page cards
 */
export const LANDING_CARDS: CardItem[] = [
  {
    id: 1,
    title: "Will 15 people bet on this event?",
    description: "Do you think ATLEAST 15 people will bet on this during this demo?",
    status: "Currently live!",
    statusColor: "green",
    statusDot: "bg-[#86efac]",
  },
  {
    id: 2,
    title: "This could be another event title?",
    description: "You can set up multiple events for as long as there are sponsors for them!",
    status: "Prize pool paid out!",
    statusColor: "red",
    statusDot: "bg-[#fca5a5]",
  },
  {
    id: 3,
    title: "Will Bitcoin hit $100k in 2024?",
    description: "Market analysis suggests a strong bullish trend. Place your predictions now.",
    status: "Currently live!",
    statusColor: "green",
    statusDot: "bg-[#86efac]",
  },
  {
    id: 4,
    title: "Who wins the Super Bowl?",
    description: "The odds are shifting. Lock in your choices before the playoffs begin.",
    status: "Voting closed",
    statusColor: "gray",
    statusDot: "bg-gray-400",
  },
];

/**
 * Mock data for pool details
 */
export const POOLS_DATA: PoolData[] = [
  {
    id: 1,
    title: "Will 15 people bet on this event?",
    description: "Will ATLEAST 15 people bet on this event before the end of the event timer?",
    status: "Currently live!",
    statusColor: "green",
    statusDot: "bg-[#86efac]",
    timeLeft: "1d 12h 42s left",
    prizePool: 0.76845,
    prizePoolCurrency: "ETH",
    minBetAmount: 4.0,
    topBets: [
      { id: "1", username: "Highest Bettor in BOLD", amount: 30.0, isHighest: true },
      { id: "2", username: "Anonymous User", amount: 15.0 },
      { id: "3", username: "Anonymous User", amount: 15.0 },
      { id: "4", username: "Anonymous User", amount: 15.0 },
      { id: "5", username: "Anonymous User", amount: 15.0 },
      { id: "6", username: "Anonymous User", amount: 15.0 },
    ],
  },
  {
    id: 2,
    title: "This could be another event title?",
    description: "You can set up multiple events for as long as there are sponsors for them!",
    status: "Prize pool paid out!",
    statusColor: "red",
    statusDot: "bg-[#fca5a5]",
    timeLeft: "Ended",
    prizePool: 1.25,
    prizePoolCurrency: "ETH",
    minBetAmount: 5.0,
    topBets: [
      { id: "1", username: "Winner123", amount: 50.0, isHighest: true },
      { id: "2", username: "CryptoKing", amount: 25.0 },
      { id: "3", username: "Anonymous User", amount: 20.0 },
    ],
  },
  {
    id: 3,
    title: "Will Bitcoin hit $100k in 2024?",
    description: "Market analysis suggests a strong bullish trend. Place your predictions now.",
    status: "Currently live!",
    statusColor: "green",
    statusDot: "bg-[#86efac]",
    timeLeft: "5d 8h 15m left",
    prizePool: 2.5,
    prizePoolCurrency: "ETH",
    minBetAmount: 10.0,
    topBets: [
      { id: "1", username: "BTCMaxi", amount: 100.0, isHighest: true },
      { id: "2", username: "Satoshi_Fan", amount: 75.0 },
      { id: "3", username: "HODLer", amount: 50.0 },
      { id: "4", username: "Anonymous User", amount: 25.0 },
    ],
  },
  {
    id: 4,
    title: "Who wins the Super Bowl?",
    description: "The odds are shifting. Lock in your choices before the playoffs begin.",
    status: "Voting closed",
    statusColor: "gray",
    statusDot: "bg-gray-400",
    timeLeft: "Closed",
    prizePool: 0.5,
    prizePoolCurrency: "ETH",
    minBetAmount: 5.0,
    topBets: [
      { id: "1", username: "SportsGuru", amount: 40.0, isHighest: true },
      { id: "2", username: "Anonymous User", amount: 20.0 },
    ],
  },
];

/**
 * Helper function to get pool by ID
 */
export const getPoolById = (id: number): PoolData | undefined => {
  return POOLS_DATA.find(pool => pool.id === id);
};
