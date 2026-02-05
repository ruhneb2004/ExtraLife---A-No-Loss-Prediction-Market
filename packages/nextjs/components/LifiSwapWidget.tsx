"use client";

import { useState } from "react";
import { LiFiWidget, WidgetConfig } from "@lifi/widget";
import { XMarkIcon } from "@heroicons/react/24/outline";

// or use a simple "X" text if you don't have heroicons

const widgetConfig: WidgetConfig = {
  integrator: "Your-dApp-Name", // Remember to change this!
  variant: "compact",
  appearance: "dark",
  containerStyle: {
    border: "1px solid rgb(234, 234, 234)",
    borderRadius: "16px",
  },
};

export const SwapWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 1. The Button to Open the Widget */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#a88ff0] text-white px-6 py-3 rounded-2xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        Bridge / Swap
      </button>

      {/* 2. The Modal Overlay (Only shows when isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* The Widget Container */}
          <div className="relative z-10 animation-fade-in-up">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 md:-right-12 p-2 text-white hover:text-gray-300 transition-colors"
            >
              {/* If you don't have heroicons installed, just put "X" here */}
              <XMarkIcon className="w-8 h-8" />
            </button>

            {/* The Actual LI.FI Widget */}
            <LiFiWidget config={widgetConfig} integrator="Your-dApp-Name" />
          </div>
        </div>
      )}
    </>
  );
};
