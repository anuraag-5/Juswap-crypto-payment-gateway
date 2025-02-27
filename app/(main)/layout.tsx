"use client";

import React from "react";
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <UnifiedWalletProvider
        wallets={[]}
        config={{
          autoConnect: false,
          env: "mainnet-beta",
          metadata: {
            name: "UnifiedWallet",
            description: "UnifiedWallet",
            url: "https://jup.ag",
            iconUrls: ["https://jup.ag/favicon.ico"],
          },
          notificationCallback: undefined,
          walletlistExplanation: {
            href: "https://station.jup.ag/docs/old/additional-topics/wallet-list",
          },
        }}
      >
        {children}
      </UnifiedWalletProvider>
    </QueryClientProvider>
  );
};

export default MainLayout;
