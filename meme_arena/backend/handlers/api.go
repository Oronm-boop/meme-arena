package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"meme-arena-backend/database"
	"meme-arena-backend/models"

	"github.com/gin-gonic/gin"
)

// GetTodayArena 获取今日阵营配置
func GetTodayArena(c *gin.Context) {
	today := time.Now().Format("2006-01-02")

	var config models.ArenaConfig
	result := database.DB.Where("date = ?", today).First(&config)

	if result.Error != nil {
		// 如果今天没配置，返回默认配置
		defaultConfig := models.DefaultArenaConfig()
		c.JSON(http.StatusOK, convertToResponse(defaultConfig))
		return
	}

	c.JSON(http.StatusOK, convertToResponse(&config))
}

// GetArenaByDate 获取指定日期的阵营配置
func GetArenaByDate(c *gin.Context) {
	date := c.Param("date")

	var config models.ArenaConfig
	result := database.DB.Where("date = ?", date).First(&config)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "配置不存在",
			"message": "未找到指定日期的配置",
		})
		return
	}

	c.JSON(http.StatusOK, convertToResponse(&config))
}

// ListArenas 获取所有阵营配置列表
func ListArenas(c *gin.Context) {
	var configs []models.ArenaConfig
	database.DB.Order("date DESC").Find(&configs)

	c.JSON(http.StatusOK, gin.H{
		"total": len(configs),
		"list":  configs,
	})
}

// SaveArena 保存阵营配置（创建或更新）
func SaveArena(c *gin.Context) {
	var input models.ArenaConfig
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "参数错误",
			"message": err.Error(),
		})
		return
	}

	// 检查日期是否为空
	if input.Date == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "参数错误",
			"message": "日期不能为空",
		})
		return
	}

	// 查找是否已存在该日期的配置
	var existing models.ArenaConfig
	result := database.DB.Where("date = ?", input.Date).First(&existing)

	if result.Error == nil {
		// 更新现有配置
		input.ID = existing.ID
		input.CreatedAt = existing.CreatedAt
		database.DB.Save(&input)
		c.JSON(http.StatusOK, gin.H{
			"message": "更新成功",
			"data":    input,
		})
	} else {
		// 创建新配置
		database.DB.Create(&input)
		c.JSON(http.StatusOK, gin.H{
			"message": "创建成功",
			"data":    input,
		})
	}
}

// DeleteArena 删除阵营配置
func DeleteArena(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "参数错误",
			"message": "无效的ID",
		})
		return
	}

	result := database.DB.Delete(&models.ArenaConfig{}, id)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "删除失败",
			"message": "配置不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "删除成功",
	})
}

// convertToResponse 将数据库模型转换为API响应格式
func convertToResponse(config *models.ArenaConfig) models.ArenaResponse {
	return models.ArenaResponse{
		Date: config.Date,
		TeamA: models.TeamConfig{
			Name:   config.TeamAName,
			Title:  config.TeamATitle,
			Slogan: config.TeamASlogan,
			Image:  config.TeamAImage,
			Memes:  parseJSONArray(config.TeamAMemes),
			Color:  config.TeamAColor,
		},
		TeamB: models.TeamConfig{
			Name:   config.TeamBName,
			Title:  config.TeamBTitle,
			Slogan: config.TeamBSlogan,
			Image:  config.TeamBImage,
			Memes:  parseJSONArray(config.TeamBMemes),
			Color:  config.TeamBColor,
		},
	}
}

// parseJSONArray 解析JSON数组字符串
func parseJSONArray(jsonStr string) []string {
	if jsonStr == "" {
		return []string{}
	}
	var arr []string
	if err := json.Unmarshal([]byte(jsonStr), &arr); err != nil {
		return []string{}
	}
	return arr
}
