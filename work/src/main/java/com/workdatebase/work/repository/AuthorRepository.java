package com.workdatebase.work.repository;

import com.workdatebase.work.entity.Author;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuthorRepository extends JpaRepository<Author, Long> {
    
    // 根据姓名查找（精确匹配）
    Optional<Author> findByName(String name);
    
    // 根据姓名模糊搜索
    Page<Author> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // 根据国籍查找
    Page<Author> findByNationalityContainingIgnoreCase(String nationality, Pageable pageable);
    
    // 获取热门作者（按popularity_score排序）
    Page<Author> findByOrderByPopularityScoreDesc(Pageable pageable);
    
    // 根据书籍数量排序
    Page<Author> findByOrderByBookCountDesc(Pageable pageable);
    
    // 搜索作者（姓名或国籍）
    @Query("SELECT a FROM Author a WHERE LOWER(a.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(a.nationality) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Author> searchByNameOrNationality(@Param("keyword") String keyword, Pageable pageable);
    
    // 获取所有作者的姓名列表（用于去重检查）
    @Query("SELECT a.name FROM Author a")
    List<String> findAllAuthorNames();
    
    // 根据多个ID获取作者
    List<Author> findByIdIn(List<Long> ids);
}