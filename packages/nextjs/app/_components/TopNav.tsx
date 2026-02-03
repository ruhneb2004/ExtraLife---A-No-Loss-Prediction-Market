"use client";

import { useState } from "react";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { X } from "lucide-react";

/**
 * TOP NAVIGATION COMPONENT
 * Shows "How it Works" link and profile button
 */
export const TopNav = () => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-8 right-8 z-30 flex items-center gap-6">
        <button
          onClick={() => setShowHowItWorks(true)}
          className="text-gray-600 hover:text-black font-medium transition-colors"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          How it Works
        </button>
        <ConnectWalletButton />
      </div>

      {/* How it Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowHowItWorks(false)}
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
                    Anyone can create a prediction pool by depositing USDC and setting a betting period. Your deposit
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
              onClick={() => setShowHowItWorks(false)}
              className="mt-6 w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
