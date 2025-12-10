package com.workdatebase.work.Controller.BookController;

import com.workdatebase.work.Service.BookSubmissionService;
import com.workdatebase.work.entity.BookSubmission;
import com.workdatebase.work.entity.User;
import com.workdatebase.work.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/submissions")
@Tag(name = "图书管理", description = "图书提交与审核相关接口")
public class BookSubmissionController {
    
    private final BookSubmissionService submissionService;
    private final UserRepository userRepository;
    
    public BookSubmissionController(BookSubmissionService submissionService,
                                   UserRepository userRepository) {
        this.submissionService = submissionService;
        this.userRepository = userRepository;
    }
    
    // 用户提交图书
    @PostMapping
    public ResponseEntity<Map<String, Object>> submitBook(
            @RequestBody BookSubmission submission,
            @RequestHeader("X-User-Id") Long userId) {
        
        try {
            // 检查用户是否存在
            Optional<User> userOptional = userRepository.findById(userId);
            if (userOptional.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "用户不存在，请重新登录");
                response.put("code", "USER_NOT_FOUND");
                return ResponseEntity.status(401).body(response);
            }
            
            User user = userOptional.get();
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
            response.put("code", "SUBMISSION_ERROR");
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
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取提交记录失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}