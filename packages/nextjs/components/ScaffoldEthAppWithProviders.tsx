"use client";

import { useEffect, useState } from "react";
// --- LI.FI Imports ---
import { EVM, createConfig as createLifiConfig } from "@lifi/sdk";
// import { useSyncWagmiConfig } from "@lifi/wallet-management";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getWalletClient, switchChain } from "@wagmi/core";
// Added useQuery
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

// 1. Configure LI.FI SDK (Outside component)
createLifiConfig({
  integrator: "Your-dApp-Name", // TODO: Change this to your actual app name
  providers: [
    EVM({
      getWalletClient: () => getWalletClient(wagmiConfig),
      switchChain: async chainId => {
        const chain = await switchChain(wagmiConfig, { chainId: chainId as any });
        return getWalletClient(wagmiConfig, { chainId: chain.id as any });
      },
    }),
  ],
  preloadChains: false,
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className={`flex flex-col min-h-screen `}>
        <main className="relative flex flex-col flex-1">{children}</main>
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// 2. Don't sync LiFi chains - use only configured chains
const LiFiWagmiWrapper = ({ children }: { children: React.ReactNode }) => {
  // No need to fetch or sync chains - just use wagmiConfig as-is
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
};

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LiFiWagmiWrapper>
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
          showRecentTransactions={false}
        >
          <ProgressBar height="3px" color="#a88ff0" options={{ showSpinner: false }} />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </RainbowKitProvider>
      </LiFiWagmiWrapper>
    </QueryClientProvider>
  );
};
