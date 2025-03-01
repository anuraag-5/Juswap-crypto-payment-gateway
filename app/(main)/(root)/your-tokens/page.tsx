import Tokens from "@/components/Tokens";
import { getWalletATAs } from "@/lib/action";
import { PublicKey } from "@solana/web3.js";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) => {
  const publicKeyString = (await searchParams).publicKey;

  if (!publicKeyString) {
    return (
      <div className="w-full p-3 bg-brand-background mb-2 rounded-xl">
        Public Key is missing
      </div>
    );
  }

  const publicKey = new PublicKey(publicKeyString);

  const tokens = await getWalletATAs(publicKey);
  if (tokens === undefined) {
    return (
      <div className="w-full p-3 bg-brand-background mb-2 rounded-xl">
        No Tokens & please connect again
      </div>
    );
  }

  return <Tokens tokens={tokens} />;
};

export default Page;
