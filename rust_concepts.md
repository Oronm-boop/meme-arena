# Rust 程序解析

### 核心概念

**game**
: 在代码里是指代那个账户对象（包含了账户里的数据、所有者等信息）。

**game.key()**
: 就是获取这个对象在区块链上唯一的地址字符串（公钥）。

> **推导关系**：唯一的 Game $\rightarrow$ 唯一的 Vault (因为 Vault 的种子依赖于 Game 的地址)

### 宏属性解析

**`init` 约束**
: 告诉 Anchor **“这个账户目前不存在，请你帮我创建一个新的”**。

*   **目的**：
    1.  **分配空间**：Solana 账户必须付费（Rent）并划拨存储空间才能使用。
    2.  **安全性（防覆盖）**：如果账户已存在，调用带 `init` 的指令会报错，防止重置已有数据。
    3.  **所有权转移**：自动将新账户的所有者（Owner）设为当前程序，赋予程序修改权限。

### 操作演示

**PDA 签名 (invoke_signed)**
: PDA 没有私钥，它通过**程序证明身份**来签名。程序告诉 Solana：“我是这个 PDA 的创造者，我授权这次转账”。

*   **代码演示 (`settle_game` 中的抽水逻辑)**:
    ```rust
    // 1. 准备种子 (Seeds) + Bump
    // 程序必须能复现出计算该 PDA 时所用的种子，才能证明“我是它爹”
    let seeds = &[
        b"vault",             // 种子1: 字符串
        game_key.as_ref(),    // 种子2: 关联的 Game 公钥
        &[ctx.bumps.vault],   // 种子3: 校验位 (Bump)
    ];
    let signer = &[&seeds[..]]; // 放入签名者数组

    // 2. 调用 invoke_signed
    anchor_lang::solana_program::program::invoke_signed(
        &ix,              // 指令 (例如转账)
        &[...],           // 涉及的账户列表
        signer,           // <--- 关键：把种子传进去作为“签名”
    )?;
    ```

### 安全问答

**Q: 既然种子是公开的，黑客能不能用同样的种子签名？**
: **不能，这是绝对安全的。**

1.  **隐藏的第 4 个种子 (Program ID)**：
    虽然你提供了 3 个种子，但 Solana 底层在计算 PDA 地址时，会自动带上**正在执行该指令的程序 ID**。
    > 计算公式 = `Hash(Seed1, Seed2, Seed3, 当前程序ID)`

2.  **只有亲爹能签名**：
    Solana 运行时 (Runtime) 会检查：**“谁在调用我进行签名？”**
    *   如果是你的程序调用 `invoke_signed`，系统会把你的程序 ID 加入计算，算出的地址不仅吻合，而且系统确认你是 Owner，允许通过。
    *   如果是黑客的程序调用，系统会用**黑客的程序 ID** 去计算。计算出的地址会完全不一样（或者即便尝试伪造，因为 ProgramId 不匹配，Runtime 会直接拒绝签名请求）。

**Q: 如果黑客直接调用我的公开程序呢？**
: **他可以调用，但他无法通过校验。**

你的 `settle_game` 指令（唯一触发转账的地方）里写了权限约束：
```rust
#[derive(Accounts)]
pub struct SettleGame<'info> {
    #[account(mut, has_one = authority)] // <--- 关键！
    pub game: Account<'info, Game>,
    
    pub authority: Signer<'info>, // <--- 这里必须是管理员签名
}
```
*   即便黑客调用了你的程序，程序第一步就会检查：**“调用者（Signer）是不是游戏管理员（Authority）？”**
*   如果不是，程序直接报错退出，根本走不到 `invoke_signed` 那一步。
