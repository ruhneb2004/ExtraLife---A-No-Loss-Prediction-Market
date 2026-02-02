"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowRight, Link as LinkIcon, User } from "lucide-react";
import { useAccount } from "wagmi";

export const ConnectWalletButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const { isConnected } = useAccount();
  const [isReady, setIsReady] = useState(false);
  const wasConnectedRef = useRef(false);

  // Wait for wagmi to rehydrate before enabling redirect logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      wasConnectedRef.current = isConnected;
    }, 1000); // Give wagmi 1 second to restore connection state
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track connection state after initial load
  useEffect(() => {
    if (isReady) {
      wasConnectedRef.current = isConnected;
    }
  }, [isConnected, isReady]);

  // Redirect to landing page only if user explicitly disconnects (not on refresh)
  useEffect(() => {
    if (isReady && wasConnectedRef.current && !isConnected && !isLandingPage) {
      router.push("/");
    }
  }, [isConnected, isLandingPage, router, isReady]);

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
                    className="h-14 px-5 bg-[#a88ff0] rounded-2xl flex items-center justify-center gap-3 text-white hover:scale-105 hover:bg-[#9678e0] transition-all shadow-xl cursor-pointer"
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
              // On landing page: show "Launch App" button
              // On other pages: show ENS/address and open account modal
              if (isLandingPage) {
                return (
                  <button
                    onClick={() => router.push("/pools")}
                    type="button"
                    className="h-14 px-5 bg-[#a88ff0] rounded-2xl flex items-center justify-center gap-3 text-white hover:scale-105 hover:bg-[#9678e0] transition-all shadow-xl cursor-pointer"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    <ArrowRight size={24} strokeWidth={2.5} />
                    <span className="text-sm font-medium whitespace-nowrap">Launch App</span>
                  </button>
                );
              }

              // On other pages: show wallet address/ENS
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
