package main

import (
	"fmt"
	"log"
	"meme-arena-backend/config"
	"meme-arena-backend/database"
	"meme-arena-backend/handlers"
	"meme-arena-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.LoadConfig()

	// 初始化 MySQL
	if err := database.InitMySQL(&cfg.MySQL); err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}
	log.Println("MySQL 连接成功")

	// 自动迁移数据表
	if err := database.DB.AutoMigrate(&models.ArenaConfig{}); err != nil {
		log.Fatalf("数据表迁移失败: %v", err)
	}
	log.Println("数据表迁移完成")

	// 初始化 OSS
	if err := handlers.InitOSS(&cfg.OSS); err != nil {
		log.Printf("OSS初始化失败（图片上传功能不可用）: %v", err)
	} else {
		log.Println("OSS 初始化成功")
	}

	// 初始化 Gin
	r := gin.Default()

	// CORS 配置 - 允许所有来源跨域访问
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type", "Authorization"},
	}))

	// 静态文件和模板
	r.Static("/static", "./static")
	r.LoadHTMLGlob("templates/*")

	// API 路由
	api := r.Group("/api")
	{
		api.GET("/arena/today", handlers.GetTodayArena)
		api.GET("/arena/list", handlers.ListArenas)
		api.GET("/arena/:date", handlers.GetArenaByDate)
		api.POST("/arena", handlers.SaveArena)
		api.DELETE("/arena/:id", handlers.DeleteArena)
		// 图片上传
		api.POST("/upload", handlers.UploadImage)
		api.POST("/upload/batch", handlers.UploadMultipleImages)
	}

	// 管理页面路由
	admin := r.Group("/admin")
	{
		admin.GET("", handlers.AdminListPage)
		admin.GET("/new", handlers.AdminNewPage)
		admin.GET("/edit/:id", handlers.AdminEditPage)
		admin.POST("/save", handlers.AdminSave)
		admin.POST("/delete/:id", handlers.AdminDelete)
	}

	// 启动服务
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("服务启动在 http://localhost%s", addr)
	log.Printf("管理后台: http://localhost%s/admin", addr)

	if err := r.Run(addr); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}
