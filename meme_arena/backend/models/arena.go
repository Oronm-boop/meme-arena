package models

import (
	"time"

	"gorm.io/gorm"
)

// ArenaConfig 竞技场配置（每日阵营）
type ArenaConfig struct {
	ID uint `json:"id" gorm:"primaryKey"`

	// 日期（唯一索引）
	Date string `json:"date" gorm:"type:varchar(20);uniqueIndex"` // "2026-01-22"

	// Team A (红队)
	TeamAName   string `json:"team_a_name" gorm:"type:varchar(100)"`   // "蔡徐坤"
	TeamATitle  string `json:"team_a_title" gorm:"type:varchar(100)"`  // "练习生"
	TeamASlogan string `json:"team_a_slogan" gorm:"type:varchar(255)"` // "鸡你太美..."
	TeamAImage  string `json:"team_a_image" gorm:"type:varchar(500)"`  // 主图 URL
	TeamAMemes  string `json:"team_a_memes" gorm:"type:text"`          // JSON数组: ["url1","url2"]
	TeamAColor  string `json:"team_a_color" gorm:"type:varchar(20)"`   // 主题色 "#ec4899"

	// Team B (蓝队)
	TeamBName   string `json:"team_b_name" gorm:"type:varchar(100)"`
	TeamBTitle  string `json:"team_b_title" gorm:"type:varchar(100)"`
	TeamBSlogan string `json:"team_b_slogan" gorm:"type:varchar(255)"`
	TeamBImage  string `json:"team_b_image" gorm:"type:varchar(500)"`
	TeamBMemes  string `json:"team_b_memes" gorm:"type:text"`
	TeamBColor  string `json:"team_b_color" gorm:"type:varchar(20)"` // "#3b82f6"

	// 时间戳
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (ArenaConfig) TableName() string {
	return "arena_configs"
}

// DefaultArenaConfig 返回默认配置（当没有配置时使用）
func DefaultArenaConfig() *ArenaConfig {
	return &ArenaConfig{
		Date: time.Now().Format("2006-01-02"),
		// Team A 默认配置
		TeamAName:   "蔡徐坤",
		TeamATitle:  "练习生",
		TeamASlogan: "鸡你太美...",
		TeamAImage:  "",
		TeamAMemes:  "[]",
		TeamAColor:  "#ec4899",
		// Team B 默认配置
		TeamBName:   "范小勤",
		TeamBTitle:  "挖掘机",
		TeamBSlogan: "我要开发5G...",
		TeamBImage:  "",
		TeamBMemes:  "[]",
		TeamBColor:  "#3b82f6",
	}
}

// TeamConfig 单个队伍的配置（用于API响应）
type TeamConfig struct {
	Name   string   `json:"name"`
	Title  string   `json:"title"`
	Slogan string   `json:"slogan"`
	Image  string   `json:"image"`
	Memes  []string `json:"memes"`
	Color  string   `json:"color"`
}

// ArenaResponse API响应结构
type ArenaResponse struct {
	Date   string     `json:"date"`
	TeamA  TeamConfig `json:"team_a"`
	TeamB  TeamConfig `json:"team_b"`
}
