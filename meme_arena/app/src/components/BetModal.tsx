import { useState, useEffect, type FC } from 'react';

// 下注模态框属性
interface BetModalProps {
  isOpen: boolean;
  team: 'A' | 'B';
  teamName: string;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}

// 预设金额选项
const PRESET_AMOUNTS = [0.05, 0.1, 0.25, 0.5, 1];

export const BetModal: FC<BetModalProps> = ({
  isOpen,
  team,
  teamName,
  onConfirm,
  onCancel,
}) => {
  const [amount, setAmount] = useState('0.1');
  const [isLeaving, setIsLeaving] = useState(false);

  // 重置状态当模态框打开时
  useEffect(() => {
    if (isOpen) {
      setAmount('0.1');
      setIsLeaving(false);
    }
  }, [isOpen]);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCancel = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsLeaving(false);
      onCancel();
    }, 200);
  };

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }
    setIsLeaving(true);
    setTimeout(() => {
      setIsLeaving(false);
      onConfirm(numAmount);
    }, 200);
  };

  if (!isOpen) return null;

  // 根据队伍获取颜色配置
  const isTeamA = team === 'A';
  const colors = isTeamA
    ? {
        primary: 'pink',
        gradient: 'from-pink-600 to-rose-500',
        border: 'border-pink-500/50',
        bg: 'bg-pink-900/30',
        glow: 'shadow-[0_0_60px_rgba(236,72,153,0.3)]',
        buttonBg: 'bg-pink-600 hover:bg-pink-500',
        inputFocus: 'focus:border-pink-500 focus:ring-pink-500/30',
        text: 'text-pink-400',
        lightText: 'text-pink-300',
      }
    : {
        primary: 'blue',
        gradient: 'from-blue-600 to-cyan-500',
        border: 'border-blue-500/50',
        bg: 'bg-blue-900/30',
        glow: 'shadow-[0_0_60px_rgba(59,130,246,0.3)]',
        buttonBg: 'bg-blue-600 hover:bg-blue-500',
        inputFocus: 'focus:border-blue-500 focus:ring-blue-500/30',
        text: 'text-blue-400',
        lightText: 'text-blue-300',
      };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          isLeaving ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleCancel}
      />

      {/* 模态框主体 */}
      <div
        className={`
          relative z-10 w-[90vw] max-w-md
          ${isLeaving ? 'animate-modal-out' : 'animate-modal-in'}
        `}
      >
        {/* 发光背景 */}
        <div
          className={`absolute inset-0 ${colors.glow} rounded-3xl blur-xl opacity-50`}
        />

        {/* 内容容器 */}
        <div
          className={`
            relative overflow-hidden
            bg-gradient-to-br from-neutral-900/95 to-neutral-950/95
            backdrop-blur-xl
            border ${colors.border}
            rounded-3xl
          `}
        >
          {/* 顶部装饰条 */}
          <div className={`h-1 bg-gradient-to-r ${colors.gradient}`} />

          {/* 头部 */}
          <div className="px-6 pt-6 pb-4 text-center">
            {/* 队伍图标 */}
            <div
              className={`
                inline-flex items-center justify-center
                w-16 h-16 mb-4
                rounded-full
                bg-gradient-to-br ${colors.gradient}
                ${colors.glow}
              `}
            >
              <span className="text-3xl">{isTeamA ? '🐔' : '🚜'}</span>
            </div>

            <h2 className="text-2xl font-black text-white mb-1">
              押注{' '}
              <span className={colors.text}>{teamName}</span>
            </h2>
            <p className="text-gray-400 text-sm">
              {isTeamA ? '"鸡你太美..."' : '"我要开发5G..."'}
            </p>
          </div>

          {/* 金额输入区域 */}
          <div className="px-6 pb-6">
            {/* 输入框 */}
            <div className="relative mb-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                placeholder="输入金额"
                min="0.001"
                step="0.01"
                autoFocus
                className={`
                  w-full px-4 py-4
                  text-center text-3xl font-black text-white
                  bg-black/50 border-2 border-white/10
                  rounded-2xl
                  outline-none
                  transition-all duration-200
                  ${colors.inputFocus} focus:ring-4
                  placeholder:text-gray-600 placeholder:text-lg placeholder:font-normal
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none
                `}
              />
              <div
                className={`
                  absolute right-4 top-1/2 -translate-y-1/2
                  px-3 py-1
                  bg-gradient-to-r ${colors.gradient}
                  rounded-lg
                  text-white font-bold text-sm
                `}
              >
                SOL
              </div>
            </div>

            {/* 快捷金额按钮 */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className={`
                    px-4 py-2
                    rounded-xl font-bold text-sm
                    transition-all duration-200
                    ${
                      parseFloat(amount) === preset
                        ? `${colors.buttonBg} text-white scale-105`
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {preset} SOL
                </button>
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="
                  flex-1 py-4
                  bg-white/5 hover:bg-white/10
                  text-gray-400 hover:text-white
                  font-bold text-lg
                  rounded-2xl
                  transition-all duration-200
                  border border-white/10
                "
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!amount || parseFloat(amount) <= 0}
                className={`
                  flex-1 py-4
                  ${colors.buttonBg}
                  text-white font-bold text-lg
                  rounded-2xl
                  transition-all duration-200
                  transform active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                  ${colors.glow}
                `}
              >
                🎲 确认下注
              </button>
            </div>

            {/* 提示信息 */}
            <p className="text-center text-gray-500 text-xs mt-4">
              每场游戏每人只能投一次哦 · 按 ESC 取消
            </p>
          </div>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes modal-out {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
        }
        
        .animate-modal-in {
          animation: modal-in 0.25s ease-out forwards;
        }
        
        .animate-modal-out {
          animation: modal-out 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
