"use client";

import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";

const ExampleBaseOnly = () => {
  return (
    <div>
      <div className="mb-[11px] text-3xl">Connect Wallet</div>
      <UnifiedWalletButton
        buttonClassName="!bg-brand-background"
        overrideContent={
          <button className="bg-brand-secondary lg:w-[450px] text-[#FF6200] rounded-full p-4">
            Connect
          </button>
        }
      />
    </div>
  );
};

export default ExampleBaseOnly;
