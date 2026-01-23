import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import type { MemeArena } from "./meme_arena";
import idl from "./meme_arena.json";
import { Keypair, PublicKey } from "@solana/web3.js";

// 从 IDL 中读取 Program ID
export const PROGRAM_ID = new PublicKey(idl.address);

// 创建一个只读的假钱包（用于未连接钱包时读取链上数据）
const createReadOnlyWallet = () => {
    const keypair = Keypair.generate();
    return {
        publicKey: keypair.publicKey,
        signTransaction: () => Promise.reject(new Error("只读模式，无法签名")),
        signAllTransactions: () => Promise.reject(new Error("只读模式，无法签名")),
    };
};

export const useMemeArenaProgram = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const program = useMemo(() => {
        // 使用真实钱包或只读钱包
        const walletToUse = wallet || createReadOnlyWallet();

        const provider = new AnchorProvider(connection, walletToUse, {
            preflightCommitment: "processed",
        });
        setProvider(provider);

        return new Program(idl as unknown as Idl, provider) as Program<MemeArena>;
    }, [connection, wallet]);

    return program;
};
