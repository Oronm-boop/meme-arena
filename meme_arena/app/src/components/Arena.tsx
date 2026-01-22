import {type FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import type { ArenaConfig } from '../utils/arenaApi';

// 引入默认图片资源（作为 fallback）
import kunImage from '../assets/蔡徐坤.gif';
import fanImage from '../assets/奥特勤.jpg';
import kun1 from '../assets/坤1.jpg';
import kun2 from '../assets/坤2.jpg';
import kun3 from '../assets/坤3.jpg';
import kun4 from '../assets/坤4.jpg';
import qin1 from '../assets/勤1.jpg';
import qin2 from '../assets/勤2.jpg';
import qin3 from '../assets/勤3.jpg';
import qin4 from '../assets/勤4.jpg';

// 默认表情包
const DEFAULT_MEMES_A = [kun1, kun2, kun3, kun4];
const DEFAULT_MEMES_B = [qin1, qin2, qin3, qin4];

interface ArenaProps {
    poolA: number;
    poolB: number;
    topic: string;
    onBet: (team: "A" | "B") => void;
    isSettled: boolean;
    winner: "A" | "B" | null;
    userBetSide: "A" | "B" | null;
    onClaim: () => void;
    hasClaimed: boolean;
    isLoading?: boolean;
    // 新增：阵营配置
    arenaConfig: ArenaConfig;
}

export const Arena: FC<ArenaProps> = ({ 
    poolA, 
    poolB, 
    onBet,
    isSettled,
    winner,
    userBetSide,
    onClaim,
    hasClaimed,
    isLoading = false,
    arenaConfig,
}) => {
    const { connected } = useWallet();
    const total = poolA + poolB || 1;
    const percentA = (poolA / total) * 100;

    const [animatedWidthA, setAnimatedWidthA] = useState(50);
    useEffect(() => {
        const timer = setTimeout(() => setAnimatedWidthA(percentA), 100);
        return () => clearTimeout(timer);
    }, [percentA]);

    // 从配置中获取队伍信息
    const teamA = arenaConfig.team_a;
    const teamB = arenaConfig.team_b;

    // 获取图片（优先使用配置，没有则使用默认）
    const teamAImage = teamA.image || kunImage;
    const teamBImage = teamB.image || fanImage;
    const memesA = teamA.memes.length > 0 ? teamA.memes : DEFAULT_MEMES_A;
    const memesB = teamB.memes.length > 0 ? teamB.memes : DEFAULT_MEMES_B;

    // 获取颜色（优先使用配置，没有则使用默认）
    const colorA = teamA.color || '#ec4899';
    const colorB = teamB.color || '#3b82f6';

    // 判断用户是否是赢家
    const isUserWinner = isSettled && userBetSide !== null && userBetSide === winner;
    const isUserLoser = isSettled && userBetSide !== null && userBetSide !== winner;

    // 获取卡片样式（根据结算状态）
    const getCardStyle = (team: "A" | "B") => {
        const isWinner = winner === team;
        const isLoser = isSettled && winner !== team;

        if (isWinner) {
            return "relative border-4 border-yellow-400 shadow-[0_0_50px_rgba(255,215,0,0.6)] animate-pulse";
        } else if (isLoser) {
            return "relative opacity-50 grayscale border border-gray-600";
        }
        return "";
    };

    // 渲染结果标签
    const renderResultBadge = (team: "A" | "B") => {
        if (!isSettled) return null;

        const isWinner = winner === team;

        if (isWinner) {
            return (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                    <div className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg animate-bounce">
                        <span className="text-2xl">🏆</span>
                        <span className="text-white font-black uppercase tracking-wider text-lg">WINNER!</span>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-full">
                        <span className="text-xl">💀</span>
                        <span className="text-gray-300 font-bold uppercase tracking-wider">DEFEATED</span>
                    </div>
                </div>
            );
        }
    };

    // 渲染操作按钮
    const renderActionButton = (team: "A" | "B") => {
        if (isSettled) {
            if (winner === team && userBetSide === team) {
                if (hasClaimed) {
                    return (
                        <div className="w-full py-3 bg-green-600/50 text-white font-bold rounded-xl text-center">
                            已领取奖励 ✓
                        </div>
                    );
                } else {
                    return (
                        <button
                            onClick={onClaim}
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-black uppercase tracking-widest rounded-xl shadow-lg transform active:scale-95 transition-all animate-pulse disabled:opacity-50"
                        >
                            {isLoading ? "领取中..." : "🎁 领取奖励"}
                        </button>
                    );
                }
            }
            else if (userBetSide === team && winner !== team) {
                return (
                    <div className="w-full py-3 bg-gray-600/50 text-gray-300 font-bold rounded-xl text-center">
                        下次好运 😢
                    </div>
                );
            }
            else {
                return (
                    <div className="w-full py-3 bg-gray-800/50 text-gray-500 font-bold rounded-xl text-center">
                        {winner === team ? "赢家通吃！" : "已落幕"}
                    </div>
                );
            }
        }

        if (!connected) {
            return <div className="text-xs text-gray-500">连接钱包下注</div>;
        }

        const buttonColor = team === "A" ? colorA : colorB;

        return (
            <button
                onClick={() => onBet(team)}
                style={{ backgroundColor: buttonColor }}
                className="w-full py-3 text-white font-black uppercase tracking-widest rounded-xl shadow-lg transform active:scale-95 transition-all hover:opacity-90"
            >
                BET {team === "A" ? "RED" : "BLUE"}
            </button>
        );
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 relative flex flex-col gap-8">

            {/* 结算结果公告 */}
            {isSettled && (
                <div className="mb-4 p-6 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-2xl text-center">
                    <div className="text-3xl mb-2">🎊</div>
                    <h3 className="text-2xl font-black text-white mb-2">
                        今日战斗已结束！
                    </h3>
                    <p className="text-purple-300 text-lg">
                        获胜方：
                        <span className="font-black text-xl" style={{ color: winner === "A" ? colorA : colorB }}>
                            {winner === "A" ? `${teamA.title} (Team Red)` : `${teamB.title} (Team Blue)`}
                        </span>
                    </p>
                    {isUserWinner && (
                        <p className="text-yellow-400 mt-2 animate-pulse font-bold">
                            恭喜你押中了！快领取你的奖励吧！
                        </p>
                    )}
                    {isUserLoser && (
                        <p className="text-gray-400 mt-2">
                            很遗憾，你押错了。下次再接再厉！
                        </p>
                    )}
                    {!userBetSide && (
                        <p className="text-gray-500 mt-2 text-sm">
                            你今天没有参与下注
                        </p>
                    )}
                </div>
            )}

            {/* 顶部：血条 */}
            <div className="relative w-full h-8 bg-gray-800 rounded-full overflow-hidden border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-4">
                <div
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isSettled && winner !== "A" ? "opacity-30" : ""}`}
                    style={{ 
                        width: `${animatedWidthA}%`,
                        background: `linear-gradient(to right, ${colorA}, ${colorA}dd)`
                    }}
                >
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white whitespace-nowrap">
                        {poolA.toFixed(3)} SOL
                    </div>
                </div>
                <div
                    className={`absolute top-0 right-0 h-full transition-all duration-1000 ease-out ${isSettled && winner !== "B" ? "opacity-30" : ""}`}
                    style={{ 
                        width: `${100 - animatedWidthA}%`,
                        background: `linear-gradient(to left, ${colorB}, ${colorB}dd)`
                    }}
                >
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white whitespace-nowrap">
                        {poolB.toFixed(3)} SOL
                    </div>
                </div>
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_white] z-10 transform -skew-x-12"
                    style={{ left: `${animatedWidthA}%`, transition: 'left 1s ease-out' }}
                />
            </div>

            {/* 主布局 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                {/* Team A 表情墙 */}
                <div 
                    className={`hidden md:flex md:col-span-3 flex-col gap-4 h-[600px] overflow-y-auto overflow-x-hidden p-2 rounded-xl border custom-scrollbar ${isSettled && winner !== "A" ? "opacity-40 grayscale" : ""}`}
                    style={{ 
                        backgroundColor: `${colorA}20`,
                        borderColor: `${colorA}40`
                    }}
                >
                    <h4 className="text-center text-xs font-bold tracking-widest uppercase mb-2" style={{ color: colorA }}>
                        {teamA.name} 集合
                    </h4>
                    {memesA.map((src, i) => (
                        <div 
                            key={i} 
                            className="w-24 h-24 mx-auto aspect-square rounded-full overflow-hidden border-2 hover:scale-110 transition-transform cursor-pointer bg-black"
                            style={{ 
                                borderColor: `${colorA}80`,
                                boxShadow: `0 0 10px ${colorA}50`
                            }}
                        >
                            <img src={src} alt={`Meme A ${i}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>

                {/* 中间战场 */}
                <div className="col-span-1 md:col-span-6 flex flex-col gap-8 relative">
                    {/* VS Badge */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                        <div className="relative">
                            {isSettled ? (
                                <div className="text-6xl font-black text-yellow-400 animate-pulse">
                                    END
                                </div>
                            ) : (
                                <div className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-red-600 drop-shadow-[0_4px_0_#990000] animate-bounce">
                                    VS
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-full">
                        {/* Team A Card */}
                        <div 
                            className={`flex flex-col items-center justify-between p-6 rounded-3xl transition-all duration-500 h-[500px] ${getCardStyle("A")}`}
                            style={{ 
                                background: `linear-gradient(to bottom right, ${colorA}40, black)`,
                                borderColor: `${colorA}50`
                            }}
                        >
                            {renderResultBadge("A")}
                            <div className="text-center">
                                <div className="font-bold tracking-widest uppercase mb-4 opacity-80" style={{ color: colorA }}>
                                    Team Red
                                </div>
                                <div 
                                    className={`w-40 h-40 mx-auto rounded-full border-4 overflow-hidden bg-black mb-6`}
                                    style={{ 
                                        borderColor: winner === "A" ? '#facc15' : colorA,
                                        boxShadow: winner === "A" 
                                            ? '0 0 40px rgba(255,215,0,0.7)' 
                                            : `0 0 30px ${colorA}80`
                                    }}
                                >
                                    <img src={teamAImage} alt={teamA.name} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">{teamA.title}</h3>
                                <div className="text-xs text-center mb-6 px-2" style={{ color: `${colorA}cc` }}>
                                    "{teamA.slogan}"
                                </div>
                            </div>
                            {renderActionButton("A")}
                        </div>

                        {/* Team B Card */}
                        <div 
                            className={`flex flex-col items-center justify-between p-6 rounded-3xl transition-all duration-500 h-[500px] ${getCardStyle("B")}`}
                            style={{ 
                                background: `linear-gradient(to bottom left, ${colorB}40, black)`,
                                borderColor: `${colorB}50`
                            }}
                        >
                            {renderResultBadge("B")}
                            <div className="text-center">
                                <div className="font-bold tracking-widest uppercase mb-4 opacity-80" style={{ color: colorB }}>
                                    Team Blue
                                </div>
                                <div 
                                    className={`w-40 h-40 mx-auto rounded-full border-4 overflow-hidden bg-black mb-6`}
                                    style={{ 
                                        borderColor: winner === "B" ? '#facc15' : colorB,
                                        boxShadow: winner === "B" 
                                            ? '0 0 40px rgba(255,215,0,0.7)' 
                                            : `0 0 30px ${colorB}80`
                                    }}
                                >
                                    <img src={teamBImage} alt={teamB.name} className="w-full h-full object-cover" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">{teamB.title}</h3>
                                <div className="text-xs text-center mb-6 px-2" style={{ color: `${colorB}cc` }}>
                                    "{teamB.slogan}"
                                </div>
                            </div>
                            {renderActionButton("B")}
                        </div>
                    </div>
                </div>

                {/* Team B 表情墙 */}
                <div 
                    className={`hidden md:flex md:col-span-3 flex-col gap-4 h-[600px] overflow-y-auto overflow-x-hidden p-2 rounded-xl border custom-scrollbar ${isSettled && winner !== "B" ? "opacity-40 grayscale" : ""}`}
                    style={{ 
                        backgroundColor: `${colorB}20`,
                        borderColor: `${colorB}40`
                    }}
                >
                    <h4 className="text-center text-xs font-bold tracking-widest uppercase mb-2" style={{ color: colorB }}>
                        {teamB.name} 大队
                    </h4>
                    {memesB.map((src, i) => (
                        <div 
                            key={i} 
                            className="w-24 h-24 mx-auto aspect-square rounded-full overflow-hidden border-2 hover:scale-110 transition-transform cursor-pointer bg-black"
                            style={{ 
                                borderColor: `${colorB}80`,
                                boxShadow: `0 0 10px ${colorB}50`
                            }}
                        >
                            <img src={src} alt={`Meme B ${i}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>

            </div>

            {/* 赔率显示 */}
            <div className="flex justify-between px-20 text-sm font-mono text-gray-400 z-10 w-full max-w-4xl mx-auto">
                <span className="font-bold text-xl" style={{ color: winner === "A" ? '#facc15' : colorA }}>
                    x{poolA > 0 ? (total / poolA).toFixed(2) : "∞"}
                </span>
                <span className="font-bold text-xl" style={{ color: winner === "B" ? '#facc15' : colorB }}>
                    x{poolB > 0 ? (total / poolB).toFixed(2) : "∞"}
                </span>
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
