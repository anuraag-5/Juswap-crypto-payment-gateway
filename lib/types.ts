import { PublicKey } from "@solana/web3.js";

export interface Token {
    ata: string;
    mint: string;
    amount: number;
}