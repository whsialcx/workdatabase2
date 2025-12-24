package com.workdatebase.work.Controller;

import com.workdatebase.work.Service.AuthorService;
import com.workdatebase.work.entity.Author;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/authors")
@Tag(name = "作者管理", description = "作者信息管理相关接口")
public class AuthorController {
    
    private final AuthorService authorService;
    
    public AuthorController(AuthorService authorService) {
        this.authorService = authorService;
    }
    
    // 根据ID获取作者详情
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAuthorById(@PathVariable Long id) {
        try {
            Optional<Author> author = authorService.findById(id);
            if (author.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("author", author.get());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "作者不存在");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取作者失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 根据姓名获取作者（用于前端点击作者姓名时查询）
    @GetMapping("/search/name")
    public ResponseEntity<Map<String, Object>> getAuthorByName(@RequestParam String name) {
        try {
            Optional<Author> author = authorService.findByName(name);
            Map<String, Object> response = new HashMap<>();
            
            if (author.isPresent()) {
                response.put("success", true);
                response.put("author", author.get());
                response.put("exists", true);
            } else {
                response.put("success", true);
                response.put("exists", false);
                response.put("message", "未找到作者，将使用默认页面");
                // 返回一个临时对象用于跳转
                Author tempAuthor = new Author();
                tempAuthor.setName(name);
                response.put("author", tempAuthor);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "查询作者失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 搜索作者
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchAuthors(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
            Page<Author> authorPage;
            
            if (keyword != null && !keyword.trim().isEmpty()) {
                authorPage = authorService.searchAuthors(keyword, pageable);
            } else {
                authorPage = authorService.getAllAuthors(pageable);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("content", authorPage.getContent());
            response.put("currentPage", authorPage.getNumber());
            response.put("totalItems", authorPage.getTotalElements());
            response.put("totalPages", authorPage.getTotalPages());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "搜索作者失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 获取作者统计信息
    @GetMapping("/{id}/statistics")
    public ResponseEntity<Map<String, Object>> getAuthorStatistics(@PathVariable Long id) {
        try {
            Map<String, Object> stats = authorService.getAuthorStatistics(id);
            stats.put("success", true);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取作者统计失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 创建或更新作者
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrUpdateAuthor(@RequestBody Author author) {
        try {
            // 基本验证
            if (author.getName() == null || author.getName().trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "作者姓名不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 检查是否已存在
            Optional<Author> existingAuthor = authorService.findByName(author.getName());
            
            Author savedAuthor;
            if (existingAuthor.isPresent()) {
                // 更新现有作者
                savedAuthor = authorService.updateAuthor(existingAuthor.get().getId(), author);
            } else {
                // 创建新作者
                savedAuthor = authorService.createOrGetAuthor(author.getName());
                
                // 更新其他信息
                if (author.getBiography() != null) {
                    savedAuthor.setBiography(author.getBiography());
                }
                if (author.getBirthDate() != null) {
                    savedAuthor.setBirthDate(author.getBirthDate());
                }
                if (author.getDeathDate() != null) {
                    savedAuthor.setDeathDate(author.getDeathDate());
                }
                if (author.getNationality() != null) {
                    savedAuthor.setNationality(author.getNationality());
                }
                if (author.getPhotoBase64() != null) {
                    savedAuthor.setPhotoBase64(author.getPhotoBase64());
                }
                
                savedAuthor = authorService.updateAuthor(savedAuthor.getId(), savedAuthor);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", existingAuthor.isPresent() ? "作者信息已更新" : "作者创建成功");
            response.put("author", savedAuthor);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "操作失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 获取热门作者
    @GetMapping("/popular")
    public ResponseEntity<Map<String, Object>> getPopularAuthors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Author> popularAuthors = authorService.getPopularAuthors(pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("content", popularAuthors.getContent());
            response.put("currentPage", popularAuthors.getNumber());
            response.put("totalItems", popularAuthors.getTotalElements());
            response.put("totalPages", popularAuthors.getTotalPages());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取热门作者失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}