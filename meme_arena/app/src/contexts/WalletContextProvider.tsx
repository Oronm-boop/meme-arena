import {type FC, type ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';

// 默认样式，可以被你的应用覆盖
import '@solana/wallet-adapter-react-ui/styles.css';

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    // 网络可以设置为 'devnet', 'testnet', 或 'mainnet-beta'
    const network = WalletAdapterNetwork.Devnet;

    // 你也可以提供一个自定义的 RPC 端点
    // 使用你之前提供的 Helius RPC 或者默认的 devnet
    const endpoint = useMemo(() => "https://devnet.helius-rpc.com/?api-key=e8c1baae-b1fb-4138-992d-5cc98504da27", [network]);

    const wallets = useMemo(
        () => [
            /**
             * 支持标准钱包适配器协议的钱包会被自动检测到。
             * 你的用户可以使用 Phantom, Solflare, Backpack 等。
             */
            // new UnsafeBurnerWalletAdapter(), // 仅用于测试
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
