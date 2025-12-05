package com.workdatebase.work.user.Controll;

import com.workdatebase.work.entity.Book;
import com.workdatebase.work.entity.BorrowRecord;
import com.workdatebase.work.entity.User;
import com.workdatebase.work.repository.UserRepository;
import com.workdatebase.work.entity.Status.BookStatus;
import com.workdatebase.work.Service.BookService;
import com.workdatebase.work.Service.AuthService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.workdatebase.work.repository.BookRecordRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserControl {

    private final BookService bookService;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final BookRecordRepository bookRecordRepository;

    public UserControl(BookService bookService, UserRepository userRepository, AuthService authService, BookRecordRepository bookRecordRepository) {  // 修复：添加UserRepository参数
        this.bookService = bookService;
        this.userRepository = userRepository;  
        this.authService = authService;
        this.bookRecordRepository = bookRecordRepository;
    }

    // 查询所有图书（分页）
    @GetMapping("/books")
    public ResponseEntity<Page<Book>> getAllBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) 
    {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(bookService.getBooks(pageable));
    }

    // 根据ID查询图书
    @GetMapping("/books/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        Optional<Book> book = bookService.findById(id);
        return book.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }

    // 根据标题搜索图书
    @GetMapping("/books/search")
    public ResponseEntity<List<Book>> searchBooks(@RequestParam String title) 
    {
        return ResponseEntity.ok(bookService.findByTitleContaining(title));
    }

    // 根据状态查询图书
    @GetMapping("/books/status/{status}")
    public ResponseEntity<List<Book>> getBooksByStatus(@PathVariable BookStatus status) {
        return ResponseEntity.ok(bookService.findByStatus(status));
    }

    // 借阅图书
    @PostMapping("/borrow/{bookId}/{username}")
    public ResponseEntity<?> borrowBook(@PathVariable Long bookId, @PathVariable String username) {
        try {
            BorrowRecord record = bookService.borrowBook(bookId, username);
            return ResponseEntity.ok(record);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 归还图书
    @PostMapping("/return/{borrowRecordId}")
    public ResponseEntity<?> returnBook(@PathVariable Long borrowRecordId) {
        try {
            BorrowRecord record = bookService.returnBook(borrowRecordId);
            return ResponseEntity.ok(record);
        } 
        catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 续借图书
    @PostMapping("/renew/{borrowRecordId}")
    public ResponseEntity<?> renewBook(@PathVariable Long borrowRecordId) {
        try {
            BorrowRecord record = bookService.renewBook(borrowRecordId);
            return ResponseEntity.ok(record);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 获取用户的借阅记录
    @GetMapping("/borrowrecords/{userId}")
    public ResponseEntity<List<BorrowRecord>> getUserBorrowRecords(@PathVariable Long userId) {
        return ResponseEntity.ok(bookService.getUserBorrowRecords(userId));
    }

    // 通过用户名查找用户
    @GetMapping("/findbyusername")
    public ResponseEntity<User> getUserByUsername(@RequestParam String username) {
        Optional<User> user = userRepository.findByUsername(username);
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{userId}/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @PathVariable Long userId,
            @RequestBody Map<String, String> passwordData) {
        
        String oldPassword = passwordData.get("oldPassword");
        String newPassword = passwordData.get("newPassword");
        
        if (oldPassword == null || newPassword == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "旧密码和新密码不能为空");
            return ResponseEntity.badRequest().body(result);
        }
        
        if (newPassword.length() < 6) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "新密码长度不能少于6位");
            return ResponseEntity.badRequest().body(result);
        }
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "用户不存在");
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        
        // 验证旧密码
        if (!authService.getPasswordEncoder().matches(oldPassword, user.getPassword())) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "当前密码不正确");
            return ResponseEntity.badRequest().body(result);
        }
        
        // 更新密码
        String encodedPassword = authService.getPasswordEncoder().encode(newPassword);
        user.setPassword(encodedPassword);
        userRepository.save(user);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "密码修改成功");
        return ResponseEntity.ok(result);
    }

    // 新增：通过用户名修改密码（备用接口）
    @PutMapping("/password")
    public ResponseEntity<Map<String, Object>> changePasswordByUsername(
            @RequestParam String username,
            @RequestBody Map<String, String> passwordData) {
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "用户不存在");
            return ResponseEntity.notFound().build();
        }
        
        return changePassword(userOpt.get().getId(), passwordData);
    }

    @GetMapping("/borrow/status/{bookId}")
    public ResponseEntity<BorrowRecord> getUserBorrowStatus(
            @PathVariable Long bookId,
            @RequestParam Long userId) {
        
        // 查找用户对该图书的未归还借阅记录
        Optional<BorrowRecord> borrowRecord = bookRecordRepository
            .findByBookIdAndUserIdAndReturnDateIsNull(bookId, userId);
        
        return borrowRecord.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }
}