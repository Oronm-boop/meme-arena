package database

import (
	"fmt"
	"log"
	"meme-arena-backend/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB 全局数据库连接
var DB *gorm.DB

// InitMySQL 初始化MySQL连接
func InitMySQL(cfg *config.MySQLConfig) error {
	// 构建 DSN (Data Source Name)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.User,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.Database,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // 开发时打印SQL日志
	})
	if err != nil {
		return fmt.Errorf("连接数据库失败: %w", err)
	}

	// 获取底层 sql.DB 并配置连接池
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("获取数据库连接失败: %w", err)
	}

	// 设置连接池参数
	sqlDB.SetMaxIdleConns(10)  // 最大空闲连接数
	sqlDB.SetMaxOpenConns(100) // 最大打开连接数

	log.Printf("数据库连接成功: %s:%d/%s", cfg.Host, cfg.Port, cfg.Database)
	return nil
}

// AutoMigrate 自动迁移数据表
func AutoMigrate(models ...interface{}) error {
	return DB.AutoMigrate(models...)
}
