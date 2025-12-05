package com.workdatebase.work.Service;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
@Service
public class HotSearchService 
{
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String HOT_SEARCH_KEY = "hot_search_keywords";
    private static final String SEARCH_HISTORY_PREFIX = "search_history:";
    private static final long HOT_SEARCH_EXPIRE_DAYS = 30; // 热门搜索数据保留30天
    private static final int MAX_HOT_KEYWORDS = 10; // 最多显示10个热门搜索词

    public HotSearchService(RedisTemplate<String, Object> redisTemplate)
    {
        this.redisTemplate = redisTemplate;
    }
    public void recordSearch(String keyword, Long userId) 
    {
        if (keyword == null || keyword.trim().isEmpty()) 
        {
            return;
        }
        
        String normalizedKeyword = normalizeKeyword(keyword.trim());
        
        // 记录全局热门搜索
        recordGlobalSearch(normalizedKeyword);
        
        // 记录个人搜索历史（如果有用户ID）
        if (userId != null)
        {
            recordUserSearchHistory(userId, normalizedKeyword);
        }
    }
    //全局
    private void recordGlobalSearch(String keyword) {
        // 使用有序集合，分数为搜索次数
        redisTemplate.opsForZSet().incrementScore(HOT_SEARCH_KEY, keyword, 1);
        // 设置过期时间
        redisTemplate.expire(HOT_SEARCH_KEY, HOT_SEARCH_EXPIRE_DAYS, TimeUnit.DAYS);
    }
    // 个人
    private void recordUserSearchHistory(Long userId, String keyword) {
        String userKey = SEARCH_HISTORY_PREFIX + userId;
        // 使用列表存储用户搜索历史，最新的在前面
        redisTemplate.opsForList().leftPush(userKey, keyword);
        // 只保留最近20条搜索记录
        redisTemplate.opsForList().trim(userKey, 0, 19);
        // 设置过期时间（30天）
        redisTemplate.expire(userKey, HOT_SEARCH_EXPIRE_DAYS, TimeUnit.DAYS);
    }
    public List<Map<String, Object>> getHotSearchKeywords(int topN) 
    {
        Set<ZSetOperations.TypedTuple<Object>> tuples = 
            redisTemplate.opsForZSet().reverseRangeWithScores(HOT_SEARCH_KEY, 0, topN - 1);
        
        List<Map<String, Object>> hotKeywords = new ArrayList<>();
        if (tuples != null) {
            for (ZSetOperations.TypedTuple<Object> tuple : tuples) {
                Map<String, Object> keywordInfo = new HashMap<>();
                keywordInfo.put("keyword", tuple.getValue());
                keywordInfo.put("count", tuple.getScore());
                hotKeywords.add(keywordInfo);
            }
        }
        
        return hotKeywords;
    }

    public List<String> getUserSearchHistory(Long userId, int limit) {
        String userKey = SEARCH_HISTORY_PREFIX + userId;
        List<Object> history = redisTemplate.opsForList().range(userKey, 0, limit - 1);
        
        List<String> result = new ArrayList<>();
        if (history != null) {
            for (Object item : history) {
                result.add(item.toString());
            }
        }
        return result;
    }

    public void clearUserSearchHistory(Long userId) {
        String userKey = SEARCH_HISTORY_PREFIX + userId;
        redisTemplate.delete(userKey);
    }

    private String normalizeKeyword(String keyword) {
        return keyword.toLowerCase().replaceAll("\\s+", " ").trim();
    }

    public List<Map<String, Object>> getDefaultHotSearch() {
        return getHotSearchKeywords(MAX_HOT_KEYWORDS);
    }

    // 在 HotSearchService.java 中添加这个方法
    public List<Map<String, Object>> getUserSearchHistoryWithTime(Long userId, int limit) {
        String userKey = SEARCH_HISTORY_PREFIX + userId;
        List<Object> history = redisTemplate.opsForList().range(userKey, 0, limit - 1);
        
        List<Map<String, Object>> result = new ArrayList<>();
        if (history != null) {
            // 由于Redis列表只存储关键词，没有时间戳，我们使用索引来模拟时间顺序
            for (int i = 0; i < history.size(); i++) {
                Map<String, Object> historyItem = new HashMap<>();
                historyItem.put("id", i + 1); // 使用索引作为ID
                historyItem.put("keyword", history.get(i).toString());
                historyItem.put("timestamp", System.currentTimeMillis() - (i * 60000)); // 模拟时间戳
                result.add(historyItem);
            }
        }
        return result;
    }



}
