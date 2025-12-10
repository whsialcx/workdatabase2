package com.workdatebase.work.Controller.BookController;

import com.workdatebase.work.Service.BookSubmissionService;
import com.workdatebase.work.entity.BookSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
@Tag(name = "图书管理", description = "图书提交与审核相关接口")
public class BookSubmissionController {
    
    private final BookSubmissionService submissionService;
    
    public BookSubmissionController(BookSubmissionService submissionService) {
        this.submissionService = submissionService;
    }
    
    // 用户提交图书
    @PostMapping
    public ResponseEntity<Map<String, Object>> submitBook(
            @RequestBody BookSubmission submission,
            @RequestHeader("X-User-Id") Long userId) {
        
        try {
            // 这里需要从用户服务获取用户信息
            // 简化处理，实际项目中应该注入UserService
            // User user = userService.findById(userId);
            
            // 临时创建用户对象
            com.workdatebase.work.entity.User user = new com.workdatebase.work.entity.User();
            user.setId(userId);
            
            BookSubmission savedSubmission = submissionService.submitBook(submission, user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "图书提交成功，等待管理员审核");
            response.put("submission", savedSubmission);
            
            return ResponseEntity.ok(response);
            
        } 
        catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "提交失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 用户获取自己的提交记录
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMySubmissions(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("submitTime").descending());
            Page<BookSubmission> submissions = submissionService.getUserSubmissions(userId, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("submissions", submissions.getContent());
            response.put("currentPage", submissions.getNumber());
            response.put("totalItems", submissions.getTotalElements());
            response.put("totalPages", submissions.getTotalPages());
            
            return ResponseEntity.ok(response);
            
        } 
        catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取提交记录失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 用户取消提交
    @PutMapping("/{submissionId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelSubmission(
            @PathVariable Long submissionId,
            @RequestHeader("X-User-Id") Long userId) {
        
        Map<String, Object> result = submissionService.cancelSubmission(submissionId, userId);
        return ResponseEntity.ok(result);
    }
}