package config

import "os"

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
		// MySQL 配置（写死）
		MySQL: MySQLConfig{
			Host:     "123.207.206.172",
			Port:     3306,
			User:     "root",
			Password: "l746904924..",
			Database: "arena",
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
