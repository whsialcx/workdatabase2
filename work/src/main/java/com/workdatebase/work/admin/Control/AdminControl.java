package com.workdatebase.work.admin.Control;

import com.workdatebase.work.entity.Book;
import com.workdatebase.work.entity.BorrowRecord;
import com.workdatebase.work.Service.BookService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "管理员图书管理", description = "管理员图书及借阅记录管理相关接口")
public class AdminControl {

    private final BookService bookService;

    public AdminControl(BookService bookService) {
        this.bookService = bookService;
    }

    // 添加图书
    @PostMapping("/books")
    public ResponseEntity<Book> addBook(@RequestBody Book book) {
        return ResponseEntity.ok(bookService.addBook(book));
    }

    // 获取所有图书（分页）
    @GetMapping("/books")
    public ResponseEntity<Page<Book>> getAllBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(bookService.getBooks(pageable));
    }

    // 获取所有未归还的借阅记录
    @GetMapping("/borrow-records/current")
    public ResponseEntity<List<BorrowRecord>> getCurrentBorrowRecords() {
        return ResponseEntity.ok(bookService.getCurrentBorrowRecords());
    }

    // 获取特定图书的借阅记录
    @GetMapping("/borrow-records/book/{bookId}")
    public ResponseEntity<List<BorrowRecord>> getBookBorrowRecords(@PathVariable Long bookId) 
    {
        return ResponseEntity.ok(bookService.getBookBorrowRecords(bookId));
    }

    // 获取特定用户的借阅记录
    @GetMapping("/borrow-records/user/{userId}")
    public ResponseEntity<List<BorrowRecord>> getUserBorrowRecords(@PathVariable Long userId) 
    {
        return ResponseEntity.ok(bookService.getUserBorrowRecords(userId));
    }

    // 更新图书信息
    @PutMapping("/books/{id}")
    public ResponseEntity<Book> updateBook(@PathVariable Long id, @RequestBody Book bookDetails) {
        return bookService.findById(id)
                .map(book -> 
                {
                    book.setTitle(bookDetails.getTitle());
                    book.setAuthor(bookDetails.getAuthor());
                    book.setCategory(bookDetails.getCategory());
                    book.setLocation(bookDetails.getLocation());
                    book.setTotal(bookDetails.getTotal());
                    book.setAvailableCount(bookDetails.getAvailableCount());
                    book.setIntroduction(bookDetails.getIntroduction());
                    book.setPublishTime(bookDetails.getPublishTime());
                    return ResponseEntity.ok(bookService.addBook(book));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 删除图书
    @DeleteMapping("/books/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id) 
    {
        try 
        {
            bookService.deleteBook(id);
            return ResponseEntity.ok().build();
        }
        catch (RuntimeException e) 
        {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}