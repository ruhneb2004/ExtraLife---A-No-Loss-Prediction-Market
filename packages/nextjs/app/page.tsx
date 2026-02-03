import { BackgroundDecorations, ConnectWalletButton, GlobalStyles, Marquee, Sidebar } from "./_components";
import { LANDING_CARDS } from "./data/dummy";

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
          <Marquee items={LANDING_CARDS} />
        </div>
      </main>

      {/* Background Layer - Fixed positioning centers it relative to screen */}
      <div className="z-10">
        <BackgroundDecorations />
      </div>
    </div>
  );
}
