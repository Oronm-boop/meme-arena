import {type FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import kunImage from '../assets/蔡徐坤.gif';
import fanImage from '../assets/奥特勤.jpg';

// 引入新表情包资源
import kun1 from '../assets/坤1.jpg';
import kun2 from '../assets/坤2.jpg';
import kun3 from '../assets/坤3.jpg';
import kun4 from '../assets/坤4.jpg';

import qin1 from '../assets/勤1.jpg';
import qin2 from '../assets/勤2.jpg';
import qin3 from '../assets/勤3.jpg';
import qin4 from '../assets/勤4.jpg';

interface ArenaProps {
    poolA: number; // SOL amount for Team A
    poolB: number; // SOL amount for Team B
    topic: string; // e.g. "Kun vs Fan"
    onBet: (team: "A" | "B") => void; // New prop for bet handling
}

// 更新表情包数据
const MEMES_A = [kun1, kun2, kun3, kun4];
const MEMES_B = [qin1, qin2, qin3, qin4];

export const Arena: FC<ArenaProps> = ({ poolA, poolB,  onBet }) => {
    const { connected } = useWallet();
    const total = poolA + poolB || 1;
    const percentA = (poolA / total) * 100;

    const [animatedWidthA, setAnimatedWidthA] = useState(50);
    useEffect(() => {
        const timer = setTimeout(() => setAnimatedWidthA(percentA), 100);
        return () => clearTimeout(timer);
    }, [percentA]);

    return (
        <div className="w-full max-w-7xl mx-auto p-4 relative flex flex-col gap-8">

            {/* 顶部：巨大的血条 (Funding Bars) */}
            <div className="relative w-full h-8 bg-gray-800 rounded-full overflow-hidden border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-4">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-600 to-rose-500 transition-all duration-1000 ease-out"
                    style={{ width: `${animatedWidthA}%` }}
                >
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white whitespace-nowrap">
                        {poolA.toFixed(3)} SOL
                    </div>
                </div>
                <div
                    className="absolute top-0 right-0 h-full bg-gradient-to-l from-blue-600 to-cyan-500 transition-all duration-1000 ease-out"
                    style={{ width: `${100 - animatedWidthA}%` }}
                >
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white whitespace-nowrap">
                        {poolB.toFixed(3)} SOL
                    </div>
                </div>
                {/* Lightning Divider */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_white] z-10 transform -skew-x-12"
                    style={{ left: `${animatedWidthA}%`, transition: 'left 1s ease-out' }}
                />
            </div>

            {/* 主布局：左墙 - 中间战场 - 右墙 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* Team Red Meme Wall (Left) */}
                <div className="hidden md:flex md:col-span-3 flex-col gap-4 h-[600px] overflow-y-auto overflow-x-hidden p-2 rounded-xl bg-pink-900/20 border border-pink-500/20 custom-scrollbar">
                    <h4 className="text-center text-pink-400 text-xs font-bold tracking-widest uppercase mb-2">ikun 集合</h4>
                    {MEMES_A.map((src, i) => (
                        <div key={i} className="w-24 h-24 mx-auto aspect-square rounded-full overflow-hidden border-2 border-pink-500/50 hover:scale-110 transition-transform cursor-pointer shadow-[0_0_10px_rgba(236,72,153,0.3)] bg-black">
                            <img src={src} alt={`Meme A ${i}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>

                {/* Main Battle Arena (Center) */}
                <div className="col-span-1 md:col-span-6 flex flex-col gap-8 relative">
                    {/* VS Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                        <div className="relative">
                            <div className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-red-600 drop-shadow-[0_4px_0_#990000] animate-bounce">
                                VS
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-full">
                        {/* Team Red Card */}
                        <div className="flex flex-col items-center justify-between p-6 bg-gradient-to-br from-pink-900/40 to-black border border-pink-500/30 rounded-3xl hover:bg-pink-900/60 transition-colors h-[500px]">
                            <div className="text-center">
                                <div className="text-pink-400 font-bold tracking-widest uppercase mb-4 opacity-80">Team Red</div>
                                <div className="w-40 h-40 mx-auto rounded-full border-4 border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.5)] overflow-hidden bg-black mb-6">
                                    <img src={kunImage} alt="Kun" className="w-full h-full object-cover" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">练习生</h3>
                                <div className="text-pink-300 text-xs text-center mb-6 px-2">"鸡你太美..."</div>
                            </div>

                            {connected ? (
                                <button
                                    onClick={() => onBet("A")}
                                    className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg transform active:scale-95 transition-all"
                                >
                                    BET RED
                                </button>
                            ) : (
                                <div className="text-xs text-gray-500">连接钱包下注</div>
                            )}
                        </div>

                        {/* Team Blue Card */}
                        <div className="flex flex-col items-center justify-between p-6 bg-gradient-to-bl from-blue-900/40 to-black border border-blue-500/30 rounded-3xl hover:bg-blue-900/60 transition-colors h-[500px]">
                            <div className="text-center">
                                <div className="text-blue-400 font-bold tracking-widest uppercase mb-4 opacity-80">Team Blue</div>
                                <div className="w-40 h-40 mx-auto rounded-full border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] overflow-hidden bg-black mb-6">
                                    <img src={fanImage} alt="Fan" className="w-full h-full object-cover" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">开挖掘机</h3>
                                <div className="text-blue-300 text-xs text-center mb-6 px-2">"我要开发5G..."</div>
                            </div>

                            {connected ? (
                                <button
                                    onClick={() => onBet("B")}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg transform active:scale-95 transition-all"
                                >
                                    BET BLUE
                                </button>
                            ) : (
                                <div className="text-xs text-gray-500">连接钱包下注</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Team Blue Meme Wall (Right) */}
                <div className="hidden md:flex md:col-span-3 flex-col gap-4 h-[600px] overflow-y-auto overflow-x-hidden p-2 rounded-xl bg-blue-900/20 border border-blue-500/20 custom-scrollbar">
                    <h4 className="text-center text-blue-400 text-xs font-bold tracking-widest uppercase mb-2">挖掘机大队</h4>
                    {MEMES_B.map((src, i) => (
                        <div key={i} className="w-24 h-24 mx-auto aspect-square rounded-full overflow-hidden border-2 border-blue-500/50 hover:scale-110 transition-transform cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.3)] bg-black">
                            <img src={src} alt={`Meme B ${i}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>

            </div>

            {/* 赔率显示 */}
            <div className="flex justify-between px-20 text-sm font-mono text-gray-400 z-10 w-full max-w-4xl mx-auto">
                <span className="text-pink-400 font-bold text-xl">x{(total / poolA).toFixed(2)}</span>
                <span className="text-blue-400 font-bold text-xl">x{(total / poolB).toFixed(2)}</span>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.2);
                }
            `}</style>
        </div>
    );
};
