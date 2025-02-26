import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

let connection: Connection | null = null;

export async function getWalletATAs(walletAddress: PublicKey) {
  try {
    if (!connection) {
      connection = new Connection(
        "https://api.mainnet-beta.solana.com",
        "confirmed"
      );
    }
    const walletPublicKey = walletAddress;

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    const ATAs = tokenAccounts.value.map((accountInfo) => {
      const accountData = accountInfo.account.data.parsed.info;
      return {
        ata: accountInfo.pubkey.toBase58(), // (ATA)
        mint: accountData.mint, // Token mint address
        amount: accountData.tokenAmount.uiAmount,
      };
    });

    return ATAs;
  } catch (error: any) {
    console.log(error.message);
  }
}