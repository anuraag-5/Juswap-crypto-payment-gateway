"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-brand-background justify-center items-center md:p-4">
      <section className="w-full min-h-[95vh] max-w-[600px] bg-brand p-4 rounded-xl">
        {pathname == "/your-tokens" ? (
          <>
            <div className="h-[100px]">
              <Link href="/send-token">Send token?</Link>
            </div>
            <div className="mb-2 text-2xl">Your tokens</div>
            <div className="bg-brand-secondary rounded-xl px-3 py-4">{children}</div>
          </>
        ) : (
          <>
            <div className="h-[100px]">Select Token</div>
            <div className="bg-brand-secondary rounded-xl">{children}</div>
          </>
        )}
      </section>
    </div>
  );
};

export default RootLayout;
