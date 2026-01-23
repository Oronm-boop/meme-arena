# 🎪 Meme Arena (Meme 斗兽场)

Meme Arena 是一个基于 Solana 区块链的去中心化对战竞猜游戏。用户可以选择支持自己喜欢的 Meme 阵营，通过 SOL 进行下注。基于 "Money is Justice" 规则，资金池较大的一方获胜。

## 📁 项目结构

```
meme-arena/
├── app/                # 前端项目 (React + Vite + TypeScript)
├── backend/            # 后端项目 (Go + Gin + GORM)
├── programs/           # Solana 智能合约 (Rust + Anchor)
├── tests/              # 合约集成测试
├── Anchor.toml         # Anchor 配置文件
└── README.md           # 项目说明文档
```

## 🛠️ 技术栈

*   **智能合约**: Solana, Rust, Anchor Framework
*   **前端**: React 19, Vite, Tailwind CSS, i18next (中英双语), Solana Wallet Adapter
*   **后端**: Go 1.24, Gin Web Framework, GORM, MySQL
*   **其他**: Vercel (前端部署), Linux (后端部署), Aliyun OSS (图片存储)

---

## 🚀 快速开始

### 1. 前置要求

*   [Rust & Cargo](https://www.rust-lang.org/tools/install)
*   [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
*   [Anchor CLI](https://www.anchor-lang.com/docs/installation)
*   [Node.js](https://nodejs.org/) & Yarn
*   [Go](https://go.dev/)
*   MySQL 数据库

### 2. 智能合约 (Solana Program)

位于 `programs/meme_arena` 目录。

```bash
# 1. 安装依赖
yarn install

# 2. 编译合约
anchor build

# 3. 获取 Program ID (首次部署后需更新 lib.rs 和 Anchor.toml)
solana address -k target/deploy/meme_arena-keypair.json

# 4. 部署 (Devnet)
anchor deploy --provider.cluster devnet

# 5. 同步 IDL 到前端
# (通常需要手动复制 target/idl/meme_arena.json 到前端目录)
```

**关键指令:**
*   `initialize_game`: 初始化游戏（管理员）
*   `place_bet`: 用户下注
*   `settle_game`: 结算游戏（管理员）
*   `auto_settle_game`: 自动结算（超时后任何人可调用）
*   `claim_reward`: 赢家领奖

### 3. 后端服务 (Backend)

位于 `backend` 目录，提供每日游戏配置主题 API。

**环境变量配置:**

系统通过环境变量读取数据库配置，请确保设置以下变量（本地开发可用 `setx` 或直接在 IDE 设置）：

| 变量名 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `MYSQL_HOST` | 数据库主机 | `127.0.0.1` |
| `MYSQL_PORT` | 数据库端口 | `3306` |
| `MYSQL_USER` | 数据库用户 | `root` |
| `MYSQL_PASSWORD` | 数据库密码 | (无) |
| `ALIYUN_OSS_*` | 阿里云 OSS 配置 (可选) | (空) |

**运行服务:**

```bash
cd backend
go mod tidy
go run main.go
```

服务将启动在 `http://localhost:8080`。

**API 接口:**
*   `GET /api/arena/today`: 获取今日对战主题
*   `GET /admin`: 管理后台页面

### 4. 前端应用 (Frontend)

位于 `app` 目录。

**配置:**
*   `src/utils/anchor.ts`: 确认 `PROGRAM_ID` 与部署的合约一致。
*   `vite.config.ts`: 已配置 `/api` 代理转发到后端。

**运行:**

```bash
cd app
yarn install
yarn dev
```

访问 `http://localhost:5173`。

---

## 🚢 部署指南

### 前端部署 (Vercel)

本项目已针对 Vercel 优化。

1.  **安装 Vercel CLI**: `npm i -g vercel`
2.  **配置代理**: 根目录已包含 `vercel.json`，用于解决 Mixed Content 问题（HTTPS 访问 HTTP 后端）。
3.  **部署**:
    ```powershell
    cd app
    vercel --prod
    ```

### 后端部署 (Linux/Ubuntu)

1.  **编译**:
    ```bash
    # 在 Windows 上交叉编译 Linux 可执行文件
    $env:GOOS="linux"; $env:GOARCH="amd64"; go build -o server main.go
    ```
2.  **上传**: 将 `server` 文件及 `templates/`、`static/` 目录上传至服务器。
3.  **运行**: 建议使用 `systemd` 管理服务，并在 service 文件中配置环境变量。

---

## 📝 规则说明 (Money is Justice)

1.  **对战**: 每日开启一场新的 meme 对决。
2.  **下注**: 用户使用 SOL 为支持的一方注入资金。
3.  **胜负**: 截止时间（通常为当日 20:00）后，**资金池总额较大**的一方获胜。
4.  **奖励**: 获胜方均分奖池（扣除 5% 手续费）。失败方本金全无。

---

## ⚠️ 注意事项

*   **Anchor IDL**: 如果修改了合约，务必重新 build 并更新前端的 IDL (JSON) 和类型定义。
*   **私钥安全**: `deploy` 生成的 keypair 和 `.env` 文件切勿提交到代码仓库（已配置 `.gitignore`）。
*   **跨域问题**: 本地开发使用 Vite 代理，线上部署使用 Vercel Rewrites 代理。
