import {type FC, useEffect, useState } from 'react';

const QUOTES = [
    // Kun Memes
    "🐔 鸡你太美！",
    "🏀 唱、跳、Rap、篮球",
    "🤔 你干嘛~~",
    "👋 全民制作人大家好",
    "🎵 Music!",
    "🦅 厉不厉害你坤哥",
    "🥚 也就是个蛋",

    // Qin Memes
    "🚜 我要开发5G",
    "💰 马云甚至想见我",
    "👽 我是真的！",
    "🚪 芝麻开门",
    "🍚 这里的饭好像挺好吃的",
    "🏦 乡村银行行长",

    // General Vibe
    "🔥 Pure Vibe",
    "🚀 To the Moon",
    "💎 Diamond Hands",
    "🎪 Abstract Arena",
    "💸 All in Blue!",
    "💖 All in Red!",
];

interface DanmakuItem {
    id: number;
    text: string;
    top: number; // 0-100%
    duration: number; // seconds
    color: string;
    size: string;
}

export const Danmaku: FC = () => {
    const [items, setItems] = useState<DanmakuItem[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const id = Date.now();
            const text = QUOTES[Math.floor(Math.random() * QUOTES.length)];
            const top = Math.random() * 80 + 10; // 10% - 90% height
            const duration = Math.random() * 10 + 10; // 10s - 20s
            // Random Vibe Colors
            const colors = ['text-pink-400', 'text-blue-400', 'text-yellow-300', 'text-white', 'text-purple-400'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const sizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl font-bold'];
            const size = sizes[Math.floor(Math.random() * sizes.length)];

            const newItem: DanmakuItem = { id, text, top, duration, color, size };

            setItems(prev => [...prev, newItem]);

            // Cleanup old items
            setTimeout(() => {
                setItems(prev => prev.filter(item => item.id !== id));
            }, duration * 1000);

        }, 800); // New danmaku every 800ms

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
            {items.map(item => (
                <div
                    key={item.id}
                    className={`absolute whitespace-nowrap animate-danmaku ${item.color} ${item.size}`}
                    style={{
                        top: `${item.top}%`,
                        animationDuration: `${item.duration}s`,
                        // Start off-screen right, move to off-screen left. 
                        // Note: Tailwind config needs keyframes or we use inline style for simple translation if configured.
                        // We will add global CSS keyframes for .animate-danmaku
                    }}
                >
                    {item.text}
                </div>
            ))}

            <style>{`
                @keyframes danmaku {
                    from { transform: translateX(100vw); }
                    to { transform: translateX(-100%); }
                }
                .animate-danmaku {
                    left: 0;
                    animation-name: danmaku;
                    animation-timing-function: linear;
                }
            `}</style>
        </div>
    );
};
