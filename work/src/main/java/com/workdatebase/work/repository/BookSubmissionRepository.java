// BookSubmissionRepository.java
package com.workdatebase.work.repository;

import com.workdatebase.work.entity.BookSubmission;
import com.workdatebase.work.entity.Status.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BookSubmissionRepository extends JpaRepository<BookSubmission, Long> {
    
    // 根据状态查找提交
    Page<BookSubmission> findByStatus(SubmissionStatus status, Pageable pageable);
    
    // 根据用户ID查找提交
    Page<BookSubmission> findBySubmitUserId(Long userId, Pageable pageable);
    
    // 根据用户ID和状态查找提交
    Page<BookSubmission> findBySubmitUserIdAndStatus(Long userId, SubmissionStatus status, Pageable pageable);
    
    // 统计各种状态的提交数量
    long countByStatus(SubmissionStatus status);
    
    // 获取待审核的提交数量（用于管理员通知）
    @Query("SELECT COUNT(bs) FROM BookSubmission bs WHERE bs.status = 'PENDING'")
    long countPendingSubmissions();
}