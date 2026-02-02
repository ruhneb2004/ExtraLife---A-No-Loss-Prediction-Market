import { ConnectWalletButton, GlobalStyles, Sidebar } from "../_components";
import { PoolsExplorer } from "./_components/PoolsExplorer";

/**
 * POOLS PAGE (Server Component)
 * Browse and search all prediction pools
 */
export default function PoolsPage() {
  return (
    <div className="flex min-h-screen w-full bg-white relative overflow-x-hidden font-sans selection:bg-[#a88ff0] selection:text-white">
      <GlobalStyles />

      <Sidebar />

      {/* Connect Wallet Button - Top Right */}
      <div className="fixed top-8 right-8 z-30">
        <ConnectWalletButton />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 ml-[150px] relative py-12 px-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-medium text-black mb-4" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Prediction Pools
          </h1>
          <p className="text-gray-500 text-lg" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Browse active pools and place your predictions
          </p>
        </div>

        {/* Pools Explorer with Search */}
        <PoolsExplorer />
      </main>
    </div>
  );
}
