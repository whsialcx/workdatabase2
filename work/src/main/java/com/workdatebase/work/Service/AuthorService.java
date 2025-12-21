// AuthorService.java
package com.workdatebase.work.Service;

import com.workdatebase.work.entity.Author;
import com.workdatebase.work.entity.Book;
import com.workdatebase.work.repository.AuthorRepository;
import com.workdatebase.work.repository.BookRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthorService {
    
    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;
    
    public AuthorService(AuthorRepository authorRepository, BookRepository bookRepository) {
        this.authorRepository = authorRepository;
        this.bookRepository = bookRepository;
    }
    
    // 根据ID获取作者
    public Optional<Author> findById(Long id) {
        return authorRepository.findById(id);
    }
    
    // 根据姓名获取作者
    public Optional<Author> findByName(String name) {
        return authorRepository.findByName(name);
    }
    
    // 根据姓名创建或获取作者
    @Transactional
    public Author createOrGetAuthor(String authorName) {
        // 先尝试查找
        Optional<Author> existingAuthor = authorRepository.findByName(authorName);
        if (existingAuthor.isPresent()) {
            return existingAuthor.get();
        }
        
        // 如果不存在则创建新作者
        Author author = new Author();
        author.setName(authorName);
        
        // 尝试从已有书籍中获取更多信息（如果有同名作者）
        List<Book> authorBooks = bookRepository.findByAuthorContaining(authorName);
        if (!authorBooks.isEmpty()) {
            // 可以设置一些默认信息，如国籍等
            // 这里可以根据业务需求添加更多逻辑
        }
        
        return authorRepository.save(author);
    }
    
    // 分页获取所有作者
    public Page<Author> getAllAuthors(Pageable pageable) {
        return authorRepository.findAll(pageable);
    }
    
    // 搜索作者
    public Page<Author> searchAuthors(String keyword, Pageable pageable) {
        return authorRepository.searchByNameOrNationality(keyword, pageable);
    }
    
    // 更新作者信息
    @Transactional
    public Author updateAuthor(Long id, Author authorDetails) {
        Author author = authorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("作者不存在"));
        
        // 更新字段（除了name，因为name是唯一的）
        if (authorDetails.getBiography() != null) {
            author.setBiography(authorDetails.getBiography());
        }
        if (authorDetails.getBirthDate() != null) {
            author.setBirthDate(authorDetails.getBirthDate());
        }
        if (authorDetails.getDeathDate() != null) {
            author.setDeathDate(authorDetails.getDeathDate());
        }
        if (authorDetails.getNationality() != null) {
            author.setNationality(authorDetails.getNationality());
        }
        if (authorDetails.getPhotoBase64() != null) {
            author.setPhotoBase64(authorDetails.getPhotoBase64());
        }
        
        return authorRepository.save(author);
    }
    
    // 删除作者（谨慎使用）
    @Transactional
    public void deleteAuthor(Long id) {
        Author author = authorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("作者不存在"));
        
        // 检查是否有书籍关联到此作者
        long bookCount = bookRepository.countByAuthor(author.getName());
        if (bookCount > 0) {
            throw new RuntimeException("该作者还有" + bookCount + "本书籍，无法删除");
        }
        
        authorRepository.delete(author);
    }
    
    // 获取作者统计信息
    public Map<String, Object> getAuthorStatistics(Long id) {
        Map<String, Object> stats = new HashMap<>();
        
        Author author = authorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("作者不存在"));
        
        // 获取作者的所有书籍
        List<Book> books = bookRepository.findByAuthor(author.getName());
        
        stats.put("author", author);
        stats.put("bookCount", books.size());
        stats.put("totalAvailableCount", books.stream().mapToInt(Book::getAvailableCount).sum());
        stats.put("totalBorrowCount", books.stream().mapToInt(book -> book.getTotal() - book.getAvailableCount()).sum());
        
        // 按类别统计
        Map<String, Long> categoryStats = new HashMap<>();
        for (Book book : books) {
            String category = book.getCategory() != null ? book.getCategory() : "未分类";
            categoryStats.put(category, categoryStats.getOrDefault(category, 0L) + 1);
        }
        stats.put("categoryStats", categoryStats);
        
        // 更新书籍数量
        author.setBookCount(books.size());
        authorRepository.save(author);
        
        return stats;
    }
    
    // 获取热门作者
    public Page<Author> getPopularAuthors(Pageable pageable) {
        return authorRepository.findByOrderByPopularityScoreDesc(pageable);
    }
    
    // 增加作者人气分数
    @Transactional
    public void increasePopularity(Long authorId, Double points) {
        Author author = authorRepository.findById(authorId)
            .orElseThrow(() -> new RuntimeException("作者不存在"));
        
        Double currentScore = author.getPopularityScore() != null ? author.getPopularityScore() : 0.0;
        author.setPopularityScore(currentScore + points);
        authorRepository.save(author);
    }
    
    // 批量根据姓名获取作者ID
    public Map<String, Long> getAuthorIdsByNames(List<String> names) {
        Map<String, Long> result = new HashMap<>();
        for (String name : names) {
            authorRepository.findByName(name).ifPresent(author -> {
                result.put(name, author.getId());
            });
        }
        return result;
    }
}