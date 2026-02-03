"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowRight, Copy, LayoutDashboard, Link as LinkIcon, LogOut, User } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";

export const ConnectWalletButton = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isReady, setIsReady] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wasConnectedRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Wait for wagmi to rehydrate before enabling redirect logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      wasConnectedRef.current = isConnected;
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track connection state after initial load - only update when connected
  useEffect(() => {
    if (isReady && isConnected) {
      wasConnectedRef.current = true;
    }
  }, [isConnected, isReady]);

  // Redirect to landing page when user disconnects
  useEffect(() => {
    if (isReady && wasConnectedRef.current && !isConnected && !isLandingPage) {
      wasConnectedRef.current = false; // Reset after redirect
      router.push("/");
    }
  }, [isConnected, isLandingPage, router, isReady]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    setIsDropdownOpen(false);
    disconnect();
  };

  const handleDashboard = () => {
    setIsDropdownOpen(false);
    router.push("/dashboard");
  };

  return (
    <ConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            ref={dropdownRef}
            className="relative"
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

              // Connected state with custom dropdown
              return (
                <>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    type="button"
                    className="h-14 px-5 bg-[#a88ff0] rounded-2xl flex items-center justify-center gap-3 text-white hover:scale-105 hover:bg-[#9678e0] transition-all shadow-xl cursor-pointer"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                  >
                    <User size={24} strokeWidth={2.5} />
                    <span className="text-sm font-medium whitespace-nowrap">{account.displayName}</span>
                  </button>

                  {/* Custom Dropdown Menu */}
                  {isDropdownOpen && (
                    <div
                      className="absolute top-16 right-0 w-56 bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50"
                      style={{ fontFamily: "'Clash Display', sans-serif" }}
                    >
                      <button
                        onClick={copyAddress}
                        className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Copy size={18} />
                        <span className="text-sm font-medium">{copied ? "Copied!" : "Copy Address"}</span>
                      </button>
                      <button
                        onClick={handleDashboard}
                        className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LayoutDashboard size={18} />
                        <span className="text-sm font-medium">Dashboard</span>
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Disconnect</span>
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
