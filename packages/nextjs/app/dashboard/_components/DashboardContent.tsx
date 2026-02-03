"use client";

import { useState } from "react";
import { Copy, ExternalLink, Wallet } from "lucide-react";
import { useAccount, useBalance } from "wagmi";

export const DashboardContent = () => {
  const { address, isConnected, chain } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
    chainId: chain?.id,
  });
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  if (!isConnected) {
    return (
      <div
        className="bg-white rounded-[32px] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-400 text-xl">Please connect your wallet</p>
        <p className="text-gray-500 text-sm mt-2">Connect your wallet to view your dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Wallet Info Card */}
      <div
        className="bg-white rounded-[32px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        <h2 className="text-2xl font-medium text-black mb-6">Wallet Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-2">Address</p>
            <div className="flex items-center gap-3">
              <p className="text-black font-semibold text-lg">{truncatedAddress}</p>
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy address"
              >
                <Copy size={16} className={copied ? "text-purple-400" : "text-gray-500"} />
              </button>
              <a
                href={`https://etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="View on Etherscan"
              >
                <ExternalLink size={16} className="text-gray-500" />
              </a>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-2">Balance</p>
            <p className="text-black font-semibold text-lg">
              {balanceLoading
                ? "Loading..."
                : balance
                  ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
                  : "0 ETH"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="bg-white rounded-[32px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          <p className="text-gray-400 text-sm mb-2">Total Predictions</p>
          <h2 className="text-4xl font-semibold text-black">0</h2>
        </div>

        <div
          className="bg-white rounded-[32px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          <p className="text-gray-400 text-sm mb-2">Active Pools</p>
          <h2 className="text-4xl font-semibold text-black">0</h2>
        </div>

        <div
          className="bg-white rounded-[32px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          style={{ fontFamily: "'Clash Display', sans-serif" }}
        >
          <p className="text-gray-400 text-sm mb-2">Total Winnings</p>
          <h2 className="text-4xl font-semibold text-black">0 ETH</h2>
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="bg-white rounded-[32px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        style={{ fontFamily: "'Clash Display', sans-serif" }}
      >
        <h2 className="text-2xl font-medium text-black mb-6">Recent Activity</h2>
        <div className="text-center py-8">
          <p className="text-gray-400 text-lg">No recent activity</p>
          <p className="text-gray-500 text-sm mt-2">Your prediction activity will appear here</p>
        </div>
      </div>
    </div>
  );
};
