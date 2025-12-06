// HotSearchController.java
package com.workdatebase.work.Controller;

import com.workdatebase.work.Service.HotSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@Tag(name = "搜索管理", description = "热门搜索及用户搜索历史相关接口")
public class HotSearchController {

    private final HotSearchService hotSearchService;

    public HotSearchController(HotSearchService hotSearchService) {
        this.hotSearchService = hotSearchService;
    }

    @GetMapping("/hot")
    public ResponseEntity<Map<String, Object>> getHotSearch(
            @RequestParam(defaultValue = "10") int topN) {
        try 
        {
            List<Map<String, Object>> hotKeywords = hotSearchService.getHotSearchKeywords(topN);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("hotKeywords", hotKeywords);
            return ResponseEntity.ok(response);
        } 
        catch (Exception e) 
        {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取热门搜索失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getUserSearchHistory(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "10") int limit) {
        try 
        {
            List<String> history = hotSearchService.getUserSearchHistory(userId, limit);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("history", history);
            return ResponseEntity.ok(response);
        } 
        catch (Exception e) 
        {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取搜索历史失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/history")
    public ResponseEntity<Map<String, Object>> clearUserSearchHistory(@RequestParam Long userId) {
        try {
            hotSearchService.clearUserSearchHistory(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "搜索历史已清除");
            return ResponseEntity.ok(response);
        } 
        catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "清除搜索历史失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/history/withtime")
    public ResponseEntity<Map<String, Object>> getUserSearchHistoryWithTime(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<Map<String, Object>> history = hotSearchService.getUserSearchHistoryWithTime(userId, limit);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("history", history);
            return ResponseEntity.ok(response);
        } 
        catch (Exception e) 
        {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取搜索历史失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}