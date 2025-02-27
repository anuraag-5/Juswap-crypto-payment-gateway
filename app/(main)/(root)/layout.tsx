"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@jup-ag/wallet-adapter";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const { publicKey } = useWallet();
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-brand-background justify-center items-center md:p-4">
      <section className="w-full min-h-[95vh] max-w-[600px] bg-brand p-4 rounded-xl relative">
        {pathname == "/your-tokens" ? (
          <>
            <div className="h-[100px]">
              <Link
                href={`/send-token?publicKey=${publicKey}`}
                className="text-xl"
              >
                Send token?
              </Link>
            </div>
            <div className="mb-2 text-2xl">Your tokens</div>
            <div className="bg-brand-secondary rounded-xl px-3 py-4">
              {children}
            </div>
            <div className="w-full text-center text-[#ffffff] relative top-56">
              Detecting any recieved Token...
            </div>
          </>
        ) : (
          <div className="w-full h-[92vh] flex flex-col justify-between">
            {children}
          </div>
        )}
      </section>
    </div>
  );
};

export default RootLayout;
