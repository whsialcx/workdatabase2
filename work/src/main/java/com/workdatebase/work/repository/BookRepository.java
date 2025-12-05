package com.workdatebase.work.repository;

import com.workdatebase.work.entity.Book;
import com.workdatebase.work.entity.Status.BookStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByStatus(BookStatus status);
    
    // 添加分页的状态搜索
    Page<Book> findByStatus(BookStatus status, Pageable pageable);
    
    List<Book> findByTitleContainingIgnoreCase(String title);
    
    // 添加分页的标题搜索（保持向后兼容）
    @Query("SELECT b FROM Book b WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%'))")
    Page<Book> findByTitleContainingIgnoreCase(@Param("title") String title, Pageable pageable);
    
    Optional<Book> findByTitleAndAuthorAndPublishTime(String title, String author, Date publishTime);

    // 多字段搜索方法
    @Query("SELECT b FROM Book b WHERE " +
           "LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.category) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Book> findByTitleOrAuthorOrCategoryContainingIgnoreCase(@Param("keyword") String keyword, Pageable pageable);

    // 按类别搜索方法
    @Query("SELECT b FROM Book b WHERE LOWER(b.category) LIKE LOWER(CONCAT('%', :category, '%'))")
    Page<Book> findByCategoryContainingIgnoreCase(@Param("category") String category, Pageable pageable);
}