use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

// ⚠️ 注意：Deploy 后记得用 anchor keys sync 更新 ID
declare_id!("6F6LttArcscELmxWSVZfrH3Mv5UhhBQZQLmdHRdd6G89");

#[program]
pub mod meme_arena {
    use super::*;

    // 1. 初始化游戏
    pub fn initialize_game(
        ctx: Context<InitializeGame>, 
        topic: String, 
        deadline: i64
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        game.authority = ctx.accounts.authority.key();
        game.topic = topic;
        game.deadline = deadline;
        game.status = GameStatus::Open;
        game.total_pool_a = 0;
        game.total_pool_b = 0;
        
        // 设置 Fee vault (默认是管理员)
        game.fee_vault = ctx.accounts.authority.key();
        
        Ok(())
    }

    // 2. 下注 (Place Bet)
    pub fn place_bet(
        ctx: Context<PlaceBet>, 
        side: Side, 
        amount: u64
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let bet = &mut ctx.accounts.bet;
        let clock = Clock::get()?;

        // 检查: 游戏是否正在进行
        require!(clock.unix_timestamp < game.deadline, GameError::GameAlreadyEnded);
        require!(game.status == GameStatus::Open, GameError::GameAlreadyEnded);

        // 初始化 Bet 账户
        bet.user = ctx.accounts.user.key();
        bet.game = game.key();
        bet.amount = amount;
        bet.side = side.clone();
        bet.claimed = false;

        // 更新奖池数据
        match side {
            Side::TeamA => game.total_pool_a += amount,
            Side::TeamB => game.total_pool_b += amount,
        }

        // 🟢 转账逻辑: User -> Game Vault
        // 我们构建一个 CPI 调用 System Program 的 transfer 指令
        let ix = system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.vault.key(),
            amount,
        );
        
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }

    // 3. 结算 (Settle Game)
    pub fn settle_game(ctx: Context<SettleGame>, winner_side: Option<Side>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        // let clock = Clock::get()?;

        // 可以在这里加时间检查，为了黑客松演示方便，先注释掉强制时间检查
        // require!(clock.unix_timestamp >= game.deadline, GameError::GameNotEndedYet);
        require!(game.status == GameStatus::Open, GameError::GameAlreadySettled);
        
        // 判定赢家: 如果手动指定了就用指定的，否则资金池大的赢
        let winner = if let Some(side) = winner_side {
            side
        } else {
            if game.total_pool_a > game.total_pool_b {
                Side::TeamA
            } else {
                Side::TeamB // 如果相等，默认 TeamB 赢 (极简处理)
            }
        };

        game.winner = Some(winner);
        game.status = GameStatus::Settled;

        // 🟢 抽水逻辑: Vault -> Fee Vault
        // 计算总奖池
        let total_pool = game.total_pool_a + game.total_pool_b;
        // 计算手续费 (5%)
        let fee = total_pool * 5 / 100;

        if fee > 0 {
            // 从 Vault 转手续费给开发者
            let game_key = game.key();
            let seeds = &[
                b"vault",
                game_key.as_ref(),
                &[ctx.bumps.vault],
            ];
            let signer = &[&seeds[..]];

            let ix = system_instruction::transfer(
                &ctx.accounts.vault.key(),
                &game.fee_vault,
                fee,
            );

            anchor_lang::solana_program::program::invoke_signed(
                &ix,
                &[
                    ctx.accounts.vault.to_account_info(),
                    ctx.accounts.system_program.to_account_info(), // 即使是转给 fee_vault 也需要 system_program
                    ctx.accounts.fee_vault.to_account_info(),
                ],
                signer,
            )?;
        }

        Ok(())
    }

    // 4. 领奖 (Claim Reward)
    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        let game = &ctx.accounts.game;
        let bet = &mut ctx.accounts.bet;
        let vault = &mut ctx.accounts.vault;
        let user = &mut ctx.accounts.user;

        // 检查: 必须已结算
        require!(game.status == GameStatus::Settled, GameError::GameNotSettled);
        // 检查: 必须没领过
        require!(!bet.claimed, GameError::AlreadyClaimed);
        // 检查: 必须是赢家
        require!(game.winner.is_some(), GameError::NoWinner);
        require!(bet.side == game.winner.unwrap(), GameError::NotWinner);

        // 💰 计算奖金
        // 1. 总奖池 (扣除 5% 手续费后的)
        let total_pool = game.total_pool_a + game.total_pool_b;
        let fee = total_pool * 5 / 100;
        let distributable_pool = total_pool - fee;

        // 2. 赢家这边总共有多少钱
        let winning_pool_total = match game.winner.unwrap() {
            Side::TeamA => game.total_pool_a,
            Side::TeamB => game.total_pool_b,
        };

        // 3. 计算用户占比 (User Bet / Winning Pool Total)
        // ⚠️ 使用 u128 防止溢出
        // 公式: UserReward = Distributable * (UserBet / WinningPoolTotal)
        let reward = (distributable_pool as u128)
            .checked_mul(bet.amount as u128).unwrap()
            .checked_div(winning_pool_total as u128).unwrap();

        let reward_u64 = reward as u64;

        // 🟢 转账逻辑: Vault -> User
        let game_key = game.key();
        let seeds = &[
            b"vault",
            game_key.as_ref(),
            &[ctx.bumps.vault],
        ];
        let signer = &[&seeds[..]];

        let ix = system_instruction::transfer(
            &vault.key(),
            &user.key(),
            reward_u64,
        );

        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[
                vault.to_account_info(),
                user.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer,
        )?;

        // 标记为已领取
        bet.claimed = true;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(topic: String, deadline: i64)]
