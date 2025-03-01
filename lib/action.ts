import {
  Connection,
  PublicKey,
  Transaction,
  TokenBalance,
  VersionedTransaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { Token, TransferTokenParams } from "./types";
import { revalidatePath } from "next/cache";

export const rpc_url = `https://solana-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_RPC_API_KEY}`;

export async function getWalletATAs(
  walletPublicKey: PublicKey,
  connection?: Connection | null
): Promise<Token[]> {
  try {
    if (!connection) {
      connection = new Connection(rpc_url, "confirmed");
    }

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    const ATAs: Token[] = tokenAccounts.value.map((accountInfo) => {
      const accountData = accountInfo.account.data.parsed.info;
      return {
        ata: accountInfo.pubkey.toBase58(),
        mint: accountData.mint as string,
        amount: accountData.tokenAmount.uiAmountString as string,
        decimals: accountData.tokenAmount.decimals as number,
      };
    });

    return ATAs;
  } catch (error: any) {
    console.log(error.message);
    return [];
  }
}

export const transferToken = async ({
  sender,
  recipientAddress,
  tokenMint,
  decimals,
  amount,
  signTransaction,
  connection,
  publicKey,
}: TransferTokenParams) => {
  if (!connection) {
    connection = new Connection(rpc_url, "confirmed");
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

    revalidatePath(`/your-tokens?publicKey=${publicKey}`);
    return signature;
  } catch (error) {
    console.error("❌ Transaction failed:", error);
    throw error;
  }
};

export const getLatestSignatures = async (
  walletAddress: PublicKey,
  connection?: Connection
) => {
  if (!connection) {
    connection = new Connection(rpc_url, "confirmed");
  }

  try {
    const walletATAs = await getWalletATAs(walletAddress, connection);
    if (!walletATAs) {
      return [];
    }

    let latestSignatures: {
      latestSignature: string;
      mint: string;
      ata: string;
      amount: string;
      decimals: number;
    }[] = [];
    for (const walletATA of walletATAs) {
      const ataPublickey = new PublicKey(walletATA.ata);
      const signatureInfo = await connection.getSignaturesForAddress(
        ataPublickey,
        {
          limit: 1,
        }
      );
      if (signatureInfo.length > 0) {
        const latestTransaction = signatureInfo[0];
        const latestSignature = latestTransaction.signature;

        latestSignatures.push({ latestSignature, ...walletATA });
      }
    }
    return latestSignatures;
  } catch (error) {
    return [];
  }
};

export const getAndConfirmLatestTokenTransfer = async (
  latestSignature: string,
  mint: string,
  ata: string,
  connection?: Connection
): Promise<
  | {
      signature: string;
      tokenMint: string;
      preBalances: TokenBalance[];
      postBalances: TokenBalance[];
      amount: string;
    }[]
  | null
> => {
  if (!connection) {
    connection = new Connection(rpc_url, "confirmed");
  }

  try {
    const transaction = await connection.getParsedTransaction(
      latestSignature,
      "confirmed"
    );
    if (!transaction || !transaction.meta || !transaction.transaction.message) {
      return [];
    }
    if (transaction.meta.err) {
      return [];
    }
    const instructions = transaction.transaction.message.instructions;
    const preBalances = transaction.meta.preTokenBalances;
    const postBalances = transaction.meta.postTokenBalances;

    if (!preBalances || !postBalances) {
      return [];
    }

    let tokenTransfers: {
      signature: string;
      tokenMint: string;
      preBalances: TokenBalance[];
      postBalances: TokenBalance[];
      amount: string;
    }[] = [];

    for (const instruction of instructions) {
      if (
        "parsed" in instruction &&
        "program" in instruction &&
        instruction.program === "spl-token" &&
        instruction.parsed.type === "transfer"
      ) {
        const parsedInstruction = instruction.parsed.info;
        console.log(parsedInstruction);

        if (parsedInstruction.destination === ata) {
          const tokenMintAddress = mint;
          const amount = parsedInstruction.amount as string;

          tokenTransfers.push({
            signature: latestSignature,
            tokenMint: tokenMintAddress,
            preBalances,
            postBalances,
            amount,
          });
        }
      }
    }

    if (tokenTransfers.length > 0) return tokenTransfers;

    return [];
  } catch (error) {
    return null;
  }
};

export const createAndExecuteJupyterSwap = async (
  swaps: { inputMint: string; rawAmount: string }[],
  publicKey: string,
  signTransaction: (
    transaction: VersionedTransaction
  ) => Promise<VersionedTransaction>,
  path: string,
  connection?: Connection
) => {
  if (!connection) {
    connection = new Connection(rpc_url, "confirmed");
  }

  try {
    for (const swap of swaps) {
      const quoteResponse = await (
        await fetch(
          `https://api.jup.ag/swap/v1/quote?inputMint=${swap.inputMint}&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${swap.rawAmount}&slippageBps=50&restrictIntermediateTokens=true`
        )
      ).json();

      const swapResponse = await (
        await fetch("https://api.jup.ag/swap/v1/swap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 'x-api-key': ''
          },
          body: JSON.stringify({
            quoteResponse,
            userPublicKey: publicKey,
            dynamicComputeUnitLimit: true,
            dynamicSlippage: true,
            prioritizationFeeLamports: {
              priorityLevelWithMaxLamports: {
                maxLamports: 1000000,
                priorityLevel: "veryHigh",
              },
            },
          }),
        })
      ).json();

      if (swapResponse.simulationError) {
        return null;
      }

      const transactionBase64 = swapResponse.swapTransaction;
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(transactionBase64, "base64")
      );

      const signedTransaction = await signTransaction(transaction);

      const transactionBinary = signedTransaction.serialize();

      const signature = await connection.sendRawTransaction(transactionBinary, {
        maxRetries: 2,
        skipPreflight: true,
      });

      revalidatePath(path + `?publicKey=${publicKey}`);
      return signature;
    }
  } catch (error) {
    return null;
  }
};
