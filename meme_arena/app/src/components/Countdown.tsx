import { FC, useEffect, useState } from 'react';

interface CountdownProps {
  deadline: number; // Unix 时间戳（秒）
  onDeadlineReached?: () => void; // 到达 deadline 时的回调
}

// 计算剩余时间
const calculateTimeLeft = (deadline: number) => {
  const now = Math.floor(Date.now() / 1000);
  const diff = deadline - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    hours: Math.floor(diff / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
    total: diff,
  };
};

export const Countdown: FC<CountdownProps> = ({ deadline, onDeadlineReached }) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(deadline));
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // 每秒更新一次倒计时
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(deadline);
      setTimeLeft(newTimeLeft);

      // 到达 deadline 时触发回调（只触发一次）
      if (newTimeLeft.total <= 0 && !hasTriggered && onDeadlineReached) {
        setHasTriggered(true);
        onDeadlineReached();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, hasTriggered, onDeadlineReached]);

  // 重置触发状态（当 deadline 改变时）
  useEffect(() => {
    setHasTriggered(false);
  }, [deadline]);

  // 格式化数字（补零）
  const pad = (num: number) => num.toString().padStart(2, '0');

  // 如果已经结束
  if (timeLeft.total <= 0) {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border border-yellow-500/50 rounded-xl backdrop-blur-sm">
        <span className="text-2xl animate-bounce">⏰</span>
        <span className="text-yellow-300 font-bold text-lg tracking-wide">
          结算进行中...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 标题 */}
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <span>⏱️</span>
        <span>距离今日结算</span>
      </div>

      {/* 倒计时数字 */}
      <div className="flex items-center gap-2">
        {/* 小时 */}
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-lg px-4 py-2 min-w-[60px] text-center shadow-lg">
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {pad(timeLeft.hours)}
            </span>
          </div>
          <span className="text-xs text-gray-500 mt-1">时</span>
        </div>

        <span className="text-2xl text-gray-500 font-bold animate-pulse">:</span>

        {/* 分钟 */}
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-lg px-4 py-2 min-w-[60px] text-center shadow-lg">
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {pad(timeLeft.minutes)}
            </span>
          </div>
          <span className="text-xs text-gray-500 mt-1">分</span>
        </div>

        <span className="text-2xl text-gray-500 font-bold animate-pulse">:</span>

        {/* 秒 */}
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-lg px-4 py-2 min-w-[60px] text-center shadow-lg">
            <span className="text-3xl font-mono font-bold text-yellow-400 tabular-nums">
              {pad(timeLeft.seconds)}
            </span>
          </div>
          <span className="text-xs text-gray-500 mt-1">秒</span>
        </div>
      </div>

      {/* 提示文字 */}
      {timeLeft.total < 300 && ( // 小于5分钟时显示警告
        <div className="text-red-400 text-sm animate-pulse">
          即将结算！快来下注！
        </div>
      )}
    </div>
  );
};

// 辅助函数：获取今天晚上8点的时间戳
export const getTodayDeadline = (): number => {
  const now = new Date();
  const target = new Date(now);
  target.setHours(20, 0, 0, 0); // 晚上8点

  // 如果已经过了今天8点，返回明天的8点
  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }

  return Math.floor(target.getTime() / 1000);
};

// 辅助函数：获取今天的日期字符串（用于 TOPIC）
export const getTodayDateString = (): string => {
  const now = new Date();
  // 如果已经过了晚上8点，使用明天的日期
  const hour = now.getHours();
  if (hour >= 20) {
    now.setDate(now.getDate() + 1);
  }
  return now.toISOString().split('T')[0]; // "2026-01-22"
};
