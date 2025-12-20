package com.workdatebase.work.Service;

import com.workdatebase.work.entity.Book;
import com.workdatebase.work.entity.User;
import com.workdatebase.work.entity.Status.BookStatus;
import com.workdatebase.work.repository.BookRecordRepository;
import com.workdatebase.work.repository.BookRepository;
import com.workdatebase.work.repository.UserRepository;
import com.workdatebase.work.entity.BorrowRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BookService {
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BookRecordRepository bookRecordRepository;
    
    public BookService(BookRepository bookRepository, UserRepository userRepository, BookRecordRepository bookRecordRepository)
    {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.bookRecordRepository = bookRecordRepository;
    }

    // 获取所有图书
    public List<Book> getAllBooks() 
    {
        return bookRepository.findAll();
    }
    
    // 根据ID获取图书
    public Optional<Book> findById(Long id) 
    {
        return bookRepository.findById(id);
    }

    // 按标题搜索（保持向后兼容）
    public List<Book> findByTitleContaining(String title) 
    {
        return bookRepository.findByTitleContainingIgnoreCase(title);
    }

    // 按状态搜索（保持向后兼容）
    public List<Book> findByStatus(BookStatus status) 
    {
        return bookRepository.findByStatus(status);
    }

    // 按状态搜索（分页）
    public Page<Book> findByStatus(BookStatus status, Pageable pageable) 
    {
        return bookRepository.findByStatus(status, pageable);
    }
    
    // 分页获取所有图书
    public Page<Book> getBooks(Pageable pageable) 
    {
        return bookRepository.findAll(pageable);
    }

    // 添加图书（允许相同图书创建多个副本）
    public Book addBook(Book book)
    {
        // 直接创建新图书，不检查重复
        book.setIncludeTime(new Date());
        book.setAvailableCount(book.getTotal());
        if (book.getAvailableCount() > 0) {
            book.setStatus(BookStatus.AVAILABLE);
        } else {
            book.setStatus(BookStatus.BORROWED);
        }
        return bookRepository.save(book);
    }

    @Transactional
    public void deleteBook(Long id) 
    {
        Book book = bookRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("图书不存在"));
        bookRepository.delete(book);
    }
     
    @Transactional
    public BorrowRecord borrowBook(Long bookId, String username) {
        Book book = bookRepository.findById(bookId).orElseThrow(() -> new RuntimeException("图书不存在"));
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("用户不存在"));
        
        if(book.getAvailableCount() <= 0) {
            throw new RuntimeException("图书已被借完");
        }
        
        Optional<BorrowRecord> existingOptional = bookRecordRepository.findByBookIdAndUserIdAndReturnDateIsNull(bookId, user.getId());
        if(existingOptional.isPresent()) {
            throw new RuntimeException("您已借阅过此书");
        }
        
        Date borrowDate = new Date();
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(borrowDate);
        calendar.add(Calendar.DAY_OF_MONTH, 30); // 借阅30天
        Date datelineDate = calendar.getTime();
        
        BorrowRecord bookRecord = new BorrowRecord(book, user, borrowDate, datelineDate);
        book.setAvailableCount(book.getAvailableCount() - 1);
        bookRepository.save(book);
        return bookRecordRepository.save(bookRecord);
    }

    @Transactional
    public BorrowRecord returnBook(Long borrowRecordId) {
        BorrowRecord borrowRecord = bookRecordRepository.findById(borrowRecordId)
            .orElseThrow(() -> new RuntimeException("借阅记录不存在"));
        
        if(borrowRecord.getReturnDate() != null) {
            throw new RuntimeException("图书已归还");
        }
        
        borrowRecord.setReturnDate(new Date());
        Book book = borrowRecord.getBook();
        book.setAvailableCount(book.getAvailableCount() + 1);
        bookRepository.save(book);
        return bookRecordRepository.save(borrowRecord);
    }
    
    @Transactional
    public BorrowRecord renewBook(Long borrowRecordId) {
        BorrowRecord borrowRecord = bookRecordRepository.findById(borrowRecordId)
            .orElseThrow(() -> new RuntimeException("借阅记录不存在"));
        
        if(borrowRecord.getReturnDate() != null) 
        {
            throw new RuntimeException("您已归还该书");
        }
        
        if(borrowRecord.getRenewed()) 
        {
            throw new RuntimeException("您已续借过一次，无法再次续借");
        }
        
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(borrowRecord.getDateline());
        calendar.add(Calendar.DAY_OF_MONTH, 30);
        borrowRecord.setDateline(calendar.getTime());
        borrowRecord.setRenewed(true);
        return bookRecordRepository.save(borrowRecord);
    }

    public List<BorrowRecord> getUserBorrowRecords(Long userId) {
        return bookRecordRepository.findByUserId(userId);
    }

    // 按标题搜索（分页，保持向后兼容）
    public Page<Book> findByTitleContaining(String title, Pageable pageable) {
        return bookRepository.findByTitleContainingIgnoreCase(title, pageable);
    }

    // 多字段搜索（标题、作者、类别）
    public Page<Book> findByTitleOrAuthorOrCategoryContaining(String keyword, Pageable pageable) {
        return bookRepository.findByTitleOrAuthorOrCategoryContainingIgnoreCase(keyword, pageable);
    }

    // 按类别搜索
    public Page<Book> findByCategoryContaining(String category, Pageable pageable) {
        return bookRepository.findByCategoryContainingIgnoreCase(category, pageable);
    }

    // 获取图书的借阅记录
    public List<BorrowRecord> getBookBorrowRecords(Long bookId) {
        return bookRecordRepository.findByBookId(bookId);
    }

    // 获取所有未归还的借阅记录
    public List<BorrowRecord> getCurrentBorrowRecords() {
        return bookRecordRepository.findByReturnDateIsNull();
    }
    
    public Map<String, Long> getStatistics() {
        Map<String, Long> stats = new HashMap<>();
        
        // 馆藏图书总数
        long bookCount = bookRepository.count();
        stats.put("bookCount", bookCount);
        
        // 注册用户总数
        long userCount = userRepository.count();
        stats.put("userCount", userCount);
        
        // 当前借阅数量（未归还的借阅记录）
        long borrowCount = bookRecordRepository.countByReturnDateIsNull();
        stats.put("borrowCount", borrowCount);
        
        // 逾期未还数量（未归还且超过截止日期）
        Date now = new Date();
        long overdueCount = bookRecordRepository.countByReturnDateIsNullAndDatelineBefore(now);
        stats.put("overdueCount", overdueCount);
        
        return stats;
    }
}