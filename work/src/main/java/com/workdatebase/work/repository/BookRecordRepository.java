package com.workdatebase.work.repository;

import com.workdatebase.work.entity.BorrowRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookRecordRepository extends JpaRepository<BorrowRecord, Long> {
    List<BorrowRecord> findByUserId(Long userId);
    List<BorrowRecord> findByBookId(Long bookId);
    Optional<BorrowRecord> findByBookIdAndUserIdAndReturnDateIsNull(Long bookId, Long userId);
    List<BorrowRecord> findByReturnDateIsNull();
    Page<BorrowRecord> findByReturnDateIsNull(Pageable pageable);
    Page<BorrowRecord> findByReturnDateIsNotNull(Pageable pageable);
    long countByReturnDateIsNull();
    long countByReturnDateIsNullAndDatelineBefore(java.util.Date now);
}
