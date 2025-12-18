// BookSubmissionService.java
package com.workdatebase.work.Service;

import com.workdatebase.work.Service.EmailByKafka.EmailService;
import com.workdatebase.work.entity.Book;
import com.workdatebase.work.entity.BookSubmission;
import com.workdatebase.work.entity.Status.SubmissionStatus;
import com.workdatebase.work.entity.User;
import com.workdatebase.work.repository.BookSubmissionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class BookSubmissionService {
    
    private final BookSubmissionRepository submissionRepository;
    private final BookService bookService;
    private final EmailService emailService;
    
    public BookSubmissionService(BookSubmissionRepository submissionRepository, 
                               BookService bookService,
                               EmailService emailService) {
        this.submissionRepository = submissionRepository;
        this.bookService = bookService;
        this.emailService = emailService;
    }
    
    // 用户提交图书
    @Transactional
    public BookSubmission submitBook(BookSubmission submission, User user) {
        submission.setSubmitUser(user);
        submission.setStatus(SubmissionStatus.PENDING);
        submission.setSubmitTime(LocalDateTime.now());
        return submissionRepository.save(submission);
    }
    
    // 管理员审核图书提交
    @Transactional
    public Map<String, Object> reviewSubmission(Long submissionId, Long adminId, 
                                              boolean approved, String comment) {
        Map<String, Object> result = new HashMap<>();
        
        Optional<BookSubmission> submissionOpt = submissionRepository.findById(submissionId);
        if (submissionOpt.isEmpty()) 
        {
            result.put("success", false);
            result.put("message", "图书提交不存在");
            return result;
        }
        
        BookSubmission submission = submissionOpt.get();
        if (submission.getStatus() != SubmissionStatus.PENDING) 
        {
            result.put("success", false);
            result.put("message", "该提交已被处理");
            return result;
        }
        
        submission.setReviewTime(LocalDateTime.now());
        submission.setReviewComment(comment);
        
        if (approved) 
        {
            // 审核通过，创建图书
            try 
            {
                Book book = createBookFromSubmission(submission);
                Book savedBook = bookService.addBook(book);
                
                submission.setStatus(SubmissionStatus.APPROVED);
                submission.setCreatedBookId(savedBook.getId());
                
                // 发送通知邮件给用户
                sendApprovalNotification(submission);
                
                result.put("success", true);
                result.put("message", "图书审核通过并已上架");
                result.put("book", savedBook);
                
            } 
            catch (Exception e) 
            {
                result.put("success", false);
                result.put("message", "创建图书失败: " + e.getMessage());
                return result;
            }
        } 
        else 
        {
            // 审核拒绝
            submission.setStatus(SubmissionStatus.REJECTED);
            
            // 发送拒绝通知邮件
            sendRejectionNotification(submission);
            
            result.put("success", true);
            result.put("message", "图书审核拒绝");
        }
        
        submissionRepository.save(submission);
        return result;
    }
    
    // 从提交创建图书
    private Book createBookFromSubmission(BookSubmission submission) {
        Book book = new Book();
        book.setTitle(submission.getTitle());
        book.setAuthor(submission.getAuthor());
        book.setCategory(submission.getCategory());
        book.setIntroduction(submission.getDescription());
        
        // 复制提交的封面（如果有）
        if (submission.getCoverBase64() != null && !submission.getCoverBase64().trim().isEmpty()) 
        {
            book.setCoverBase64(submission.getCoverBase64().trim());
        }

        // 设置默认值
        book.setTotal(1); // 默认1本
        book.setAvailableCount(1);
        book.setLocation("新上书架"); // 默认位置
        
        return book;
    }
    
    // 发送审核通过通知
    private void sendApprovalNotification(BookSubmission submission) {
        try 
        {
            String userEmail = submission.getSubmitUser().getEmail();
            String username = submission.getSubmitUser().getUsername();
            String bookTitle = submission.getTitle();
            
            emailService.sendSubmissionApprovalNotification(userEmail, username, bookTitle);
        } 
        catch (Exception e) 
        {
            // 邮件发送失败不影响主要业务流程
            System.err.println("发送审核通过通知失败: " + e.getMessage());
        }
    }
    
    // 发送审核拒绝通知
    private void sendRejectionNotification(BookSubmission submission) {
        try 
        {
            String userEmail = submission.getSubmitUser().getEmail();
            String username = submission.getSubmitUser().getUsername();
            String bookTitle = submission.getTitle();
            String comment = submission.getReviewComment();
            
            emailService.sendSubmissionRejectionNotification(userEmail, username, bookTitle, comment);
        } 
        catch (Exception e) 
        {
            System.err.println("发送审核拒绝通知失败: " + e.getMessage());
        }
    }
    
    // 用户取消自己的提交
    @Transactional
    public Map<String, Object> cancelSubmission(Long submissionId, Long userId) {
        Map<String, Object> result = new HashMap<>();
        
        Optional<BookSubmission> submissionOpt = submissionRepository.findById(submissionId);
        if (submissionOpt.isEmpty()) 
        {
            result.put("success", false);
            result.put("message", "图书提交不存在");
            return result;
        }
        
        BookSubmission submission = submissionOpt.get();
        if (!submission.getSubmitUser().getId().equals(userId)) 
        {
            result.put("success", false);
            result.put("message", "无权操作此提交");
            return result;
        }
        
        if (submission.getStatus() != SubmissionStatus.PENDING) 
        {
            result.put("success", false);
            result.put("message", "只能取消待审核的提交");
            return result;
        }
        
        submission.setStatus(SubmissionStatus.CANCELLED);
        submissionRepository.save(submission);
        
        result.put("success", true);
        result.put("message", "提交已取消");
        return result;
    }
    
    // 获取用户的提交记录
    public Page<BookSubmission> getUserSubmissions(Long userId, Pageable pageable) {
        return submissionRepository.findBySubmitUserId(userId, pageable);
    }
    
    // 根据状态获取提交记录（管理员用）
    public Page<BookSubmission> getSubmissionsByStatus(SubmissionStatus status, Pageable pageable) {
        return submissionRepository.findByStatus(status, pageable);
    }
    
    // 获取所有提交记录（管理员用）
    public Page<BookSubmission> getAllSubmissions(Pageable pageable) {
        return submissionRepository.findAll(pageable);
    }
    
    // 获取待审核数量
    public long getPendingCount() {
        return submissionRepository.countPendingSubmissions();
    }
}