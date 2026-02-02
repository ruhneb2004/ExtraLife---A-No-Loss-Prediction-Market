"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link as LinkIcon, User } from "lucide-react";

// Added LinkIcon for network switch

export const ConnectWalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        // 1. Check if the component has mounted to prevent hydration errors
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              // 2. State: Not Connected
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="h-14  px-5 bg-[#a88ff0] rounded-2xl flex items-center justify-center gap-3 text-white hover:scale-105 hover:bg-[#9678e0] transition-all shadow-xl cursor-pointer"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    <User size={24} strokeWidth={2.5} />
                    <span className="text-sm font-medium whitespace-nowrap">Connect</span>
                  </button>
                );
              }

              // 3. State: Connected but Wrong Network
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="h-14 px-5 bg-red-500 rounded-2xl flex items-center justify-center gap-3 text-white hover:scale-105 hover:bg-red-600 transition-all shadow-xl cursor-pointer"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    <LinkIcon size={24} strokeWidth={2.5} />
                    <span className="text-sm font-medium whitespace-nowrap">Wrong Network</span>
                  </button>
                );
              }

              // 4. State: Connected & Correct Network
              return (
                <button
                  onClick={openAccountModal}
                  type="button"
                  className="h-14 px-5 bg-[#a88ff0] rounded-2xl flex items-center justify-center gap-3 text-white hover:scale-105 hover:bg-[#9678e0] transition-all shadow-xl cursor-pointer"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  <User size={24} strokeWidth={2.5} />
                  <span className="text-sm font-medium whitespace-nowrap">{account.displayName}</span>
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
