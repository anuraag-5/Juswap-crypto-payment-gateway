"use client"

import React from "react";
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
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
  );
};

export default MainLayout;
