"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@jup-ag/wallet-adapter";
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const { publicKey, signTransaction } = useWallet();
  const pathname = usePathname();
  const [latestSignatures, setLatestSignatures] = useState<
    {
      latestSignature: string;
      mint: any;
      ata: string;
      amount: any;
    }[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const initialFetchDone = useRef(false);

  let swaps: { inputMint: string; rawAmount: string }[] = [];
  const handleSwap = async () => {
    const isSwapped = await createAndExecuteJupyterSwap(
      swaps,
      publicKey!.toString(),
      signTransaction!,
      pathname
    );

    if (isSwapped) {
      console.log("Swapped");
    }
  };

  useEffect(() => {
    let retryDelay = 30000;
    const intervalId = setInterval(async () => {
      if (!publicKey) return;
      try {
        if (!initialFetchDone.current) {
          const fetchedLatestSignatures = await getLatestSignatures(publicKey);
          setLatestSignatures(fetchedLatestSignatures);
          console.log(fetchedLatestSignatures);
          console.log("i set signatures");
          initialFetchDone.current = true; // Set the flag to true
          return;
        }

        const fetchedLatestSignatures = await getLatestSignatures(publicKey);
        for (const fetchedLatestSignature of fetchedLatestSignatures) {
          let found: boolean = false;
          for (const latestSignature of latestSignatures) {
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
              // Just update the latest signature
              for (let i = 0; i < latestSignatures.length; i++) {
                if (latestSignatures[i].mint === fetchedLatestSignature.mint) {
                  latestSignatures[i].latestSignature =
                    fetchedLatestSignature.latestSignature;

                  break;
                }
              }

              return;
            }
            if (latestTokenTransfers === null) {
              console.log("Erro fetching transaction details");
              return;
            }

            // Confirm Token Received
            // Just iterate over every valid latestTokenTransfers and call jupiter's swap api it's easy.
            for (const latestTokenTransfer of latestTokenTransfers) {
              swaps.push({
                inputMint: latestTokenTransfer.tokenMint,
                rawAmount: latestTokenTransfer.amount,
              });
            }
            setIsOpen(true);
            // Update the latest signature
            for (let i = 0; i < latestSignatures.length; i++) {
              if (latestSignatures[i].mint === fetchedLatestSignature.mint) {
                latestSignatures[i].latestSignature =
                  fetchedLatestSignature.latestSignature;

                break;
              }
            }

            console.log("Done securely, Click Swap...");
            // Make a swap api function and call it.
          }
        }
        retryDelay = 30000;
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
      <AlertDialog open={isOpen}>
        <AlertDialogContent className="bg-brand-secondary rounded-xl border-none flex flex-col items-center justify-center">
          <AlertDialogHeader>
            <AlertDialogTitle>Incoming tokens detected...</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="bg-brand-primary w-full flex flex-col items-center justify-center max-w-full">
            <div className="flex flex-col w-full max-w-full mb-2">
              <div className="font-bold mb-1">Token</div>
              <div className="p-4 bg-[#ffffff] rounded-full break-words max-w-full text-[10px]">
                {JSON.stringify(swaps)}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-brand-background rounded-full max-w-32 text-[#000000] border-none"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-brand rounded-full max-w-32 px-8"
              onClick={() => {
                setIsOpen(false);
                handleSwap();
              }}
            >
              Swap
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RootLayout;
