import { Token } from "@/lib/types";
import { TokensData } from "@/lib/constants";
import Image from "next/image";

const Tokens = ({ tokens }: { tokens: Token[] }) => {
  return tokens.length > 0 ? (
    tokens.map((token) => {
      let found: { mint: string; symbol: string; image: string }[] = [];
      for (let i = 0; i < TokensData.length; i++) {
        if (TokensData[i].mint === token.mint) found.push(TokensData[i]);
      }

      if (found.length > 0)
        return (
          <div
            key={token.mint}
            className="w-full p-3 bg-brand-background mb-2 rounded-xl flex justify-between h=[50px] items-center"
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
            <div>
              {`${token.amount}`}
              <span className="text-brand "> {found[0].symbol}</span>
            </div>
          </div>
        );

      return (
        <div
          key={token.mint}
          className="w-full p-3 bg-brand-background mb-2 rounded-xl flex justify-between h=[50px] items-center"
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
        </div>
      );
    })
  ) : (
    <div className="w-full p-3 bg-brand-background mb-2 rounded-xl">
      You have no tokens
    </div>
  );
};

export default Tokens;
