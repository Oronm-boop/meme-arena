package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"meme-arena-backend/config"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/gin-gonic/gin"
)

var ossClient *oss.Client
var ossBucket *oss.Bucket
var ossConfig *config.OSSConfig

// InitOSS 初始化OSS客户端
func InitOSS(cfg *config.OSSConfig) error {
	ossConfig = cfg

	var err error
	ossClient, err = oss.New(cfg.Endpoint, cfg.AccessKeyId, cfg.AccessKeySecret)
	if err != nil {
		return fmt.Errorf("创建OSS客户端失败: %w", err)
	}

	ossBucket, err = ossClient.Bucket(cfg.BucketName)
	if err != nil {
		return fmt.Errorf("获取Bucket失败: %w", err)
	}

	return nil
}

// UploadImage 上传图片到OSS
func UploadImage(c *gin.Context) {
	// 获取上传的文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "获取文件失败",
			"message": err.Error(),
		})
		return
	}
	defer file.Close()

	// 检查文件类型
	ext := filepath.Ext(header.Filename)
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}
	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "文件类型不支持",
			"message": "仅支持 jpg, jpeg, png, gif, webp 格式",
		})
		return
	}

	// 生成唯一文件名
	timestamp := time.Now().UnixNano()
	objectKey := fmt.Sprintf("meme-arena/%d%s", timestamp, ext)

	// 上传到OSS
	err = ossBucket.PutObject(objectKey, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "上传失败",
			"message": err.Error(),
		})
		return
	}

	// 返回图片URL
	imageURL := fmt.Sprintf("https://%s.%s/%s", ossConfig.BucketName, ossConfig.Endpoint, objectKey)

	c.JSON(http.StatusOK, gin.H{
		"message": "上传成功",
		"url":     imageURL,
	})
}

// UploadMultipleImages 批量上传图片
func UploadMultipleImages(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "获取表单失败",
			"message": err.Error(),
		})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "没有文件",
			"message": "请选择要上传的文件",
		})
		return
	}

	var urls []string
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	for i, fileHeader := range files {
		ext := filepath.Ext(fileHeader.Filename)
		if !allowedExts[ext] {
			continue // 跳过不支持的文件类型
		}

		file, err := fileHeader.Open()
		if err != nil {
			continue
		}

		// 生成唯一文件名
		timestamp := time.Now().UnixNano()
		objectKey := fmt.Sprintf("meme-arena/memes/%d_%d%s", timestamp, i, ext)

		// 上传到OSS
		err = ossBucket.PutObject(objectKey, file)
		file.Close()

		if err != nil {
			continue
		}

		// 添加URL到列表
		imageURL := fmt.Sprintf("https://%s.%s/%s", ossConfig.BucketName, ossConfig.Endpoint, objectKey)
		urls = append(urls, imageURL)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "上传完成",
		"urls":    urls,
		"count":   len(urls),
	})
}
