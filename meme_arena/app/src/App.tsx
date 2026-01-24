import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { WalletContextProvider } from './contexts/WalletContextProvider'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Arena } from './components/Arena'
import { Danmaku } from './components/Danmaku'
import { Toast, useToast } from './components/Toast'
import { BetModal } from './components/BetModal'
import { Countdown, getTodayDateString } from './components/Countdown'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { useMemeArenaProgram, PROGRAM_ID } from './utils/anchor'
import { fetchTodayArenaConfig, DEFAULT_ARENA_CONFIG } from './utils/arenaApi'
import type { ArenaConfig } from './utils/arenaApi'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { Buffer } from 'buffer';

// 管理员钱包地址（合约部署者）
const ADMIN_WALLET = "ykLHN2JeHCanSKN7Rfzzj9tAW7R1APoeq9rN5DZaLjZ";

// 生成今日的 Topic（带日期）
const getTodayTopic = (suffix: number = 0) => {
  const dateStr = getTodayDateString();
  return suffix > 0 ? `MemeArena_${dateStr}_v${suffix}` : `MemeArena_${dateStr}`;
};

import { useTranslation } from 'react-i18next';

function GameContent() {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const program = useMemeArenaProgram();
  const { toast, showToast, hideToast } = useToast();

  // 阵营配置（从后端获取）- 必须在 TOPIC 之前声明，因为 TOPIC 依赖 topic_version
  const [arenaConfig, setArenaConfig] = useState<ArenaConfig>(DEFAULT_ARENA_CONFIG);

  // Topic 版本号（从后端配置获取，确保所有用户看到同一个游戏）
  // 动态生成 TOPIC（使用后端配置的版本号）
  const TOPIC = useMemo(() => getTodayTopic(arenaConfig.topic_version || 0), [arenaConfig.topic_version]);
  
  // 清理旧的 localStorage 版本号（防止遗留问题）
  useEffect(() => {
    localStorage.removeItem('meme_arena_topic_version');
  }, []);

  // 判断当前用户是否是管理员
  const isAdmin = useMemo(() => {
    return publicKey?.toString() === ADMIN_WALLET;
  }, [publicKey]);

  // Real Game Data State
  const [gameAccount, setGameAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [poolA, setPoolA] = useState(0);
  const [poolB, setPoolB] = useState(0);

  // 用户下注记录
  const [userBet, setUserBet] = useState<any>(null);

  // 是否正在结算
  const [isSettling, setIsSettling] = useState(false);
  const settleAttemptedRef = useRef(false); // 防止重复调用结算

  // 下注模态框状态
  const [betModal, setBetModal] = useState<{
    isOpen: boolean;
    team: 'A' | 'B';
  }>({
    isOpen: false,
    team: 'A',
  });

  // Derive Game PDA
  const gamePda = useMemo(() => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), Buffer.from(TOPIC)],
      PROGRAM_ID
    );
    return pda;
  }, [TOPIC]);

  // 获取阵营配置（从后端API）
  useEffect(() => {
    const loadArenaConfig = async () => {
      try {
        const config = await fetchTodayArenaConfig();
        setArenaConfig(config);
        console.log("阵营配置加载成功:", config);
      } catch (error) {
        console.error("加载阵营配置失败:", error);
      }
    };
    loadArenaConfig();
  }, []);

  // Fetch Game State 首先获取game的PDA
  const fetchGameState = async () => {
    if (!program) return;
    try {
      const account = await program.account.game.fetch(gamePda);
      setGameAccount(account);
      console.log("Game fetched:", account);
      // pub struct Game {
      //     pub authority: Pubkey,   // 32 bytes: 管理员公钥
      //     pub topic: String,       // 4 + len: 游戏主题 (如 "Kun vs Fan")
      //     pub deadline: i64,       // 8 bytes: 结束时间戳
      //     pub total_pool_a: u64,   // 8 bytes: A 队资金池总额
      //     pub total_pool_b: u64,   // 8 bytes: B 队资金池总额
      //     pub fee_vault: Pubkey,   // 32 bytes: 手续费接收地址
      //     pub status: GameStatus,  // 1 byte: 游戏状态
      //     pub winner: Option<Side>,// 2 bytes: 获胜方 (TeamA=0, TeamB=1)
      // }
      // Update Pools (Convert Lamports to SOL)
      setPoolA(account.totalPoolA.toNumber() / 1e9);
      setPoolB(account.totalPoolB.toNumber() / 1e9);
    } catch (e) {
      console.log("Game not initialized or error:", e);
      setGameAccount(null);
    }
  };

  // 获取用户下注信息
  const fetchUserBet = useCallback(async () => {
    if (!program || !publicKey) {
      setUserBet(null);
      return;
    }

    try {
      const [betPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), gamePda.toBuffer(), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const bet = await program.account.bet.fetch(betPda);
      setUserBet(bet);
      console.log("User bet fetched:", bet);
    } catch (e) {
      // 用户未下注
      setUserBet(null);
    }
  }, [program, publicKey, gamePda]);

  // Initial Fetch & Poll
  useEffect(() => {
    fetchGameState();
    fetchUserBet();
    const interval = setInterval(() => {
      fetchGameState();
      fetchUserBet();
    }, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [program, gamePda, publicKey]);

  // 自动结算函数
  const handleAutoSettle = useCallback(async () => {
    if (!program || !publicKey || !gameAccount) return;
    if (settleAttemptedRef.current) return; // 防止重复调用

    // 检查游戏状态
    const isOpen = gameAccount.status?.open !== undefined;
    if (!isOpen) return;

    // 检查是否到达 deadline
    const now = Math.floor(Date.now() / 1000);
    const deadline = gameAccount.deadline?.toNumber?.() || 0;
    if (now < deadline) return;

    settleAttemptedRef.current = true;
    setIsSettling(true);

    try {
      console.log("触发自动结算...");

      // 获取 fee_vault 地址
      const feeVault = gameAccount.feeVault;

      const tx = await program.methods
        .autoSettleGame()
        .accounts({
          game: gamePda,
          feeVault: feeVault,
          caller: publicKey,
        })
        .rpc();

      console.log("自动结算成功!", tx);
      showToast("战斗结束！正在计算胜者...", "success");

      // 刷新游戏状态
      await fetchGameState();
      await fetchUserBet();
    } catch (e: any) {
      console.error("自动结算失败:", e);
      const errorStr = e.toString();

      // 如果是已经结算的错误，静默处理
      if (errorStr.includes("GameAlreadySettled") || errorStr.includes("already")) {
        console.log("游戏已经结算过了");
        await fetchGameState();
      } else {
        showToast(`结算失败: ${e.message || '未知错误'}`, "error");
      }
    } finally {
      setIsSettling(false);
    }
  }, [program, publicKey, gameAccount, gamePda, showToast, fetchGameState, fetchUserBet]);

  // 检测并自动触发结算
  useEffect(() => {
    if (!gameAccount) return;

    const checkAndSettle = () => {
      const isOpen = gameAccount.status?.open !== undefined;
      if (!isOpen) return;

      const now = Math.floor(Date.now() / 1000);
      const deadline = gameAccount.deadline?.toNumber?.() || 0;

      // 如果到了 deadline 且游戏还是 Open 状态
      if (now >= deadline) {
        handleAutoSettle();
      }
    };

    // 立即检查一次
    checkAndSettle();

    // 每10秒检查一次
    const interval = setInterval(checkAndSettle, 10000);
    return () => clearInterval(interval);
  }, [gameAccount, handleAutoSettle]);

  // 当游戏改变时重置结算标记
  useEffect(() => {
    settleAttemptedRef.current = false;
  }, [gamePda]);


  // Initialize Game (For Admin/Testing)
  const handleInitialize = async () => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);

      // 设置今天晚上8点为 deadline
      const now = new Date();
      const todayDeadline = new Date(now);
      todayDeadline.setHours(20, 0, 0, 0); // 晚上8点

      // 如果现在已经过了8点，设置为明天8点
      if (now >= todayDeadline) {
        todayDeadline.setDate(todayDeadline.getDate() + 1);
      }

      const deadline = new BN(Math.floor(todayDeadline.getTime() / 1000));

      await program.methods
        .initializeGame(TOPIC, deadline)
        .accounts({
          authority: publicKey,
          // other accounts inferred by Anchor
        })
        .rpc();

      console.log("Game Initialized!");
      showToast("战场初始化成功！今晚8点结算！", "success");
      await fetchGameState();
    } catch (error: any) {
      console.error("Init failed:", error);
      showToast(`初始化失败: ${error.message || error}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // 领取奖励
  const handleClaimReward = useCallback(async () => {
    if (!program || !publicKey || !userBet) return;

    try {
      setLoading(true);

      const tx = await program.methods
        .claimReward()
        .accounts({
          game: gamePda,
          user: publicKey,
        })
        .rpc();

      console.log("奖励领取成功!", tx);
      showToast("恭喜！奖励已发送到你的钱包！", "success");

      // 刷新用户下注状态
      await fetchUserBet();
    } catch (e: any) {
      console.error("领取奖励失败:", e);
      const errorStr = e.toString();

      if (errorStr.includes("AlreadyClaimed") || errorStr.includes("already claimed")) {
        showToast("你已经领取过奖励了！", "warning");
      } else if (errorStr.includes("NotWinner")) {
        showToast("只有赢家才能领取奖励哦~", "error");
      } else {
        showToast(`领取失败: ${e.message || '未知错误'}`, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, userBet, gamePda, showToast, fetchUserBet]);

  // 手动结算（测试用）
  const handleManualSettle = useCallback(async () => {
    if (!program || !publicKey || !gameAccount) return;

    try {
      setLoading(true);
      const feeVault = gameAccount.feeVault;

      await program.methods
        .settleGame()
        .accounts({
          game: gamePda,
          feeVault: feeVault,
        })
        .rpc();

      console.log("手动结算成功!");
      showToast("手动结算成功！", "success");
      await fetchGameState();
      await fetchUserBet();
    } catch (e: any) {
      console.error("手动结算失败:", e);
      showToast(`结算失败: ${e.message || '未知错误'}`, "error");
    } finally {
      setLoading(false);
    }
  }, [program, publicKey, gameAccount, gamePda, showToast, fetchGameState, fetchUserBet]);

  // 核心战场组件
  // 我们需要把下注函数传递给 Arena，或者在这里处理
  // 但为了保留 Arena 的 UI 纯度，我们可以把 Pool 数据传进去

  // 我们暂时不直接传 handleBet 给 Arena，因为 Arena 内部没有输入框
  // 但 Arena 里的按钮需要触发下注。
  // 简单起见，我们在 Arena 里加一个简单的 prompt 或者固定金额 (e.g. 0.1 SOL)
  // 或者在 App 里弹窗。
  // 为了 Vibe，直接点按钮 -> 弹窗确认金额 (0.1 SOL for MVP)。

  // 打开下注模态框
  const handleBet = (team: "A" | "B") => {
    if (!program || !publicKey) {
      showToast("请先连接钱包！", "warning");
      return;
    }
    setBetModal({ isOpen: true, team });
  };

  // 关闭下注模态框
  const closeBetModal = () => {
    setBetModal(prev => ({ ...prev, isOpen: false }));
  };

  // 执行下注
  const executeBet = useCallback(async (amountSOL: number) => {
    if (!program || !publicKey) return;

    const team = betModal.team;
    const teamName = team === "A" ? arenaConfig.team_a.name : arenaConfig.team_b.name;
    const amountLamports = new BN(amountSOL * 1e9);
    const side = team === "A" ? { teamA: {} } : { teamB: {} };

    closeBetModal();

    try {
      const tx = await program.methods
        .placeBet(side, amountLamports)
        .accounts({
          user: publicKey,
          game: gamePda
        })
        .rpc();
      console.log("Bet placed!", tx);
      showToast(`成功押注 ${amountSOL} SOL 给 ${teamName}！🚀 Vibe +10086`, "success");
      fetchGameState(); // Refresh immediately
    } catch (e: any) {
      console.error("Bet error:", e);
      const errorStr = e.toString();
      const errorMsg = e.message || '';

      // 检测重复下注错误：
      // 1. "already in use" - 账户已存在
      // 2. "0x0" - custom program error
      // 3. "0x1776" 或 "ConstraintSeeds" - Anchor约束错误
      if (
        errorStr.includes("already in use") ||
        errorStr.includes("custom program error: 0x0") ||
        errorMsg.includes("already in use") ||
        errorMsg.includes("0x1776") ||
        errorStr.includes("ConstraintSeeds")
      ) {
        showToast(`你已经给${teamName}下过注啦！每场游戏每人只能投一次哦～ 🎲`, "warning");
      } else if (errorStr.includes("insufficient") || errorStr.includes("Insufficient")) {
        showToast("钱包余额不足，请充值后再试！💸", "error");
      } else {
        showToast(`下注失败：${errorMsg || '未知错误'}`, "error");
      }
    }
  }, [program, publicKey, betModal.team, gamePda, showToast]);

  return (
    <div className="relative min-h-screen font-sans selection:bg-pink-500 selection:text-white pb-20 overflow-hidden" style={{ zoom: 0.8 }}>

      {/* Toast 提示组件 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={4000}
      />

      {/* 下注模态框 */}
      <BetModal
        isOpen={betModal.isOpen}
        team={betModal.team}
        teamName={betModal.team === 'A' ? arenaConfig.team_a.title : arenaConfig.team_b.title}
        onConfirm={executeBet}
        onCancel={closeBetModal}
      />

      {/* Vibe Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-neutral-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950" />
          <div className="absolute top-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHwid2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMCA0MEwwIDBMMTcwIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-30" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[128px]" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse" />
        </div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 text-white">

        {/* 弹幕层 */}
        <Danmaku />

        {/* 头部导航栏 */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎪</span>
            <h1 className="text-xl font-bold tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <WalletMultiButton style={{ backgroundColor: '#222', border: '1px solid #444' }} />
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="pt-24 px-4 container mx-auto flex flex-col items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-6 w-full">
            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter animate-pulse text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">
              {t('app.subtitle')}
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
              {t('app.description')}
              <br />
              <span className="text-xs text-gray-600">{t('app.vibe')}</span>
            </p>

            {/* 倒计时组件 */}
            {gameAccount && gameAccount.status?.open !== undefined && (
              <div className="mb-8">
                <Countdown
                  deadline={gameAccount.deadline?.toNumber?.() || 0}
                  onDeadlineReached={handleAutoSettle}
                />
              </div>
            )}

            {/* 结算中提示 */}
            {isSettling && (
              <div className="mb-8 p-4 border border-yellow-500/50 bg-yellow-900/20 rounded-xl animate-pulse">
                <p className="text-yellow-300 font-bold">{t('app.settling')}</p>
              </div>
            )}

            {/* 游戏未初始化提示 */}
            {!gameAccount && program && (
              <div className="mb-8 p-6 border border-purple-500/50 bg-purple-900/20 rounded-xl text-center">
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-xl font-bold text-purple-300 mb-2">
                  {isAdmin ? t('app.not_initialized', { topic: TOPIC }) : '游戏准备中...'}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {isAdmin 
                    ? '请点击下方按钮初始化今日战斗' 
                    : '管理员正在准备今日战斗，请稍候刷新页面'}
                </p>
                {isAdmin && (
                  <button
                    onClick={handleInitialize}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-white shadow-lg"
                  >
                    {loading ? t('app.init_loading') : '🚀 开始今日战斗'}
                  </button>
                )}
              </div>
            )}

            {/* 管理员工具（仅管理员可见） */}
            {isAdmin && gameAccount && (
              <div className="mb-4 p-4 border border-yellow-500/50 bg-yellow-900/20 rounded-xl">
                <p className="text-yellow-300 text-sm mb-2">{t('app.admin_tools', { topic: TOPIC })}</p>
                <div className="flex gap-2 flex-wrap items-center">
                  {/* 游戏进行中：显示手动结算按钮 */}
                  {gameAccount.status?.open !== undefined && (
                    <button
                      onClick={handleManualSettle}
                      disabled={loading}
                      className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold text-sm"
                    >
                      {loading ? t('app.settle_loading') : t('app.manual_settle')}
                    </button>
                  )}
                  {/* 游戏已结算：直接开始新游戏（需要先在后台修改版本号） */}
                  {gameAccount.status?.settled !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm">✅ 游戏已结算</span>
                      <span className="text-gray-400 text-sm">→</span>
                      <button
                        onClick={handleInitialize}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold text-sm text-white"
                      >
                        {loading ? '初始化中...' : '🚀 开始新游戏'}
                      </button>
                    </div>
                  )}
                  <span className="text-gray-500 text-xs ml-2">
                    (当前版本: v{arenaConfig.topic_version || 0})
                  </span>
                </div>
              </div>
            )}

            {/* 核心战场组件 */}
            <Arena
              poolA={poolA}
              poolB={poolB}
              topic={TOPIC}
              onBet={handleBet}
              isSettled={gameAccount?.status?.settled !== undefined}
              winner={
                gameAccount?.winner?.teamA !== undefined ? "A" :
                  gameAccount?.winner?.teamB !== undefined ? "B" : null
              }
              userBetSide={
                userBet?.side?.teamA !== undefined ? "A" :
                  userBet?.side?.teamB !== undefined ? "B" : null
              }
              onClaim={handleClaimReward}
              hasClaimed={userBet?.claimed || false}
              isLoading={loading}
              arenaConfig={arenaConfig}
            />

            {/* 调试信息 (Optional) */}
            {/* <div className="mt-8 text-xs text-gray-700">
                Game PDA: {gamePda.toString()}
             </div> */}

          </div>
        </main>

      </div>
    </div>
  )
}

function App() {
  return (
    <WalletContextProvider>
      <GameContent />
    </WalletContextProvider>
  )
}


export default App
