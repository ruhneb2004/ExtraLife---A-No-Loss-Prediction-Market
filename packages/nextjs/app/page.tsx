"use client";

import Link from "next/link";
import { GlobalStyles, useHowItWorks } from "./_components";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { X } from "lucide-react";
import { useAccount } from "wagmi";
import { InteractiveGridPattern } from "~~/components/ui/interactive-grid-pattern";
import { cn } from "~~/lib/utils";

/**
 * MAIN PAGE (Client Component)
 */
export default function Home() {
  const { isConnected } = useAccount();
  const { showModal, openModal, closeModal } = useHowItWorks();

  return (
    <div className="flex h-screen w-full bg-white relative overflow-hidden font-sans selection:bg-[#a88ff0] selection:text-white">
      <GlobalStyles />

      <div className="fixed inset-0 w-screen h-screen z-0 pointer-events-none">
        <InteractiveGridPattern
          className={cn("inset-x-0 inset-y-[-30%] h-[200%] skew-y-12")}
          width={100}
          height={100}
          squares={[80, 80]}
          squaresClassName="cursor-pointer stroke-black/10 pointer-events-auto"
        />
      </div>

      {/* Main Content Area - Full width, centered */}
      <main className="flex-1 relative flex flex-col justify-center items-center h-full w-full z-10 pointer-events-none">
        {/* Hero Text */}
        <div className="text-center mb-8 pointer-events-none">
          <h1
            className="text-[96px] font-semibold leading-tight mb-4"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            <span className="text-black">PREDICT THE </span>
            <span className="text-[#A684FF]">FUTURE.</span>
            <br />
            <span className="text-black">OWN THE </span>
            <span className="text-black underline">OUTCOME.</span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-12 pointer-events-none">
          <p
            className="text-[40px] font-normal text-black leading-relaxed"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            A first of its kind, lossless prediction
            <br />
            market, build for those who want to win.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 items-center pointer-events-auto">
          {/* Start Betting Button - Dynamic based on wallet connection */}
          {isConnected ? (
            <Link href="/pools">
              <div className="relative group">
                {/* Shadow layer */}
                <div className="absolute inset-0 bg-[#030712] rounded-[32px] translate-x-1 translate-y-1"></div>
                {/* Button */}
                <button
                  className="relative w-[269px] h-[73px] bg-[#A684FF] rounded-[32px] border border-black text-white text-[32px] font-semibold hover:bg-[#9370db] transition-colors"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  Start Betting
                </button>
              </div>
            </Link>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <div className="relative group">
                  {/* Shadow layer */}
                  <div className="absolute inset-0 bg-[#030712] rounded-[32px] translate-x-1 translate-y-1"></div>
                  {/* Button */}
                  <button
                    onClick={openConnectModal}
                    className="relative w-[269px] h-[73px] bg-[#A684FF] rounded-[32px] border border-black text-white text-[32px] font-semibold hover:bg-[#9370db] transition-colors"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    Connect
                  </button>
                </div>
              )}
            </ConnectButton.Custom>
          )}

          {/* Learn More Button */}
          <div className="relative group">
            {/* Shadow layer */}
            <div className="absolute inset-0 bg-[#030712] rounded-[32px] translate-x-1 translate-y-1"></div>
            {/* Button */}
            <button
              onClick={openModal}
              className="relative w-[269px] h-[73px] bg-white rounded-[32px] border border-black text-black text-[32px] font-semibold hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Learn more
            </button>
          </div>
        </div>
      </main>

      {/* How it Works Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-bold text-black mb-6">How ExtraLife Works</h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#a88ff0] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-black text-lg">Create a Pool</h3>
                  <p className="text-gray-600">
                    Anyone can create a prediction pool by depositing LINK and setting a betting period. Your deposit
                    earns yield from Aave while the pool is active.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#a88ff0] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-black text-lg">Place Your Bet</h3>
                  <p className="text-gray-600">
                    Choose YES or NO and deposit your stake. Early bettors earn more through time-weighted scoring - the
                    earlier you bet, the larger your share of winnings.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#a88ff0] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-black text-lg">Pool Resolved</h3>
                  <p className="text-gray-600">
                    After the betting period ends, the pool creator resolves the outcome. The yield generated is split:
                    60% to winners, 40% to the creator.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#a88ff0] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-black text-lg">Claim Your Rewards</h3>
                  <p className="text-gray-600">
                    <strong>Winners:</strong> Get your principal back + share of the prize pool (60% of yield).
                    <br />
                    <strong>Losers:</strong> Get your full principal back - no loss!
                  </p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="mt-8 p-4 bg-[#a88ff0]/10 rounded-xl border border-[#a88ff0]/30">
              <h3 className="font-bold text-black mb-2">Why ExtraLife?</h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>
                  ✅ <strong>No-Loss:</strong> You never lose your principal
                </li>
                <li>
                  ✅ <strong>Time-Weighted:</strong> Early believers earn more
                </li>
                <li>
                  ✅ <strong>Aave Powered:</strong> Yield generated from battle-tested DeFi
                </li>
                <li>
                  ✅ <strong>Creator Rewards:</strong> 40% yield goes to pool creators
                </li>
              </ul>
            </div>

            <button
              onClick={closeModal}
              className="mt-6 w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
