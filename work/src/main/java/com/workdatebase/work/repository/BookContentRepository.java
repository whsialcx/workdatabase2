// BookContentRepository.java
package com.workdatebase.work.repository;

import com.workdatebase.work.entity.BookContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface BookContentRepository extends JpaRepository<BookContent, Long> {
    
    Optional<BookContent> findByBookId(Long bookId);
    
    boolean existsByBookId(Long bookId);
    
    @Transactional
    @Modifying
    @Query("UPDATE BookContent bc SET bc.viewCount = bc.viewCount + 1, bc.lastViewTime = CURRENT_TIMESTAMP WHERE bc.id = :id")
    void incrementViewCount(@Param("id") Long id);
    
    @Query("SELECT COUNT(bc) FROM BookContent bc WHERE bc.isPublic = true")
    long countPublicContents();
}