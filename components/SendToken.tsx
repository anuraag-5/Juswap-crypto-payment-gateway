"use client";

import { transferToken } from "@/lib/action";
import { TokensData } from "@/lib/constants";
import { Token } from "@/lib/types";
import { useWallet } from "@jup-ag/wallet-adapter";
import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const SendToken = ({ tokens }: { tokens: Token[] }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<
    | { mint: string; symbol: string; image: string; decimals: number }
    | {
        ata: string;
        mint: string;
        amount: string;
        decimals: number;
      }
    | null
  >(null);
  const refAmount = useRef<HTMLInputElement | null>(null);
  const refAddress = useRef<HTMLInputElement | null>(null);
  const refDecimal = useRef<HTMLInputElement | null>(null);
  const { publicKey, signTransaction } = useWallet();

  const handleSend = async () => {
    if (!publicKey || !signTransaction) {
      console.error("Wallet not connected");
      return;
    }
    setIsLoading(true);
    const amount = refAmount.current?.value;
    const address = refAddress.current?.value;
    const decimal = refDecimal.current?.value;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      console.error("Invalid amount");
      return;
    }

    if (!address || address.length !== 44) {
      console.error("Invalid wallet address");
      return;
    }

    if (!decimal || isNaN(Number(decimal)) || Number(decimal) < 0) {
      console.error("Invalid decimal");
      return;
    }

    if (!selected) {
      console.error("No token selected");
      return;
    }

    try {
      await transferToken({
        sender: publicKey,
        recipientAddress: address,
        tokenMint: selected.mint,
        decimals: Number(decimal),
        amount: Number(amount),
        signTransaction,
        publicKey,
      });

      setIsLoading(false);
      router.push(`/your-tokens?publicKey=${publicKey}`);
    } catch (error) {
      console.error("Transaction failed:", error);
      router.push(`/your-tokens?publicKey=${publicKey}`);
    }
  };

  return tokens.length > 0 ? (
    <>
      <div className="h-[100px] relative">
        <div className="text-xl mb-2">Select Token</div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-brand-secondary text-white rounded-xl"
        >
          {selected && "symbol" in selected
            ? selected.symbol
            : "Select an Option"}
        </button>

        {isOpen && (
          <ul className="relative left-0 mt-2 bg-brand-secondary rounded-xl shadow-md p-2">
            {tokens.map((token) => {
              let found: {
                mint: string;
                symbol: string;
                image: string;
                decimals: number;
              }[] = [];
              for (let i = 0; i < TokensData.length; i++) {
                if (TokensData[i].mint === token.mint)
                  found.push({ ...TokensData[i], decimals: token.decimals });
              }

              if (found.length > 0)
                return (
                  <li
                    key={token.mint}
                    className="w-full p-3 bg-brand-background mb-2 rounded-xl flex justify-between h=[50px] items-center cursor-pointer"
                    onClick={() => {
                      setSelected(found[0]);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex gap-2 items-center">
                      <Image
                        src={found[0].image}
                        alt={found[0].symbol}
                        width={50}
                        height={50}
                      />
                      <div className="text-brand">{found[0].symbol}</div>
                    </div>
                    <div>{`$${token.amount}`}</div>
                  </li>
                );

              return (
                <li
                  key={token.mint}
                  className="w-full p-3 bg-brand-background mb-2 rounded-xl flex justify-between h=[50px] items-center cursor-pointer"
                  onClick={() => {
                    setSelected({ ...token, symbol: "Unknown" });
                    setIsOpen(false);
                  }}
                >
                  <div className="flex gap-2 items-center">
                    <Image
                      src="/unknown-coin.svg"
                      alt={"Unknown"}
                      width={50}
                      height={50}
                    />
                    <div className="text-brand">Unknown</div>
                  </div>
                  <div>{`$${token.amount}`}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <div className="bg-brand-secondary flex flex-col justify-between items-center p-3 rounded-xl gap-10">
          <div className="w-full">
            <div className="flex flex-col gap-2 mb-2">
              <div>Enter amount</div>
              <input
                className="w-full bg-brand-background py-5 px-2 rounded-xl"
                ref={refAmount}
              />
            </div>
            <div className="flex flex-col gap-2 mb-2">
              <div>Enter Wallet Address</div>
              <input
                className="w-full bg-brand-background py-5 px-2 rounded-xl"
                ref={refAddress}
              />
            </div>
            <div className="flex flex-col gap-2 mb-2">
              <div>Decimals</div>
              <input
                className="w-full bg-brand-background py-5 px-2 rounded-xl"
                ref={refDecimal}
                value={
                  (selected && "decimals" in selected && selected?.decimals) ||
                  0
                }
                readOnly
              />
            </div>
          </div>
          <div>
            <button
              className="py-4 px-8 bg-brand rounded-full text-[#ffffff] text-xl"
              onClick={handleSend}
            >
              {isLoading ? (
                <Image
                  src="/loader.svg"
                  alt="Swapping..."
                  className="animate-spin"
                  width={24}
                  height={24}
                />
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
        <div className="w-full text-center text-[#ffffff] mt-2">
          Detecting any recieved token...
        </div>
      </div>
    </>
  ) : (
    <div className="h-[100px] relative">
      <div className="text-xl mb-2">Select Token</div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-brand-secondary text-white rounded-xl"
      >
        Select an option
      </button>

      {isOpen && (
        <ul className="relative left-0 mt-2 bg-brand-secondary rounded-xl shadow-md">
          <li
            key={1}
            onClick={() => {
              setSelected(null);
              setIsOpen(false);
            }}
            className="px-4 py-2 cursor-pointer"
          >
            You have no Token
          </li>
        </ul>
      )}
    </div>
  );
};

export default SendToken;
