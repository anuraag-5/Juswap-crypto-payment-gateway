import { PublicKey } from "@solana/web3.js";

export interface Token {
    ata: string;
    mint: PublicKey;
    amount: number;
}