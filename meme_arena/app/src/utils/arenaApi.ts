// 阵营配置 API

// API 基础地址（开发环境）
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// 单个队伍配置
export interface TeamConfig {
  name: string;      // 角色名称，如 "蔡徐坤"
  title: string;     // 称号，如 "练习生"
  slogan: string;    // 口号/台词
  image: string;     // 主图 URL
  memes: string[];   // 表情包 URL 数组
  color: string;     // 主题色，如 "#ec4899"
}

// 阵营配置响应
export interface ArenaConfig {
  date: string;      // 日期 "2026-01-22"
  team_a: TeamConfig;
  team_b: TeamConfig;
}

// 默认配置（当 API 获取失败时使用）
export const DEFAULT_ARENA_CONFIG: ArenaConfig = {
  date: new Date().toISOString().split('T')[0],
  team_a: {
    name: '蔡徐坤',
    title: '练习生',
    slogan: '鸡你太美...',
    image: '',
    memes: [],
    color: '#ec4899',
  },
  team_b: {
    name: '范小勤',
    title: '挖掘机',
    slogan: '我要开发5G...',
    image: '',
    memes: [],
    color: '#3b82f6',
  },
};

/**
 * 获取今日阵营配置
 */
export async function fetchTodayArenaConfig(): Promise<ArenaConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/arena/today`);
    if (!response.ok) {
      console.warn('获取阵营配置失败，使用默认配置');
      return DEFAULT_ARENA_CONFIG;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取阵营配置出错:', error);
    return DEFAULT_ARENA_CONFIG;
  }
}

/**
 * 获取指定日期的阵营配置
 */
export async function fetchArenaConfigByDate(date: string): Promise<ArenaConfig | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/arena/${date}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('获取阵营配置出错:', error);
    return null;
  }
}
