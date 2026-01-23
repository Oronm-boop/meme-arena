package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"meme-arena-backend/database"
	"meme-arena-backend/models"

	"github.com/gin-gonic/gin"
)

// AdminListPage 管理后台列表页面
func AdminListPage(c *gin.Context) {
	var configs []models.ArenaConfig
	database.DB.Order("date DESC").Find(&configs)

	c.HTML(http.StatusOK, "list.html", gin.H{
		"title":   "阵营配置管理",
		"configs": configs,
	})
}

// AdminNewPage 新建配置页面
func AdminNewPage(c *gin.Context) {
	c.HTML(http.StatusOK, "admin.html", gin.H{
		"title":  "新建阵营配置",
		"config": models.DefaultArenaConfig(),
		"isNew":  true,
	})
}

// AdminEditPage 编辑配置页面
func AdminEditPage(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.Redirect(http.StatusFound, "/admin")
		return
	}

	var config models.ArenaConfig
	if err := database.DB.First(&config, id).Error; err != nil {
		c.Redirect(http.StatusFound, "/admin")
		return
	}

	// 把 JSON 数组转换成多行文本格式，方便编辑
	config.TeamAMemes = ConvertJSONToLines(config.TeamAMemes)
	config.TeamBMemes = ConvertJSONToLines(config.TeamBMemes)

	c.HTML(http.StatusOK, "admin.html", gin.H{
		"title":  "编辑阵营配置",
		"config": config,
		"isNew":  false,
	})
}

// AdminSave 保存配置（表单提交）
func AdminSave(c *gin.Context) {
	// 解析表单数据
	config := models.ArenaConfig{
		Date: c.PostForm("date"),
		// Team A
		TeamAName:   c.PostForm("team_a_name"),
		TeamATitle:  c.PostForm("team_a_title"),
		TeamASlogan: c.PostForm("team_a_slogan"),
		TeamAImage:  c.PostForm("team_a_image"),
		TeamAMemes:  convertLinesToJSON(c.PostForm("team_a_memes")),
		TeamAColor:  c.PostForm("team_a_color"),
		// Team B
		TeamBName:   c.PostForm("team_b_name"),
		TeamBTitle:  c.PostForm("team_b_title"),
		TeamBSlogan: c.PostForm("team_b_slogan"),
		TeamBImage:  c.PostForm("team_b_image"),
		TeamBMemes:  convertLinesToJSON(c.PostForm("team_b_memes")),
		TeamBColor:  c.PostForm("team_b_color"),
	}

	// 检查是否已存在该日期的配置
	var existing models.ArenaConfig
	result := database.DB.Where("date = ?", config.Date).First(&existing)

	if result.Error == nil {
		// 更新现有配置
		config.ID = existing.ID
		config.CreatedAt = existing.CreatedAt
		database.DB.Save(&config)
	} else {
		// 创建新配置
		database.DB.Create(&config)
	}

	c.Redirect(http.StatusFound, "/admin")
}

// AdminDelete 删除配置
func AdminDelete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.Redirect(http.StatusFound, "/admin")
		return
	}

	database.DB.Delete(&models.ArenaConfig{}, id)
	c.Redirect(http.StatusFound, "/admin")
}

// convertLinesToJSON 将多行文本转换为JSON数组
func convertLinesToJSON(lines string) string {
	if lines == "" {
		return "[]"
	}
	// 按行分割，去除空行和无效值
	parts := strings.Split(lines, "\n")
	var urls []string
	for _, line := range parts {
		trimmed := strings.TrimSpace(line)
		// 过滤空行和无效值（如 "[]"）
		if trimmed != "" && trimmed != "[]" && strings.HasPrefix(trimmed, "http") {
			urls = append(urls, trimmed)
		}
	}
	if len(urls) == 0 {
		return "[]"
	}
	data, _ := json.Marshal(urls)
	return string(data)
}

// convertJSONToLines 将JSON数组转换为多行文本（用于表单显示）
func ConvertJSONToLines(jsonStr string) string {
	var urls []string
	if err := json.Unmarshal([]byte(jsonStr), &urls); err != nil {
		return ""
	}
	return strings.Join(urls, "\n")
}
