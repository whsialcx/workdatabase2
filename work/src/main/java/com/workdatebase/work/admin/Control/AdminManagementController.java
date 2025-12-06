package com.workdatebase.work.admin.Control;

import com.workdatebase.work.Service.BookService;
import com.workdatebase.work.entity.BorrowRecord;
import com.workdatebase.work.entity.User;
import com.workdatebase.work.repository.UserRepository;
import com.workdatebase.work.repository.BookRecordRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "管理员用户管理", description = "管理员用户及借阅记录管理相关接口")
public class AdminManagementController {

    private final UserRepository userRepository;
    private final BookRecordRepository bookRecordRepository;
    private final BookService bookService;

    public AdminManagementController(UserRepository userRepository, 
                                     BookRecordRepository bookRecordRepository, 
                                     BookService bookService) {
        this.userRepository = userRepository;
        this.bookRecordRepository = bookRecordRepository;
        this.bookService = bookService;
    }

    // --- User Management ---

    @GetMapping("/users")
    public ResponseEntity<Page<User>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        Page<User> users = userRepository.findAll(pageable);
        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (!userRepository.existsById(id)) {
                response.put("success", false);
                response.put("message", "用户不存在");
                return ResponseEntity.badRequest().body(response);
            }
            // TODO: 检查用户是否有未归还的图书
            userRepository.deleteById(id);
            response.put("success", true);
            response.put("message", "用户删除成功");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "删除失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/borrows")
    public ResponseEntity<Page<BorrowRecord>> getAllBorrowRecords(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("borrowDate").descending());
        Page<BorrowRecord> records;

        if ("active".equals(status)) {
            records = bookRecordRepository.findByReturnDateIsNull(pageable);
        } else if ("returned".equals(status)) {
            records = bookRecordRepository.findByReturnDateIsNotNull(pageable);
        } else {
            records = bookRecordRepository.findAll(pageable);
        }
        
        return ResponseEntity.ok(records);
    }

    /**
     * 管理员强制还书
     */
    @PostMapping("/borrows/return/{recordId}")
    public ResponseEntity<?> forceReturnBook(@PathVariable Long recordId) {
        try {
            BorrowRecord record = bookService.returnBook(recordId);
            return ResponseEntity.ok(record);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}