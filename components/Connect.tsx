"use client";

import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";

const Connect = () => {
  return (
    <div>
      <div className="mb-[11px] text-xl lg:text-3xl">Connect Wallet</div>
      <UnifiedWalletButton
        buttonClassName="!bg-brand-background"
        overrideContent={
          <button className="bg-brand-secondary w-[80vw] lg:w-[450px] text-[#FF6200] rounded-full p-4">
            Connect
          </button>
        }
      />
    </div>
  );
};

export default Connect;
