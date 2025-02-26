import Tokens from "@/components/Tokens";
import { getWalletATAs } from "@/lib/action";
import { PublicKey } from "@solana/web3.js";

const Page = async () => {
  // const { publicKey } = useWallet();
  const publicKey = new PublicKey("AuMu1XB8HbhejnfqRKgSD2Nakp23S4JxAaA8UMYntjLR");
  const tokens = await getWalletATAs(publicKey);

  if (tokens == undefined) return <div className="w-full p-3 bg-brand-background mb-2 rounded-xl">No Tokens & plz connect again</div>;

  return <Tokens tokens={tokens}/>;
};

export default Page;
