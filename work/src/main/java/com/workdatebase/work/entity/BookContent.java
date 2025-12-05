// BookContent.java - 完整实体类
package com.workdatebase.work.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "book_contents")
public class BookContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "book_id", nullable = false, unique = true)
    private Book book;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false)
    private ContentType contentType;
    
    @Column(name = "file_path")
    private String filePath;
    
    @Lob
    @Column(name = "content_text", columnDefinition = "TEXT")
    private String contentText;
    
    @Column(name = "total_pages")
    private Integer totalPages;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "is_public")
    private Boolean isPublic = false;
    
    @Column(name = "upload_time")
    private Date uploadTime;
    
    @Column(name = "last_view_time")
    private Date lastViewTime;
    
    @Column(name = "view_count")
    private Integer viewCount = 0;
    
    @Column(name = "allow_download")
    private Boolean allowDownload = false;
    
    // 支持的格式类型
    public enum ContentType {
        PDF, EPUB, TXT, HTML, MARKDOWN
    }
    
    public BookContent() {
        this.uploadTime = new Date();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }
    
    public ContentType getContentType() { return contentType; }
    public void setContentType(ContentType contentType) { this.contentType = contentType; }
    
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    
    public String getContentText() { return contentText; }
    public void setContentText(String contentText) { this.contentText = contentText; }
    
    public Integer getTotalPages() { return totalPages; }
    public void setTotalPages(Integer totalPages) { this.totalPages = totalPages; }
    
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    
    public Date getUploadTime() { return uploadTime; }
    public void setUploadTime(Date uploadTime) { this.uploadTime = uploadTime; }
    
    public Date getLastViewTime() { return lastViewTime; }
    public void setLastViewTime(Date lastViewTime) { this.lastViewTime = lastViewTime; }
    
    public Integer getViewCount() { return viewCount; }
    public void setViewCount(Integer viewCount) { this.viewCount = viewCount; }
    
    public Boolean getAllowDownload() { return allowDownload; }
    public void setAllowDownload(Boolean allowDownload) { this.allowDownload = allowDownload; }
    
    // 获取友好的文件大小显示
    public String getFormattedFileSize() {
        if (fileSize == null) return "未知大小";
        
        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else if (fileSize < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
        } else {
            return String.format("%.1f GB", fileSize / (1024.0 * 1024.0 * 1024.0));
        }
    }
}