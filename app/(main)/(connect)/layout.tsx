import React from "react";
import Image from "next/image";

const ConnectLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-brand-background">
      <section className="hidden lg:flex bg-brand w-1/2 xl:w-2/5 p-10 items-center">
        <div className="w-full h-full flex flex-col justify-center max-h-[800px] xl-custom:items-center">
          <div className=" flex w-full mb-7 xl-custom:justify-center">
            <Image
              src="/brand-full-logo2.svg"
              alt="Brand-Logo"
              width={319}
              height={105}
            />
          </div>
          <div className="flex-1 min-h-[500px] flex flex-col justify-around items-center max-w-[450px]">
            <div className="text-[#ffffff] text-4xl w-full flex flex-col items-start">
              Automatically detects &<div> converts any token to USDC</div>
            </div>
            <div>
              <Image
                src="/down-arrow.svg"
                alt="Arrow"
                width={100}
                height={100}
              />
            </div>
            <div>
              <Image src="/usd-coin.svg" alt="USDC" width={120} height={120} />
            </div>
          </div>
        </div>
      </section>
      <section className="flex-1 flex flex-col justify-around items-center p-6 lg:p-8">
        <div className="lg:hidden">
          <Image src="/brand-full-logo.svg" alt="Brand" width={250} height={210} />
        </div>
        {children}
      </section>
    </div>
  );
};

export default ConnectLayout;
