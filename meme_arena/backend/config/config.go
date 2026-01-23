package config

import (
	"os"
	"strconv"
)

// Config 应用配置
type Config struct {
	MySQL  MySQLConfig
	Server ServerConfig
	OSS    OSSConfig
}

// MySQLConfig MySQL数据库配置
type MySQLConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Database string
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port int
}

// OSSConfig 阿里云OSS配置
type OSSConfig struct {
	Endpoint        string
	AccessKeyId     string
	AccessKeySecret string
	BucketName      string
}

// LoadConfig 加载配置
func LoadConfig() *Config {
	return &Config{
		// MySQL 配置（从环境变量读取）
		MySQL: MySQLConfig{
			Host:     getEnv("MYSQL_HOST", "127.0.0.1"),
			Port:     getEnvInt("MYSQL_PORT", 3306),
			User:     getEnv("MYSQL_USER", "root"),
			Password: getEnv("MYSQL_PASSWORD", ""),
			Database: "arena", // 数据库名通常不变，或者也可以加环境变量
		},
		Server: ServerConfig{
			Port: 8080,
		},
		// OSS 配置（从环境变量读取）
		OSS: OSSConfig{
			Endpoint:        getEnv("ALIYUN_OSS_ENDPOINT", ""),
			AccessKeyId:     getEnv("ALIYUN_OSS_ACCESS_KEY_ID", ""),
			AccessKeySecret: getEnv("ALIYUN_OSS_ACCESS_KEY_SECRET", ""),
			BucketName:      getEnv("ALIYUN_OSS_BUCKET_NAME", ""),
		},
	}
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt 获取整型环境变量
func getEnvInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}
