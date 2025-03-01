"use client";

import { useRouter } from "next/navigation";
import { useWallet } from "@jup-ag/wallet-adapter";
import Connect from "@/components/Connect";

const Page = () => {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  if (connected) router.push(`/your-tokens?publicKey=${publicKey}`);

  return <Connect />;
};

export default Page;
