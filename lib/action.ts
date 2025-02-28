import {
  Connection,
  PublicKey,
  Transaction,
  ParsedInstruction,
  ParsedTransactionWithMeta,
  TokenBalance,
  clusterApiUrl,
  VersionedTransaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { TransferTokenParams } from "./types";
import { revalidatePath } from "next/cache";

// let connection: Connection | null = null;

export async function getWalletATAs(
  walletAddress: PublicKey,
  connection?: Connection | null
) {
  try {
    if (!connection) {
      connection = new Connection(
        "https://solana-devnet.g.alchemy.com/v2/ryTQis0V_mwGgV8HCAaP7PL0ouywGRJx",
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
  connection,
}: TransferTokenParams) => {
  if (!connection) {
    connection = new Connection(
      "https://solana-devnet.g.alchemy.com/v2/ryTQis0V_mwGgV8HCAaP7PL0ouywGRJx",
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

export const getLatestSignatures = async (
  walletAddress: PublicKey,
  connection?: Connection
) => {
  if (!connection) {
    connection = new Connection(
      "https://solana-devnet.g.alchemy.com/v2/ryTQis0V_mwGgV8HCAaP7PL0ouywGRJx",
      "confirmed"
    );
  }

  try {
    const walletATAs = await getWalletATAs(walletAddress, connection);
    if (!walletATAs) {
      return [];
    }

    let latestSignatures: {
      latestSignature: string;
      mint: any;
      ata: string;
      amount: any;
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
    connection = new Connection(
      "https://solana-devnet.g.alchemy.com/v2/ryTQis0V_mwGgV8HCAaP7PL0ouywGRJx",
      "confirmed"
    );
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
          const amount = parsedInstruction.amount;

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
    connection = new Connection(
      "https://solana-devnet.g.alchemy.com/v2/ryTQis0V_mwGgV8HCAaP7PL0ouywGRJx",
      "confirmed"
    );
  }

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

    console.log(swapResponse);

    if (swapResponse.simulationError) {
      return false;
    }

    const transactionBase64 = swapResponse.swapTransaction;
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(transactionBase64, "base64")
    );

    const signedTransaction = await signTransaction(transaction);

    const transactionBinary = signedTransaction.serialize();
    console.log(transactionBinary);

    const signature = await connection.sendRawTransaction(transactionBinary, {
      maxRetries: 2,
      skipPreflight: true,
    });

    console.log(signature);
  }
  revalidatePath(path, "page");
  return true;
};
