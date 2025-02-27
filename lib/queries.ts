import { PublicKey } from "@solana/web3.js";
import { getWalletATAs } from "./action";
import { useQuery } from "@tanstack/react-query";

export const useWalletTokens = (publicKey: PublicKey, fetched?: boolean) => {
  return useQuery({
    queryFn: () => getWalletATAs(publicKey!),
    queryKey: ["walletTokens"],
    enabled: fetched,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
};
