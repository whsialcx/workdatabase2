package com.workdatebase.work.admin.Control;


import com.workdatebase.work.Service.BookSubmissionService;
import com.workdatebase.work.entity.Status.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/submissions")
public class AdminSubmissionController {
    
    private final BookSubmissionService submissionService;
    
    public AdminSubmissionController(BookSubmissionService submissionService) {
        this.submissionService = submissionService;
    }
    
    // 获取所有提交记录
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllSubmissions(
            @RequestParam(required = false) SubmissionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("submitTime").descending());
            Page<com.workdatebase.work.entity.BookSubmission> submissions;
            
            if (status != null) {
                submissions = submissionService.getSubmissionsByStatus(status, pageable);
            } else {
                submissions = submissionService.getAllSubmissions(pageable);
            }
            
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
    
    @PutMapping("/{submissionId}/review")
    public ResponseEntity<Map<String, Object>> reviewSubmission(
            @PathVariable Long submissionId,
            @RequestParam boolean approved,
            @RequestParam(required = false) String comment,
            @RequestHeader("X-Admin-Id") String adminIdentifier) { // 改为String类型，可以是ID或用户名
        
        try {
            System.out.println("收到审核请求 - submissionId: " + submissionId + 
                            ", approved: " + approved + 
                            ", comment: " + comment + 
                            ", adminIdentifier: " + adminIdentifier);
            
            Long adminId;
            try {
                // 先尝试解析为数字ID
                adminId = Long.parseLong(adminIdentifier);
            } catch (NumberFormatException e) {
                // 如果不是数字，根据用户名查询管理员ID
                // 这里需要实现根据用户名查询用户ID的逻辑
                // 临时方案：使用默认管理员ID
                System.out.println("adminIdentifier不是数字，使用默认管理员ID");
                adminId = 1L; // 临时使用默认ID
            }
            
            Map<String, Object> result = submissionService.reviewSubmission(submissionId, adminId, approved, comment);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("审核过程中出错: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "审核失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 获取待审核数量
    @GetMapping("/pending-count")
    public ResponseEntity<Map<String, Object>> getPendingCount() {
        try {
            long count = submissionService.getPendingCount();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("pendingCount", count);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取待审核数量失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}