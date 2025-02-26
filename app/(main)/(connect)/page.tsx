"use client";

import { useRouter } from "next/navigation";
import { useWallet } from "@jup-ag/wallet-adapter";
import Connect from "@/components/Connect";

const Page = () => {
    const router = useRouter();
    const { connected } = useWallet();
    if(connected) router.push("/your-tokens");

    return <Connect />
} 


export default Page;

