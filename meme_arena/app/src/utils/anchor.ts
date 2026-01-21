import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import type { MemeArena } from "./meme_arena";
import idl from "./meme_arena.json";
import { PublicKey } from "@solana/web3.js";

// 从 IDL 中读取 Program ID
export const PROGRAM_ID = new PublicKey(idl.address);

export const useMemeArenaProgram = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const program = useMemo(() => {
        // 即使没有连接钱包，我们也想读取数据，所以这里可以做个只读 Provider
        // 但 Anchor Program 构造函数通常需要 Provider 有 Wallet
        // 我们可以创建一个 Mock Wallet 或者只在 wallet 存在时返回 program
        // 为了简单起见，我们先要求 wallet 存在才能进行交互 (写操作)
        // 读操作如果需要，我们可以手动构建 Program

        if (!wallet) {
            // 如果需要只读模式，可以返回一个只读 Program，但为了MVP简单，先返回 null
            // 或者创建一个 Mock Provider
            return null;
        }

        const provider = new AnchorProvider(connection, wallet, {
            preflightCommitment: "processed",
        });
        setProvider(provider);

        return new Program(idl as unknown as Idl, provider) as Program<MemeArena>;
    }, [connection, wallet]);

    return program;
};
