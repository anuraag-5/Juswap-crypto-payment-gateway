import { PublicKey, Transaction } from "@solana/web3.js";

export interface Token {
  ata: string;
  mint: string;
  amount: number;
}

export interface TransferTokenParams {
  sender: PublicKey;
  recipientAddress: string;
  tokenMint: string;
  amount: number;
  decimals: number;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}
