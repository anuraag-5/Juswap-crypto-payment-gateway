"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useWallet, UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import {
  createAndExecuteJupyterSwap,
  getAndConfirmLatestTokenTransfer,
  getLatestSignatures,
} from "@/lib/action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const { publicKey, signTransaction } = useWallet();
  const pathname = usePathname();
  const latestSignatures = useRef<
    {
      latestSignature: string;
      mint: string;
      ata: string;
      amount: string;
      decimals: number;
    }[]
  >([]);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [finalSwaps, setFinalSwaps] = useState<
    { inputMint: string; rawAmount: string }[]
  >([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const initialFetchDone = useRef(false);
  let swaps = useRef<{ inputMint: string; rawAmount: string }[]>([]);

  const handleSwap = async () => {
    setIsLoading(true);
    await createAndExecuteJupyterSwap(
      finalSwaps,
      publicKey!.toString(),
      signTransaction!,
      pathname
    );

    setIsLoading(false);
    setIsSuccess(true);
  };

  const handleCancel = async () => {
    swaps.current = [];
    setIsOpen(false);
  };
  useEffect(() => {
    let retryDelay = 20000;
    const intervalId = setInterval(async () => {
      if (!publicKey) return;
      try {
        if (!initialFetchDone.current) {
          const fetchedLatestSignatures = await getLatestSignatures(publicKey);
          latestSignatures.current = fetchedLatestSignatures;
          console.log(fetchedLatestSignatures);
          console.log("i set signatures");
          initialFetchDone.current = true;
          return;
        }

        const fetchedLatestSignatures = await getLatestSignatures(publicKey);
        for (const fetchedLatestSignature of fetchedLatestSignatures) {
          let found: boolean = false;
          for (const latestSignature of latestSignatures.current) {
            if (
              fetchedLatestSignature.latestSignature ===
              latestSignature.latestSignature
            ) {
              found = true;
              break;
            }
          }
          if (!found) {
            /* This is a new signature */

            // Confirm if transaction is not related to USDC.
            if (fetchedLatestSignature.mint === outputMint) {
              return;
            }
            // Check if token is received or sent.
            const latestTokenTransfers = await getAndConfirmLatestTokenTransfer(
              fetchedLatestSignature.latestSignature,
              fetchedLatestSignature.mint,
              fetchedLatestSignature.ata
            );

            if (!latestTokenTransfers || latestTokenTransfers.length === 0) {
              // No tokens recieved.
              return;
            }
            if (latestTokenTransfers === null) {
              console.log("Error fetching transaction details");
              return;
            }

            // Confirmed Token Received
            // Just iterate over every valid latestTokenTransfers and call jupiter's swap api it's easy.
            for (const latestTokenTransfer of latestTokenTransfers) {
              swaps.current.push({
                inputMint: latestTokenTransfer.tokenMint,
                rawAmount: latestTokenTransfer.amount,
              });
            }
            setFinalSwaps(swaps.current);
            setIsOpen(true);
          }
        }
        latestSignatures.current = fetchedLatestSignatures;
        retryDelay = 20000;
      } catch (error) {
        console.error("RPC Error:", error);
        retryDelay *= 2;
        if (retryDelay > 120000) {
          retryDelay = 120000;
        }
      }
      console.log("i ran");
    }, retryDelay);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-brand-background justify-center items-center pt-1 md:p-4">
      <section className="w-full min-h-[95vh] max-w-[600px] bg-brand p-4 rounded-xl relative">
        {pathname == "/your-tokens" ? (
          <>
            <div className="flex justify-center">
              <UnifiedWalletButton
                buttonClassName="!bg-brand-secondary mb-2 rounded-xl"
                currentUserClassName="!bg-brand-background mb-2"
              />
            </div>
            <div className="h-[100px]">
              <Link
                href={`/send-token?publicKey=${publicKey}`}
                className="text-xl"
              >
                Send token?
              </Link>
            </div>
            <div className="mb-2 text-2xl">Your tokens</div>
            <div className="bg-brand-secondary rounded-xl px-3 pt-2 flex flex-col gap-2">
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
      <AlertDialog open={isOpen}>
        <AlertDialogContent className="bg-brand-secondary rounded-xl border-none flex flex-col items-center justify-center">
          <AlertDialogHeader>
            <AlertDialogTitle>Incoming tokens detected...</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="bg-brand-primary w-full flex flex-col items-center justify-center max-w-full">
            <div className="flex flex-col w-full max-w-full mb-2">
              <div className="font-bold mb-1">Token</div>
              <div className="p-4 bg-[#ffffff] rounded-full break-words max-w-full text-[10px]">
                {JSON.stringify(finalSwaps)}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            {!isSuccess ? (
              <>
                <AlertDialogCancel
                  className="bg-brand-background rounded-full max-w-32 text-[#000000] border-none"
                  onClick={handleCancel}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-brand rounded-full max-w-32 px-8"
                  onClick={() => {
                    handleSwap();
                  }}
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
                    "Swap"
                  )}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogCancel
                className="bg-brand-secondary rounded-full max-w-32 text-[#000000] border-none"
                onClick={() => setIsOpen(false)}
              >
                Success 👋
              </AlertDialogCancel>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RootLayout;
