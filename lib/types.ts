import { Connection, PublicKey, Transaction } from "@solana/web3.js";

export interface Token {
  ata: string;
  mint: string;
  amount: string;
  decimals: number;
}

export interface TransferTokenParams {
  connection?: Connection;
  sender: PublicKey;
  recipientAddress: string;
  tokenMint: string;
  amount: number;
  decimals: number;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  publicKey: PublicKey
}
