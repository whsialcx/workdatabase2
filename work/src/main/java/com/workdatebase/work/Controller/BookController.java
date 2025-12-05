package com.workdatebase.work.Controller;

import com.workdatebase.work.Service.BookContentService;
import com.workdatebase.work.Service.BookService;
import com.workdatebase.work.Service.HotSearchService;
import com.workdatebase.work.entity.Book;
import com.workdatebase.work.entity.BookContent;
import com.workdatebase.work.entity.BorrowRecord;
import com.workdatebase.work.entity.Status.BookStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/books")
public class BookController {
    
    private final BookService bookService;
    private final HotSearchService hotSearchService;
    private final BookContentService bookContentService; 
    
    public BookController(BookService bookService, HotSearchService hotSearchService, BookContentService bookContentService) {
        this.hotSearchService = hotSearchService;
        this.bookService = bookService;
        this.bookContentService = bookContentService;
    }
    
    // 获取所有图书（分页）
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<Book> bookPage = bookService.getBooks(pageable);
            
            // 处理结果，添加在线内容信息
            List<Book> books = enrichBooksWithContentInfo(bookPage.getContent());
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", books);
            response.put("currentPage", bookPage.getNumber());
            response.put("totalItems", bookPage.getTotalElements());
            response.put("totalPages", bookPage.getTotalPages());
            
