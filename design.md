# 抽象 Meme 大乱斗 (Abstract Meme Arena) - 项目设计文档

## 🎯 核心目标 (Core Objective)
构建一个基于 Solana 的“抽象文化”对战平台。用户通过存入 SOL 为支持的 Meme 阵营（如“鸡你太美” vs “范小勤”）下注。
**核心理念**：极简的互助盘合约 + 极度夸张的 Vibe 前端体验 + 病毒式传播。

## 💡 核心机制设计 (Game Mechanics)

### 1. 自动赔率 (Pari-mutuel / 互助盘)
- **机制**：平台不设固定赔率，赔率由两边资金池比例自动决定。
- **逻辑**：赔率 = 总奖池 / 该阵营总资金。
  - 若 A 队资金 900，B 队资金 100，总池 1000。
  - **A 队赔率**：1.11 倍（稳赚但少）。
  - **B 队赔率**：10.0 倍（风险高回报大）。
- **优势**：开发者无资金风险（不需坐庄），通过抽取手续费盈利。

### 2. 商业模式与分红 (Profit & Fees)
- **胜负判定**：在 MVP 版本中，资金池多的一方获胜（钱多即正义），或者由管理员手动根据 Twitter 热度判定。
- **分钱公式**：
  1. **总奖池** = 赢家池 + 输家池。
  2. **平台抽成**：总奖池 * 5%（直接转入开发者钱包）。
  3. **可分配奖金** = 总奖池 - 平台抽成。
  4. **赢家收益** = 拿回本金 + 瓜分输家全部剩余资金（按投入比例）。

### 3. 素材策略 (Asset Strategy)
- **模式**：Web2.5 模式（开发者中心化提供）。
- **理由**：为了 8 天内上线的速度和 Vibe 品控。
- **执行**：不使用用户 Mint NFT。由开发者每日选定两个高质量 Meme（GIF/图片/音效），作为固定的“红蓝对决”主题。

## 🛠️ 技术架构 (Architecture)

### 1. 智能合约 (Anchor Program)
- **Account: `Game`**
  - `topic`: String (主题，如 "Kun vs Fan")
  - `deadline`: i64 (结束时间戳)
  - `total_pool_a`: u64 (A 队总资金)
  - `total_pool_b`: u64 (B 队总资金)
  - `status`: Enum (Open, Settled)
  - `winner`: Option<Side>
- **Account: `Bet`**
  - `user`: Pubkey
  - `game`: Pubkey
  - `amount`: u64
  - `side`: Side (TeamA or TeamB)
  - `claimed`: bool
- **Instructions:**
  - `initialize_game`: 管理员创建一场对战。
  - `place_bet`: 用户下注，资金转入 Vault PDA。
  - `resolve_game`: 比较 Pool A 和 Pool B 大小决定胜负。
  - `claim_reward`: 赢家根据自己贡献的比例提现奖励。

### 2. 前端应用 (Next.js + Tailwind)
前端负责营造“抽象”和“激烈”的氛围。

#### 页面布局
- **VS Arena 组件**: 巨大的 VS 标志，两边是动态变化的“血条”（资金比例）。
- **Meme Character 组件**:
  - A 队：蔡徐坤 (动画：打篮球)
  - B 队：范小勤 (动画：敬礼)
  - 交互：点击人物触发相应音效。
- **Betting Panel**: 简单的输入框和“All In”按钮。
- **Bullet Screen (弹幕)**: 轮播经典语录（“小黑子露馅了吧”、“真实即力量”）。

#### 视觉特效
- **Victory**: 满屏粒子效果、赢得的 SOL 数字飞入。
- **Defeat**: 屏幕变灰，播放《二泉映月》或类似悲伤 BGM。
