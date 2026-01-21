import { useEffect, useState, useMemo, useCallback } from 'react'
import { WalletContextProvider } from './contexts/WalletContextProvider'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Arena } from './components/Arena'
import { Danmaku } from './components/Danmaku'
import { Toast, useToast } from './components/Toast'
import { BetModal } from './components/BetModal'
import { useMemeArenaProgram, PROGRAM_ID } from './utils/anchor'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { useWallet } from '@solana/wallet-adapter-react'

// Game Configuration
const TOPIC = "AbstractMemeArena";

function GameContent() {
  const { publicKey } = useWallet();
  const program = useMemeArenaProgram();
  const { toast, showToast, hideToast } = useToast();

  // Real Game Data State
  const [gameAccount, setGameAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [poolA, setPoolA] = useState(0);
  const [poolB, setPoolB] = useState(0);

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
  }, []);

  // Fetch Game State
  const fetchGameState = async () => {
    if (!program) return;
    try {
      // @ts-ignore
      const account = await program.account.game.fetch(gamePda);
      setGameAccount(account);
      console.log("Game fetched:", account);

      // Update Pools (Convert Lamports to SOL)
      setPoolA(account.totalPoolA.toNumber() / 1e9);
      setPoolB(account.totalPoolB.toNumber() / 1e9);
    } catch (e) {
      console.log("Game not initialized or error:", e);
      setGameAccount(null);
    }
  };

  // Initial Fetch & Poll
  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [program, gamePda]);


  // Initialize Game (For Admin/Testing)
  const handleInitialize = async () => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);
      const now = new Date();
      // Deadline: 1 hour from now
      const deadline = new BN(Math.floor(now.getTime() / 1000) + 3600);

      await program.methods
        .initializeGame(TOPIC, deadline)
        .accounts({
          authority: publicKey,
          // other accounts inferred by Anchor
        })
        .rpc();

      console.log("Game Initialized!");
      showToast("战场初始化成功！⚔️ 开始战斗吧！", "success");
      await fetchGameState();
    } catch (error: any) {
      console.error("Init failed:", error);
      showToast(`初始化失败: ${error.message || error}`, "error");
    } finally {
      setLoading(false);
    }
  };

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
    const teamName = team === "A" ? "练习生" : "挖掘机";
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
        teamName={betModal.team === 'A' ? '练习生' : '挖掘机'}
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
              Meme 竞技场
            </h1>
          </div>
          <div>
            <WalletMultiButton style={{ backgroundColor: '#222', border: '1px solid #444' }} />
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="pt-24 px-4 container mx-auto flex flex-col items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-6 w-full">
            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter animate-pulse text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">
              抽象大乱斗
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
              选择你的阵营。下注 SOL。赢家通吃。
              <br />
              <span className="text-xs text-gray-600">（纯粹 Vibe。莫得逻辑。）</span>
            </p>

            {/* Initialize Button (Only if game not found) */}
            {!gameAccount && program && (
              <div className="mb-8 p-4 border border-red-500/50 bg-red-900/20 rounded-xl">
                <p className="mb-2 text-red-300">⚠️ 系统检测到当前 Topic "{TOPIC}" 尚未初始化</p>
                <button
                  onClick={handleInitialize}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded font-bold"
                >
                  {loading ? "初始化中..." : "⚔️ 初始化战场 (Devnet)"}
                </button>
              </div>
            )}

            {/* 核心战场组件 */}
            <Arena
              poolA={poolA}
              poolB={poolB}
              topic={TOPIC}
              onBet={handleBet}
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
