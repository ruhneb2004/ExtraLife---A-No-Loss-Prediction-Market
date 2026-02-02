import { BackgroundDecorations, CardItem, ConnectWalletButton, GlobalStyles, Marquee, Sidebar } from "./_components";

/**
 * MOCK DATA
 */
const MOCK_DATA: CardItem[] = [
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
 * MAIN PAGE (Server Component)
 */
export default function Home() {
  return (
    <div className="flex h-screen w-full bg-white relative overflow-hidden font-sans selection:bg-[#a88ff0] selection:text-white">
      <GlobalStyles />

      <Sidebar />

      {/* Connect Wallet Button - Top Right */}
      <div className="fixed top-8 right-8 z-30">
        <ConnectWalletButton />
      </div>

      {/* Main Content Area - ML matches sidebar width */}
      <main className="flex-1 ml-[150px] relative flex flex-col justify-center h-full">
        {/* Cards Layer */}
        <div className="z-10 w-full">
          <Marquee items={MOCK_DATA} />
        </div>
      </main>

      {/* Background Layer - Fixed positioning centers it relative to screen */}
      <div className="z-10">
        <BackgroundDecorations />
      </div>
    </div>
  );
}
