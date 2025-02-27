import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { TransferTokenParams } from "./types";

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

export const transferToken = async ({
  sender,
  recipientAddress,
  tokenMint,
  decimals,
  amount,
  signTransaction,
}: TransferTokenParams) => {
  if (!connection) {
    connection = new Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );
  }
  try {
    const recipientWallet = new PublicKey(recipientAddress);
    const mintPublicKey = new PublicKey(tokenMint);
    const senderTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      sender
    );
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      recipientWallet
    );

    let transaction = new Transaction();
    const { blockhash } = await connection!.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    transaction.feePayer = sender;

    try {
      await getAccount(connection!, recipientTokenAccount);
    } catch (error) {
      console.log("Recipient ATA not found, creating one...");
      transaction.add(
        createAssociatedTokenAccountInstruction(
          sender,
          recipientTokenAccount,
          recipientWallet,
          mintPublicKey
        )
      );
    }
    const finalAmount = amount * Math.pow(10, decimals);
    transaction.add(
      createTransferInstruction(
        senderTokenAccount,
        recipientTokenAccount,
        sender,
        finalAmount
      )
    );

    const signedTransaction = await signTransaction(transaction);
    const signature = await connection!.sendRawTransaction(
      signedTransaction.serialize()
    );

    console.log(
      `✅ Transaction successful: https://solscan.io/tx/${signature}`
    );
    return signature;
  } catch (error) {
    console.error("❌ Transaction failed:", error);
    throw error;
  }
};
