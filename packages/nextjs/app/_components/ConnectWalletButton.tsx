"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { User } from "lucide-react";

/**
 * CONNECT WALLET BUTTON
 * Rectangle shaped button with profile icon and address/ENS.
 */
export const ConnectWalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <button
            onClick={connected ? openAccountModal : openConnectModal}
            className="h-14 px-5 bg-[#a88ff0] rounded-2xl flex items-center justify-center gap-3 text-white hover:scale-105 hover:bg-[#9678e0] transition-all shadow-xl cursor-pointer"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            <User size={24} strokeWidth={2.5} />
            <span className="text-sm font-medium whitespace-nowrap">{connected ? account.displayName : "Connect"}</span>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};
