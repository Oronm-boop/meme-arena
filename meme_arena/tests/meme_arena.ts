/*
import { LiteSVM } from "litesvm";
import {
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { expect } from "chai";
import * as borsh from "@coral-xyz/borsh";
import BN from "bn.js";

// ========== 常量定义 ==========

// 程序 ID（与合约中的 declare_id! 一致）
const PROGRAM_ID = new PublicKey("3SFNAgqxdxamXWyn5CbQ5pJ9L27nE1dm8iFY1sBnpQMC");

// 管理员公钥（合约中硬编码的）
const ADMIN_PUBKEY = new PublicKey("ykLHN2JeHCanSKN7Rfzzj9tAW7R1APoeq9rN5DZaLjZ");

// 程序 .so 文件路径
const PROGRAM_SO_PATH = "target/deploy/meme_arena.so";

// ========== Borsh 序列化/反序列化 ==========

// 指令 discriminator（从 IDL 获取）
const DISCRIMINATORS = {
  initializeGame: Buffer.from([44, 62, 102, 247, 126, 208, 130, 215]),
  placeBet: Buffer.from([222, 62, 67, 220, 63, 166, 126, 33]),
  settleGame: Buffer.from([96, 54, 24, 189, 239, 198, 86, 29]),
  autoSettleGame: Buffer.from([145, 31, 128, 151, 139, 140, 113, 160]),
  claimReward: Buffer.from([149, 95, 181, 242, 94, 90, 158, 162]),
};

// 账户 discriminator
const ACCOUNT_DISCRIMINATORS = {
  game: Buffer.from([27, 90, 166, 125, 74, 100, 121, 18]),
  bet: Buffer.from([147, 23, 35, 59, 15, 75, 155, 32]),
};

// Side 枚举（使用常量对象替代 enum）
const Side = {
  TeamA: 0,
  TeamB: 1,
} as const;

type Side = typeof Side[keyof typeof Side];

// GameStatus 枚举（使用常量对象替代 enum）
const GameStatus = {
  Open: 0,
  Settled: 1,
} as const;

type GameStatus = typeof GameStatus[keyof typeof GameStatus];

// Game 账户数据结构
interface GameAccount {
  authority: PublicKey;
  topic: string;
  deadline: BN;
  totalPoolA: BN;
  totalPoolB: BN;
  feeVault: PublicKey;
  status: GameStatus;
  winner: Side | null;
}

// Bet 账户数据结构
interface BetAccount {
  user: PublicKey;
  game: PublicKey;
  amount: BN;
  side: Side;
  claimed: boolean;
}

// Game 账户 Borsh 布局
const gameAccountLayout = borsh.struct([
  borsh.publicKey("authority"),
  borsh.str("topic"),
  borsh.i64("deadline"),
  borsh.u64("totalPoolA"),
  borsh.u64("totalPoolB"),
  borsh.publicKey("feeVault"),
  borsh.u8("status"),
  borsh.option(borsh.u8(), "winner"),
]);

// Bet 账户 Borsh 布局
const betAccountLayout = borsh.struct([
  borsh.publicKey("user"),
  borsh.publicKey("game"),
  borsh.u64("amount"),
  borsh.u8("side"),
  borsh.bool("claimed"),
]);

// ========== 辅助函数 ==========

/!**
 * 从环境变量加载管理员私钥
 *!/
function loadAdminKeypair(): Keypair {
  const secretKeyJson = process.env.ADMIN_SECRET_KEY;
  if (!secretKeyJson) {
    throw new Error("环境变量 ADMIN_SECRET_KEY 未设置！请设置管理员私钥。");
  }
  try {
    const secretKey = Uint8Array.from(JSON.parse(secretKeyJson));
    return Keypair.fromSecretKey(secretKey);
  } catch (e) {
    throw new Error(`解析 ADMIN_SECRET_KEY 失败: ${e}`);
  }
}

/!**
 * 计算 Game PDA
 *!/
function findGamePda(topic: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("game"), Buffer.from(topic)],
    PROGRAM_ID
  );
}

/!**
 * 计算 Vault PDA
 *!/
function findVaultPda(gamePda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), gamePda.toBuffer()],
    PROGRAM_ID
  );
}

/!**
 * 计算 Bet PDA
 *!/
function findBetPda(gamePda: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), gamePda.toBuffer(), user.toBuffer()],
    PROGRAM_ID
  );
}

/!**
 * 创建 InitializeGame 指令
 *!/
function createInitializeGameInstruction(
  gamePda: PublicKey,
  vaultPda: PublicKey,
  authority: PublicKey,
  topic: string,
  deadline: BN
): TransactionInstruction {
  // 序列化参数
  const topicBuffer = Buffer.from(topic);
  const argsLayout = borsh.struct([
    borsh.str("topic"),
    borsh.i64("deadline"),
  ]);
  
  const argsData = Buffer.alloc(1000);
  const argsLen = argsLayout.encode({ topic, deadline }, argsData);
  
  const data = Buffer.concat([
    DISCRIMINATORS.initializeGame,
    argsData.slice(0, argsLen),
  ]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/!**
 * 创建 PlaceBet 指令
 *!/
function createPlaceBetInstruction(
  gamePda: PublicKey,
  betPda: PublicKey,
  vaultPda: PublicKey,
  user: PublicKey,
  side: Side,
  amount: BN
): TransactionInstruction {
  const argsLayout = borsh.struct([
    borsh.u8("side"),
    borsh.u64("amount"),
  ]);
  
  const argsData = Buffer.alloc(100);
  const argsLen = argsLayout.encode({ side, amount }, argsData);
  
  const data = Buffer.concat([
    DISCRIMINATORS.placeBet,
    argsData.slice(0, argsLen),
  ]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePda, isSigner: false, isWritable: true },
      { pubkey: betPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/!**
 * 创建 SettleGame 指令
 *!/
function createSettleGameInstruction(
  gamePda: PublicKey,
  vaultPda: PublicKey,
  feeVault: PublicKey,
  authority: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: feeVault, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATORS.settleGame,
  });
}

/!**
 * 创建 AutoSettleGame 指令
 *!/
function createAutoSettleGameInstruction(
  gamePda: PublicKey,
  vaultPda: PublicKey,
  feeVault: PublicKey,
  caller: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: feeVault, isSigner: false, isWritable: true },
      { pubkey: caller, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATORS.autoSettleGame,
  });
}

/!**
 * 创建 ClaimReward 指令
 *!/
function createClaimRewardInstruction(
  gamePda: PublicKey,
  betPda: PublicKey,
  vaultPda: PublicKey,
  user: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePda, isSigner: false, isWritable: true },
      { pubkey: betPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATORS.claimReward,
  });
}

/!**
 * 解析 Game 账户数据
 *!/
function parseGameAccount(data: Buffer): GameAccount {
  // 跳过 8 字节的 discriminator
  const accountData = data.slice(8);
  const decoded = gameAccountLayout.decode(accountData);
  return {
    authority: decoded.authority,
    topic: decoded.topic,
    deadline: decoded.deadline,
    totalPoolA: decoded.totalPoolA,
    totalPoolB: decoded.totalPoolB,
    feeVault: decoded.feeVault,
    status: decoded.status as GameStatus,
    winner: decoded.winner !== null ? (decoded.winner as Side) : null,
  };
}

/!**
 * 解析 Bet 账户数据
 *!/
function parseBetAccount(data: Buffer): BetAccount {
  // 跳过 8 字节的 discriminator
  const accountData = data.slice(8);
  const decoded = betAccountLayout.decode(accountData);
  return {
    user: decoded.user,
    game: decoded.game,
    amount: decoded.amount,
    side: decoded.side as Side,
    claimed: decoded.claimed,
  };
}

/!**
 * 设置账户余额
 *!/
function setAccountBalance(svm: LiteSVM, pubkey: PublicKey, lamports: number) {
  svm.setAccount(pubkey, {
    lamports: BigInt(lamports) as any, // LiteSVM 期望 bigint
    data: Buffer.alloc(0),
    owner: SystemProgram.programId,
    executable: false,
  });
}

/!**
 * 发送并确认交易
 *!/
function sendAndConfirmTransaction(
  svm: LiteSVM,
  tx: Transaction,
  signers: Keypair[]
): { success: boolean; logs: string[]; error?: string } {
  tx.recentBlockhash = svm.latestBlockhash();
  tx.feePayer = signers[0].publicKey;
  tx.sign(...signers);

  try {
    const result = svm.sendTransaction(tx);
    return {
      success: true,
      logs: (result as any).logs || [],
    };
  } catch (e: any) {
    return {
      success: false,
      logs: [],
      error: e.message || String(e),
    };
  }
}

// ========== 测试套件 ==========

describe("meme_arena LiteSVM 测试", () => {
  let svm: LiteSVM;
  let admin: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  
  const topic = "TestGame_" + Date.now(); // 唯一的游戏主题
  let gamePda: PublicKey;
  let gameBump: number;
  let vaultPda: PublicKey;
  let vaultBump: number;
  
  // 游戏参数
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时后

  before(() => {
    console.log("\n========== 初始化测试环境 ==========\n");
    
    // 1. 加载管理员私钥
    admin = loadAdminKeypair();
    console.log(`✅ 管理员公钥: ${admin.publicKey.toBase58()}`);
    
    // 验证管理员公钥与合约中的一致
    if (!admin.publicKey.equals(ADMIN_PUBKEY)) {
      throw new Error(
        `管理员公钥不匹配！\n` +
        `  期望: ${ADMIN_PUBKEY.toBase58()}\n` +
        `  实际: ${admin.publicKey.toBase58()}`
      );
    }
    console.log("✅ 管理员公钥验证通过");

    // 2. 创建测试用户
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    console.log(`✅ 用户1公钥: ${user1.publicKey.toBase58()}`);
    console.log(`✅ 用户2公钥: ${user2.publicKey.toBase58()}`);

    // 3. 计算 PDA
    [gamePda, gameBump] = findGamePda(topic);
    [vaultPda, vaultBump] = findVaultPda(gamePda);
    console.log(`✅ Game PDA: ${gamePda.toBase58()}`);
    console.log(`✅ Vault PDA: ${vaultPda.toBase58()}`);

    // 4. 创建 LiteSVM 实例
    svm = new LiteSVM();
    console.log("✅ LiteSVM 实例创建成功");

    // 5. 加载程序
    svm.addProgramFromFile(PROGRAM_ID, PROGRAM_SO_PATH);
    console.log(`✅ 程序加载成功: ${PROGRAM_ID.toBase58()}`);

    // 6. 给账户充值
    const fundAmount = 10 * LAMPORTS_PER_SOL;
    setAccountBalance(svm, admin.publicKey, fundAmount);
    setAccountBalance(svm, user1.publicKey, fundAmount);
    setAccountBalance(svm, user2.publicKey, fundAmount);
    console.log(`✅ 账户充值完成: 每人 ${fundAmount / LAMPORTS_PER_SOL} SOL`);
    
    console.log("\n========== 测试环境初始化完成 ==========\n");
  });

  // ========== 初始化游戏测试 ==========

  describe("1. 初始化游戏", () => {
    it("1.1 非管理员初始化游戏应该失败", () => {
      const tx = new Transaction();
      tx.add(
        createInitializeGameInstruction(
          gamePda,
          vaultPda,
          user1.publicKey, // 使用非管理员
          topic,
          new BN(deadline)
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [user1]);
      
      expect(result.success).to.be.false;
      console.log("✅ 非管理员初始化失败（预期行为）");
      console.log(`   错误信息: ${result.error}`);
    });

    it("1.2 管理员初始化游戏应该成功", () => {
      const tx = new Transaction();
      tx.add(
        createInitializeGameInstruction(
          gamePda,
          vaultPda,
          admin.publicKey,
          topic,
          new BN(deadline)
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [admin]);
      
      expect(result.success).to.be.true;
      console.log("✅ 管理员初始化成功");
      
      // 验证游戏账户数据
      const gameAccountInfo = svm.getAccount(gamePda);
      expect(gameAccountInfo).to.not.be.null;
      
      const gameData = parseGameAccount(Buffer.from(gameAccountInfo!.data));
      expect(gameData.authority.toBase58()).to.equal(admin.publicKey.toBase58());
      expect(gameData.topic).to.equal(topic);
      expect(gameData.status).to.equal(GameStatus.Open);
      expect(gameData.totalPoolA.toNumber()).to.equal(0);
      expect(gameData.totalPoolB.toNumber()).to.equal(0);
      console.log("✅ 游戏账户数据验证通过");
    });
  });

  // ========== 下注测试 ==========

  describe("2. 下注功能", () => {
    const betAmountA = 0.1 * LAMPORTS_PER_SOL; // 用户1 下注 0.1 SOL
    const betAmountB = 0.05 * LAMPORTS_PER_SOL; // 用户2 下注 0.05 SOL

    it("2.1 用户1 下注 TeamA 应该成功", () => {
      const [betPda] = findBetPda(gamePda, user1.publicKey);
      
      const tx = new Transaction();
      tx.add(
        createPlaceBetInstruction(
          gamePda,
          betPda,
          vaultPda,
          user1.publicKey,
          Side.TeamA,
          new BN(betAmountA)
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [user1]);
      
      expect(result.success).to.be.true;
      console.log(`✅ 用户1 下注 TeamA ${betAmountA / LAMPORTS_PER_SOL} SOL 成功`);
      
      // 验证 Game 账户更新
      const gameAccountInfo = svm.getAccount(gamePda);
      const gameData = parseGameAccount(Buffer.from(gameAccountInfo!.data));
      expect(gameData.totalPoolA.toNumber()).to.equal(betAmountA);
      console.log(`   Pool A: ${gameData.totalPoolA.toNumber() / LAMPORTS_PER_SOL} SOL`);
      
      // 验证 Bet 账户
      const betAccountInfo = svm.getAccount(betPda);
      expect(betAccountInfo).to.not.be.null;
      const betData = parseBetAccount(Buffer.from(betAccountInfo!.data));
      expect(betData.side).to.equal(Side.TeamA);
      expect(betData.amount.toNumber()).to.equal(betAmountA);
      expect(betData.claimed).to.be.false;
      console.log("✅ Bet 账户验证通过");
    });

    it("2.2 用户2 下注 TeamB 应该成功", () => {
      const [betPda] = findBetPda(gamePda, user2.publicKey);
      
      const tx = new Transaction();
      tx.add(
        createPlaceBetInstruction(
          gamePda,
          betPda,
          vaultPda,
          user2.publicKey,
          Side.TeamB,
          new BN(betAmountB)
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [user2]);
      
      expect(result.success).to.be.true;
      console.log(`✅ 用户2 下注 TeamB ${betAmountB / LAMPORTS_PER_SOL} SOL 成功`);
      
      // 验证 Game 账户更新
      const gameAccountInfo = svm.getAccount(gamePda);
      const gameData = parseGameAccount(Buffer.from(gameAccountInfo!.data));
      expect(gameData.totalPoolB.toNumber()).to.equal(betAmountB);
      console.log(`   Pool A: ${gameData.totalPoolA.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`   Pool B: ${gameData.totalPoolB.toNumber() / LAMPORTS_PER_SOL} SOL`);
    });

    it("2.3 验证 Vault 收到资金", () => {
      const vaultBalance = svm.getBalance(vaultPda);
      const expectedBalance = betAmountA + betAmountB;
      
      expect(Number(vaultBalance)).to.equal(expectedBalance);
      console.log(`✅ Vault 余额正确: ${Number(vaultBalance) / LAMPORTS_PER_SOL} SOL`);
    });
  });

  // ========== 结算测试 ==========

  describe("3. 结算功能", () => {
    it("3.1 非管理员结算应该失败", () => {
      const tx = new Transaction();
      tx.add(
        createSettleGameInstruction(
          gamePda,
          vaultPda,
          admin.publicKey, // fee_vault 是管理员
          user1.publicKey // 非管理员尝试结算
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [user1]);
      
      expect(result.success).to.be.false;
      console.log("✅ 非管理员结算失败（预期行为）");
    });

    it("3.2 管理员结算应该成功", () => {
      // 记录结算前的余额
      const adminBalanceBefore = svm.getBalance(admin.publicKey);
      const vaultBalanceBefore = svm.getBalance(vaultPda);
      
      const tx = new Transaction();
      tx.add(
        createSettleGameInstruction(
          gamePda,
          vaultPda,
          admin.publicKey, // fee_vault
          admin.publicKey // 管理员
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [admin]);
      
      expect(result.success).to.be.true;
      console.log("✅ 管理员结算成功");
      
      // 验证游戏状态
      const gameAccountInfo = svm.getAccount(gamePda);
      const gameData = parseGameAccount(Buffer.from(gameAccountInfo!.data));
      expect(gameData.status).to.equal(GameStatus.Settled);
      expect(gameData.winner).to.equal(Side.TeamA); // Pool A > Pool B，所以 TeamA 赢
      console.log(`   赢家: TeamA (Pool A: ${gameData.totalPoolA.toNumber() / LAMPORTS_PER_SOL} SOL > Pool B: ${gameData.totalPoolB.toNumber() / LAMPORTS_PER_SOL} SOL)`);
      
      // 验证手续费
      const totalPool = gameData.totalPoolA.toNumber() + gameData.totalPoolB.toNumber();
      const expectedFee = Math.floor(totalPool * 0.05);
      const adminBalanceAfter = svm.getBalance(admin.publicKey);
      
      // 管理员收到手续费（减去交易费）
      console.log(`   总奖池: ${totalPool / LAMPORTS_PER_SOL} SOL`);
      console.log(`   预期手续费 (5%): ${expectedFee / LAMPORTS_PER_SOL} SOL`);
      console.log(`   管理员余额变化: ${(Number(adminBalanceAfter) - Number(adminBalanceBefore)) / LAMPORTS_PER_SOL} SOL`);
    });

    it("3.3 重复结算应该失败", () => {
      const tx = new Transaction();
      tx.add(
        createSettleGameInstruction(
          gamePda,
          vaultPda,
          admin.publicKey,
          admin.publicKey
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [admin]);
      
      expect(result.success).to.be.false;
      console.log("✅ 重复结算失败（预期行为）");
    });
  });

  // ========== 领奖测试 ==========

  describe("4. 领奖功能", () => {
    it("4.1 输家（用户2/TeamB）领奖应该失败", () => {
      const [betPda] = findBetPda(gamePda, user2.publicKey);
      
      const tx = new Transaction();
      tx.add(
        createClaimRewardInstruction(
          gamePda,
          betPda,
          vaultPda,
          user2.publicKey
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [user2]);
      
      expect(result.success).to.be.false;
      console.log("✅ 输家领奖失败（预期行为）");
    });

    it("4.2 赢家（用户1/TeamA）领奖应该成功", () => {
      const [betPda] = findBetPda(gamePda, user1.publicKey);
      const user1BalanceBefore = svm.getBalance(user1.publicKey);
      
      const tx = new Transaction();
      tx.add(
        createClaimRewardInstruction(
          gamePda,
          betPda,
          vaultPda,
          user1.publicKey
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [user1]);
      
      expect(result.success).to.be.true;
      console.log("✅ 赢家领奖成功");
      
      const user1BalanceAfter = svm.getBalance(user1.publicKey);
      const reward = Number(user1BalanceAfter) - Number(user1BalanceBefore);
      console.log(`   用户1 获得奖励: ${reward / LAMPORTS_PER_SOL} SOL`);
      
      // 验证 Bet 账户标记为已领取
      const betAccountInfo = svm.getAccount(betPda);
      const betData = parseBetAccount(Buffer.from(betAccountInfo!.data));
      expect(betData.claimed).to.be.true;
      console.log("✅ Bet 账户已标记为已领取");
    });

    it("4.3 重复领奖应该失败", () => {
      const [betPda] = findBetPda(gamePda, user1.publicKey);
      
      const tx = new Transaction();
      tx.add(
        createClaimRewardInstruction(
          gamePda,
          betPda,
          vaultPda,
          user1.publicKey
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [user1]);
      
      expect(result.success).to.be.false;
      console.log("✅ 重复领奖失败（预期行为）");
    });
  });

  // ========== 自动结算测试 ==========

  describe("5. 自动结算功能", () => {
    // 使用新的游戏主题
    const autoTopic = "AutoSettle_" + Date.now();
    let autoGamePda: PublicKey;
    let autoVaultPda: PublicKey;
    const autoDeadline = Math.floor(Date.now() / 1000) + 100; // 100秒后

    before(() => {
      [autoGamePda] = findGamePda(autoTopic);
      [autoVaultPda] = findVaultPda(autoGamePda);
      
      // 初始化新游戏
      const initTx = new Transaction();
      initTx.add(
        createInitializeGameInstruction(
          autoGamePda,
          autoVaultPda,
          admin.publicKey,
          autoTopic,
          new BN(autoDeadline)
        )
      );
      
      const initResult = sendAndConfirmTransaction(svm, initTx, [admin]);
      expect(initResult.success).to.be.true;
      console.log(`\n✅ 自动结算测试：新游戏初始化成功 (deadline: ${autoDeadline})`);
      
      // 用户下注
      const [betPda] = findBetPda(autoGamePda, user1.publicKey);
      const betTx = new Transaction();
      betTx.add(
        createPlaceBetInstruction(
          autoGamePda,
          betPda,
          autoVaultPda,
          user1.publicKey,
          Side.TeamA,
          new BN(0.1 * LAMPORTS_PER_SOL)
        )
      );
      
      const betResult = sendAndConfirmTransaction(svm, betTx, [user1]);
      expect(betResult.success).to.be.true;
      console.log("✅ 用户1 下注成功");
    });

    it("5.1 deadline 之前自动结算应该失败", () => {
      // 设置时钟到 deadline 之前
      const clock = svm.getClock();
      clock.unixTimestamp = BigInt(autoDeadline - 10);
      svm.setClock(clock);
      
      const tx = new Transaction();
      tx.add(
        createAutoSettleGameInstruction(
          autoGamePda,
          autoVaultPda,
          admin.publicKey, // fee_vault
          user2.publicKey // 任何人都可以调用
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [user2]);
      
      expect(result.success).to.be.false;
      console.log("✅ deadline 之前自动结算失败（预期行为）");
    });

    it("5.2 deadline 之后任何人都可以自动结算", () => {
      // 设置时钟到 deadline 之后
      const clock = svm.getClock();
      clock.unixTimestamp = BigInt(autoDeadline + 10);
      svm.setClock(clock);
      
      const tx = new Transaction();
      tx.add(
        createAutoSettleGameInstruction(
          autoGamePda,
          autoVaultPda,
          admin.publicKey, // fee_vault
          user2.publicKey // 非管理员调用
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [user2]);
      
      expect(result.success).to.be.true;
      console.log("✅ deadline 之后自动结算成功（任何人都可以调用）");
      
      // 验证游戏状态
      const gameAccountInfo = svm.getAccount(autoGamePda);
      const gameData = parseGameAccount(Buffer.from(gameAccountInfo!.data));
      expect(gameData.status).to.equal(GameStatus.Settled);
      console.log(`   游戏状态: Settled`);
    });
  });

  // ========== 边界情况测试 ==========

  describe("6. 边界情况", () => {
    it("6.1 游戏结束后下注应该失败", () => {
      // 使用已结算的游戏
      const [betPda] = findBetPda(gamePda, Keypair.generate().publicKey);
      const newUser = Keypair.generate();
      setAccountBalance(svm, newUser.publicKey, 10 * LAMPORTS_PER_SOL);
      
      // 重新计算 bet PDA
      const [newBetPda] = findBetPda(gamePda, newUser.publicKey);
      
      const tx = new Transaction();
      tx.add(
        createPlaceBetInstruction(
          gamePda,
          newBetPda,
          vaultPda,
          newUser.publicKey,
          Side.TeamA,
          new BN(0.1 * LAMPORTS_PER_SOL)
        )
      );

      const result = sendAndConfirmTransaction(svm, tx, [newUser]);
      
      expect(result.success).to.be.false;
      console.log("✅ 游戏结束后下注失败（预期行为）");
    });
  });

  // ========== 最终状态输出 ==========

  after(() => {
    console.log("\n========== 测试完成 ==========\n");
    console.log("最终账户余额:");
    console.log(`  管理员: ${Number(svm.getBalance(admin.publicKey)) / LAMPORTS_PER_SOL} SOL`);
    console.log(`  用户1:  ${Number(svm.getBalance(user1.publicKey)) / LAMPORTS_PER_SOL} SOL`);
    console.log(`  用户2:  ${Number(svm.getBalance(user2.publicKey)) / LAMPORTS_PER_SOL} SOL`);
    console.log("\n========== 全部测试通过 ==========\n");
  });
});
*/