            return ResponseEntity.ok(response);
        } 
        catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "获取图书列表失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    // 根据ID获取图书
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBookById(@PathVariable Long id) {
        try {
            Optional<Book> book = bookService.findById(id);
            if (book.isPresent()) 
            {
                Book bookObj = book.get();
                
                // 为单本图书添加在线内容信息
                bookObj = enrichBookWithContentInfo(bookObj);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("book", bookObj);
                return ResponseEntity.ok(response);
            } 
            else 
            {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "图书不存在");
                return ResponseEntity.badRequest().body(response);
            }
        } 
        catch (Exception e) 
        {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取图书失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    private List<Book> enrichBooksWithContentInfo(List<Book> books) {
        // 批量检查哪些图书有在线内容
        // 这里可以根据性能需求进行优化，比如批量查询
        return books.stream().map(book -> {
            try {
                return enrichBookWithContentInfo(book);
            } catch (Exception e) {
                // 如果检查内容失败，不影响主要功能
                return book;
            }
        }).collect(Collectors.toList());
    }

    private Book enrichBookWithContentInfo(Book book) {
        try {
            // 检查图书是否有在线内容
            boolean hasContent = bookContentService.hasBookContent(book.getId());
            book.setHasOnlineContent(hasContent);
            
            // 如果有内容，获取内容类型
            if (hasContent) {
                Optional<BookContent> content = bookContentService.getBookContent(book.getId());
                if (content.isPresent()) {
                    book.setContentType(content.get().getContentType());
                }
            }
        } catch (Exception e) {
            // 如果检查失败，不影响主要功能
            book.setHasOnlineContent(false);
        }
        
        return book;
    }
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchBooks(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        try {
            // 记录搜索关键词到热门搜索（只有有关键词时才记录）
            if (keyword != null && !keyword.trim().isEmpty()) 
            {
                hotSearchService.recordSearch(keyword, userId);
            }
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<Book> bookPage;
            
            if (keyword != null && !keyword.trim().isEmpty()) 
            {
                // 使用多字段搜索（标题、作者、类别）
                bookPage = bookService.findByTitleOrAuthorOrCategoryContaining(keyword, pageable);
            } 
            else if (category != null && !category.trim().isEmpty()) 
            {
                // 按类别搜索
                bookPage = bookService.findByCategoryContaining(category, pageable);
            } 
            else 
            {
                // 如果没有搜索词，返回所有图书
                bookPage = bookService.getBooks(pageable);
            }
            
            // 处理结果，添加在线内容信息
            List<Book> books = enrichBooksWithContentInfo(bookPage.getContent());
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", books);
            response.put("currentPage", bookPage.getNumber());
            response.put("totalItems", bookPage.getTotalElements());
            response.put("totalPages", bookPage.getTotalPages());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "搜索图书失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 按状态搜索图书
    @GetMapping("/search/status")
    public ResponseEntity<Map<String, Object>> searchBooksByStatus(
            @RequestParam BookStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            Page<Book> bookPage = bookService.findByStatus(status, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("content", bookPage.getContent());
            response.put("currentPage", bookPage.getNumber());
            response.put("totalItems", bookPage.getTotalElements());
            response.put("totalPages", bookPage.getTotalPages());
            
            return ResponseEntity.ok(response);
        } 
        catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "按状态搜索图书失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 添加图书
    @PostMapping
    public ResponseEntity<Map<String, Object>> addBook(@RequestBody Book book) {
        try {
            // 基本验证
            if (book.getTitle() == null || book.getTitle().trim().isEmpty()) 
            {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "图书标题不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (book.getAuthor() == null || book.getAuthor().trim().isEmpty()) 
            {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "作者不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (book.getTotal() == null || book.getTotal() <= 0) 
            {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "总数量必须大于0");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 设置默认值
            if (book.getIncludeTime() == null) 
            {
                book.setIncludeTime(new Date());
            }
            
            Book savedBook = bookService.addBook(book);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "图书添加成功");
            response.put("book", savedBook);
            return ResponseEntity.ok(response);
            
        } 
        catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "添加图书失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 更新图书
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBook(@PathVariable Long id, @RequestBody Book bookDetails) {
        try {
            Optional<Book> bookOptional = bookService.findById(id);
            if (!bookOptional.isPresent()) 
            {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "图书不存在");
                return ResponseEntity.badRequest().body(response);
            }
            
            Book book = bookOptional.get();
            
            // 更新字段
            if (bookDetails.getTitle() != null) 
            {
                book.setTitle(bookDetails.getTitle());
            }
            if (bookDetails.getAuthor() != null) 
            {
                book.setAuthor(bookDetails.getAuthor());
            }
            if (bookDetails.getCategory() != null) 
            {
                book.setCategory(bookDetails.getCategory());
            }
            if (bookDetails.getLocation() != null) 
            {
                book.setLocation(bookDetails.getLocation());
            }
            if (bookDetails.getTotal() != null) 
            {
                book.setTotal(bookDetails.getTotal());
            }
            if (bookDetails.getPublishTime() != null) 
            {
                book.setPublishTime(bookDetails.getPublishTime());
            }
            if (bookDetails.getIntroduction() != null) 
            {
                book.setIntroduction(bookDetails.getIntroduction());
            }
            
            // 保存更新
            Book updatedBook = bookService.addBook(book);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "图书更新成功");
            response.put("book", updatedBook);
            return ResponseEntity.ok(response);
            
        } 
        catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "更新图书失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 删除图书
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteBook(@PathVariable Long id) {
        try {
            Optional<Book> bookOptional = bookService.findById(id);
            if (!bookOptional.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "图书不存在");
                return ResponseEntity.badRequest().body(response);
            }
            
            bookService.deleteBook(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "图书删除成功");
            return ResponseEntity.ok(response);
            
        } 
        catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "删除图书失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 根据状态获取图书（保持向后兼容）
    @GetMapping("/status/{status}")
    public ResponseEntity<Map<String, Object>> getBooksByStatus(@PathVariable BookStatus status) {
        try 
        {
            List<Book> books = bookService.findByStatus(status);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("books", books);
            return ResponseEntity.ok(response);
            
        } 
        catch (Exception e) 
        {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取图书失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        try {
            Map<String, Long> stats = bookService.getStatistics();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取统计信息失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

        @GetMapping("/{id}/statistics")
    public ResponseEntity<Map<String, Object>> getBookStatistics(@PathVariable Long id) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // 获取借阅次数
            List<BorrowRecord> borrowRecords = bookService.getBookBorrowRecords(id);
            stats.put("borrowCount", borrowRecords.size());
            stats.put("success", true);
        } catch (Exception e) {
            stats.put("success", false);
            stats.put("borrowCount", 0);
        }
        
        return ResponseEntity.ok(stats);
    }

    // 获取相关图书
    @GetMapping("/{id}/related")
    public ResponseEntity<List<Book>> getRelatedBooks(@PathVariable Long id) {
        try {
            Optional<Book> currentBook = bookService.findById(id);
            if (currentBook.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            
            // 根据类别推荐相关图书
            String category = currentBook.get().getCategory();
            if (category == null || category.trim().isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            
            // 获取同类别的前4本图书（排除当前图书）
            Pageable pageable = PageRequest.of(0, 4);
            Page<Book> relatedBooks = bookService.findByCategoryContaining(category, pageable);
            
            List<Book> filteredBooks = relatedBooks.getContent().stream()
                .filter(book -> !book.getId().equals(id))
                .limit(3) // 最多返回3本
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(filteredBooks);
        } catch (Exception e) {
            // 出错时返回空列表
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    // 更新图书封面
    @PostMapping("/{id}/cover")
    public ResponseEntity<Map<String, Object>> updateBookCover(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String coverBase64 = request.get("coverBase64");
            
            Optional<Book> bookOptional = bookService.findById(id);
            if (!bookOptional.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "图书不存在");
                return ResponseEntity.badRequest().body(response);
            }
            
            Book book = bookOptional.get();
            
            // 验证base64格式（可选）
            if (coverBase64 != null && !coverBase64.trim().isEmpty()) {
                // 可以添加base64格式验证
                if (coverBase64.length() > 1024 * 1024 * 10) { // 限制10MB
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "封面图片过大，请上传小于10MB的图片");
                    return ResponseEntity.badRequest().body(response);
                }
            }
            
            // 更新封面
            book.setCoverBase64(coverBase64);
            Book updatedBook = bookService.addBook(book);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "封面更新成功");
            response.put("book", updatedBook);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "更新封面失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // 删除图书封面
    @DeleteMapping("/{id}/cover")
    public ResponseEntity<Map<String, Object>> deleteBookCover(@PathVariable Long id) {
        try {
            Optional<Book> bookOptional = bookService.findById(id);
            if (!bookOptional.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "图书不存在");
                return ResponseEntity.badRequest().body(response);
            }
            
            Book book = bookOptional.get();
            book.setCoverBase64(null);
            Book updatedBook = bookService.addBook(book);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "封面删除成功");
            response.put("book", updatedBook);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "删除封面失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}