pub struct InitializeGame<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 32 + (4 + 50) + 8 + 8 + 8 + 32 + 1 + 2, // 适当调大一点 Space
        seeds = [b"game", topic.as_bytes()], 
        bump
    )]
    pub game: Account<'info, Game>, // Game PDA: 存储游戏状态、资金池数据
    
    // 这个 Vault 用来存钱，是一个 PDA
    #[account(
        mut,
        seeds = [b"vault", game.key().as_ref()],
        bump
    )]
    /// CHECK: 这是一个纯粹存钱的 PDA，不需要初始化 data，只负责保管 SOL
    pub vault: SystemAccount<'info>, // 资金池 Vault PDA

    #[account(mut)]
    pub authority: Signer<'info>, // 游戏创建者/管理员
    pub system_program: Program<'info, System>, // 系统程序
}

#[derive(Accounts)]
#[instruction(side: Side, amount: u64)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>, // 游戏账户
    
    #[account(
        init, 
        payer = user, 
        space = 8 + 32 + 32 + 8 + 1 + 1,
        seeds = [b"bet", game.key().as_ref(), user.key().as_ref()], 
        bump
    )]
    pub bet: Account<'info, Bet>, // 下注记录 PDA
    
    #[account(
        mut,
        seeds = [b"vault", game.key().as_ref()],
        bump
    )]
    /// CHECK: 只负责收钱
    pub vault: SystemAccount<'info>, // 资金池 Vault PDA

    #[account(mut)]
    pub user: Signer<'info>, // 下注用户
    pub system_program: Program<'info, System>, // 系统程序
}

#[derive(Accounts)]
pub struct SettleGame<'info> {
    #[account(mut, has_one = authority)]
    pub game: Account<'info, Game>, // 游戏账户

    #[account(
        mut,
        seeds = [b"vault", game.key().as_ref()],
        bump
    )]
    /// CHECK: 转出手续费用的 PDA source
    pub vault: SystemAccount<'info>, // 资金池 Vault PDA

    /// CHECK: 接收手续费的账户
    #[account(mut, address = game.fee_vault)]
    pub fee_vault: AccountInfo<'info>, // 手续费接收账户

    pub authority: Signer<'info>, // 管理员
    pub system_program: Program<'info, System>, // 系统程序
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>, // 游戏账户
    
    #[account(
        mut,
        seeds = [b"bet", game.key().as_ref(), user.key().as_ref()],
        bump,
        has_one = user,
        has_one = game
    )]
    pub bet: Account<'info, Bet>, // 下注记录

    #[account(
        mut,
        seeds = [b"vault", game.key().as_ref()],
        bump
    )]
    /// CHECK: 发奖金的 PDA source
    pub vault: SystemAccount<'info>, // 资金池 Vault PDA

    #[account(mut)]
    pub user: Signer<'info>, // 领奖用户
    
    pub system_program: Program<'info, System>, // 系统程序
}

// Data Structures

#[account]
pub struct Game {
    pub authority: Pubkey,   // 32 bytes: 管理员公钥
    pub topic: String,       // 4 + len: 游戏主题 (如 "Kun vs Fan")
    pub deadline: i64,       // 8 bytes: 结束时间戳
    pub total_pool_a: u64,   // 8 bytes: A 队资金池总额
    pub total_pool_b: u64,   // 8 bytes: B 队资金池总额
    pub fee_vault: Pubkey,   // 32 bytes: 手续费接收地址
    pub status: GameStatus,  // 1 byte: 游戏状态
    pub winner: Option<Side>,// 2 bytes: 获胜方 (TeamA=0, TeamB=1)
}

#[account]
pub struct Bet {
    pub user: Pubkey,    // 32 bytes: 用户公钥
    pub game: Pubkey,    // 32 bytes: 关联的游戏公钥
    pub amount: u64,     // 8 bytes: 下注金额
    pub side: Side,      // 1 byte: 投注方向
    pub claimed: bool,   // 1 byte: 领奖状态
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    TeamA,
    TeamB,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameStatus {
    Open,
    Settled,
}

#[error_code]
pub enum GameError {
    #[msg("Game has already ended.")]
    GameAlreadyEnded,
    #[msg("Game has not ended yet.")]
    GameNotEndedYet,
    #[msg("Game has already been settled.")]
    GameAlreadySettled,
    #[msg("Game is not settled yet.")]
    GameNotSettled,
    #[msg("Reward already claimed.")]
    AlreadyClaimed,
    #[msg("No winner determined.")]
    NoWinner,
    #[msg("You did not bet on the winning side.")]
    NotWinner,
}
