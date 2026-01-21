import { useEffect, useState, type FC } from 'react';

// Toast类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number; // 自动关闭时间，毫秒
}

// 单个Toast组件
export const Toast: FC<ToastProps> = ({ message, type, isVisible, onClose, duration = 4000 }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsLeaving(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  // 根据类型获取样式配置
  const getStyleConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-emerald-900/90 to-green-950/90',
          border: 'border-emerald-500/50',
          icon: '🎉',
          glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
          textColor: 'text-emerald-400',
          progressBg: 'bg-emerald-500',
        };
      case 'error':
        return {
          bg: 'from-red-900/90 to-rose-950/90',
          border: 'border-red-500/50',
          icon: '❌',
          glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
          textColor: 'text-red-400',
          progressBg: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'from-amber-900/90 to-orange-950/90',
          border: 'border-amber-500/50',
          icon: '⚠️',
          glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
          textColor: 'text-amber-400',
          progressBg: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          bg: 'from-blue-900/90 to-indigo-950/90',
          border: 'border-blue-500/50',
          icon: 'ℹ️',
          glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
          textColor: 'text-blue-400',
          progressBg: 'bg-blue-500',
        };
    }
  };

  const config = getStyleConfig();

  return (
    <div
      className={`
        fixed top-24 left-1/2 -translate-x-1/2 z-[100]
        min-w-[320px] max-w-[90vw] md:max-w-[480px]
        ${isLeaving ? 'animate-toast-out' : 'animate-toast-in'}
      `}
    >
      <div
        className={`
          relative overflow-hidden
          bg-gradient-to-r ${config.bg}
          backdrop-blur-xl
          border ${config.border}
          rounded-2xl
          ${config.glow}
        `}
      >
        {/* 主内容区域 */}
        <div className="flex items-start gap-4 p-4 pr-12">
          {/* 图标 */}
          <div className="flex-shrink-0 text-2xl animate-bounce">
            {config.icon}
          </div>
          
          {/* 消息文本 */}
          <div className="flex-1 pt-1">
            <p className={`font-bold ${config.textColor} text-sm md:text-base leading-relaxed`}>
              {message}
            </p>
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className={`
            absolute top-3 right-3
            w-8 h-8 rounded-full
            flex items-center justify-center
            bg-white/10 hover:bg-white/20
            text-white/60 hover:text-white
            transition-all duration-200
            text-lg font-light
          `}
        >
          ✕
        </button>

        {/* 进度条 */}
        <div className="h-1 bg-black/20">
          <div
            className={`h-full ${config.progressBg} opacity-80`}
            style={{
              animation: `shrink-width ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>

      {/* 动画和进度条样式 */}
      <style>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes toast-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
        }
        
        @keyframes shrink-width {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-toast-in {
          animation: toast-in 0.3s ease-out forwards;
        }
        
        .animate-toast-out {
          animation: toast-out 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Toast Hook - 方便在组件中使用
export interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({
      isVisible: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  return {
    toast,
    showToast,
    hideToast,
  };
};
