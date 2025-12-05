// BookContentController.java
package com.workdatebase.work.Controller;

import com.workdatebase.work.Service.BookContentService;
import com.workdatebase.work.entity.BookContent;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/books/content")
public class BookContentController {
    
    private final BookContentService bookContentService;
    
    public BookContentController(BookContentService bookContentService) {
        this.bookContentService = bookContentService;
    }
    
    // 上传图书内容
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadBookContent(
            @RequestParam("bookId") Long bookId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("contentType") BookContent.ContentType contentType,
            @RequestParam(value = "isPublic", required = false) Boolean isPublic,
            @RequestParam(value = "allowDownload", required = false) Boolean allowDownload,
            @RequestHeader("X-User-Id") Long userId) {
        
        try {
            BookContent bookContent = bookContentService.uploadBookContent(
                bookId, file, contentType, isPublic, allowDownload, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "图书内容上传成功");
            response.put("content", bookContent);
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "文件上传失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // 获取图书内容信息
    @GetMapping("/{bookId}")
    public ResponseEntity<Map<String, Object>> getBookContentInfo(@PathVariable Long bookId) {
        Optional<BookContent> contentOpt = bookContentService.getBookContent(bookId);
        
        Map<String, Object> response = new HashMap<>();
        
        if (contentOpt.isPresent()) {
            BookContent content = contentOpt.get();
            response.put("success", true);
            response.put("hasContent", true);
            response.put("content", content);
            response.put("formattedFileSize", content.getFormattedFileSize());
        } else {
            response.put("success", true);
            response.put("hasContent", false);
            response.put("message", "该图书暂无在线内容");
        }
        
        return ResponseEntity.ok(response);
    }
    
    // 在线阅读（获取内容）
    @GetMapping("/{bookId}/read")
    public ResponseEntity<Map<String, Object>> readBookContent(
            @PathVariable Long bookId,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        // 检查阅读权限
        boolean canRead = bookContentService.canUserReadContent(bookId, userId);
        
        if (!canRead) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "您没有权限阅读此内容");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
        
        Map<String, Object> content = bookContentService.getContentForReading(bookId, page, pageSize);
        
        // 记录阅读历史
        if (userId != null) {
            bookContentService.recordReading(bookId, userId, page);
        }
        
        return ResponseEntity.ok(content);
    }
    
    // 下载图书内容
    @GetMapping("/{bookId}/download")
    public ResponseEntity<Resource> downloadBookContent(
            @PathVariable Long bookId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        Optional<BookContent> contentOpt = bookContentService.getBookContent(bookId);
        
        if (contentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        BookContent content = contentOpt.get();
        
        // 检查下载权限
        if (!Boolean.TRUE.equals(content.getAllowDownload())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            Path filePath = Paths.get(content.getFilePath());
            Resource resource = new FileSystemResource(filePath);
            
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            // 设置响应头
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, 
                       "attachment; filename=\"" + getDownloadFileName(content) + "\"");
            
            // 根据文件类型设置Content-Type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(content.getFileSize())
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // 搜索图书内容
    @GetMapping("/{bookId}/search")
    public ResponseEntity<Map<String, Object>> searchInContent(
            @PathVariable Long bookId,
            @RequestParam("keyword") String keyword,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        // 检查权限
        boolean canRead = bookContentService.canUserReadContent(bookId, userId);
        
        if (!canRead) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "您没有权限搜索此内容");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
        
        var results = bookContentService.searchInContent(keyword, bookId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("results", results);
        response.put("count", results.size());
        
        return ResponseEntity.ok(response);
    }
    
    private String getDownloadFileName(BookContent content) {
        String extension = "";
        switch (content.getContentType()) {
            case PDF: extension = ".pdf"; break;
            case EPUB: extension = ".epub"; break;
            case TXT: extension = ".txt"; break;
            case HTML: extension = ".html"; break;
            case MARKDOWN: extension = ".md"; break;
        }
        
        return content.getBook().getTitle() + extension;
    }
}