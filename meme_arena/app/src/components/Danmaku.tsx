import {type FC, useEffect, useState } from 'react';

const QUOTES = [
    // Kun Memes
    "🐔 鸡你太美！",
    "🏀 唱、跳、Rap、篮球",
    "🤔 你干嘛~~",
    "👋 全民制作人大家好",
    "🫡 孙割的话你要听，孙割的项目你别碰!",
    "🚜 开发5G",
    "🥚 蒸蚌",

    // Qin Memes
    "💰 打工,这辈子是不可能打工的",
    "👽 爱你老己，明天见",
    "🚪 韭菜不够用了",
    "🍚 拿住！(HODL)",
    "👴 梭哈老头：不梭哈，这一辈子打工是不可能打工的",
    "📉 凭运气赚的钱，凭实力亏回去",
    "🏰 一币一别墅，一币一嫩模",
    "🐳 巨鲸路过，水花有点大",
    "🪓 又是一刀，熟练得让人心疼",
    "🧠 看不懂，但我大受震撼",
    "🫠 已经麻了",
    "🙏 回本就走，真的",
    "📊 技术分析：感觉要涨",
    "📈 一卖就涨，一买就跌",
    "💥 拉盘开始，坐稳了",
    "🩸 血流成河，习惯了",
    "🧘 已经佛了",
    "🤡 我就是反向指标",
    "🧳 高位站岗，风景不错",
    "🕳️ 抄底抄在半山腰",
    "🐸 Feels good man",
    "🐶 Much wow, very moon",
    "🧪 Meme 没基本面，全靠共识",
    "🗣️ FUD 看多了，也就那样",
    "🧊 稳如老狗",
    "🪙 社区即价值",
    "📅 马上官宣，别急",
    "📡 已 priced in",
    "🧠 DYOR，但我不听",
    "🫡 最后一次，下不为例",
    "🛌 睡一觉就好了",
    "🎭 图一乐，别当真",
    "📉 长期看好（已深套）",
    "🧨 让子弹飞一会",
    "👀 懂的都懂",
    "🌕 上月球了，记得截图",
    "📦 钱没了，经验还在",
    "🪦 信仰暂时存放中"

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
