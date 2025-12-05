package com.workdatebase.work.entity;

import jakarta.persistence.*; 
import java.util.Date;

import com.workdatebase.work.entity.Status.BookStatus;
@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = true, length = 500) // 可以不唯一
    private String title;

    @Column(name = "author", unique = false, length = 500)
    private String author;

    @Column(name = "publish_time")
    private Date publishTime;

    @Column(name = "include_time")
    private Date includeTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private BookStatus status;

    @Column(name = "category", unique = false, length = 100)
    private String category;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "total")
    private Integer total;

    @Column(name = "available_count")
    private Integer availableCount;

    @Column(name = "introduction", columnDefinition = "TEXT")
    private String introduction;

    @Column(name = "cover_base64", columnDefinition = "TEXT")
        private String coverBase64;

    @Transient
    private Boolean hasOnlineContent = false;
    
    @Transient
    private BookContent.ContentType contentType;
        
    public String getCoverBase64() {
        return coverBase64;
    }

    public void setCoverBase64(String coverBase64) {
        this.coverBase64 = coverBase64;
    }

    protected void onCreate() 
    {
        if (includeTime == null) {
            includeTime = new Date();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public Date getPublishTime() { return publishTime; }
    public void setPublishTime(Date publishTime) { this.publishTime = publishTime; }

    public Date getIncludeTime() { return includeTime; }
    public void setIncludeTime(Date includeTime) { this.includeTime = includeTime; }

    public BookStatus getStatus() { return status; }
    public void setStatus(BookStatus status) { this.status = status; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Integer getTotal() { return total; }
    public void setTotal(Integer total) { this.total = total; }

    public String getIntroduction() { return introduction; }
    public void setIntroduction(String introduction) { this.introduction = introduction; }

    public Integer getAvailableCount() { return availableCount; }
    public void setAvailableCount(Integer availableCount)
    {
        this.availableCount = availableCount;
        if(this.availableCount != null && this.availableCount <= 0)
        {
            this.status = BookStatus.BORROWED;
        }
        else if(this.availableCount != null && this.availableCount > 0)
        {
            this.status = BookStatus.AVAILABLE;
        }
    }

    public Boolean getHasOnlineContent() { 
        return hasOnlineContent; 
    }
    
    public void setHasOnlineContent(Boolean hasOnlineContent) { 
        this.hasOnlineContent = hasOnlineContent; 
    }
    
    public BookContent.ContentType getContentType() { 
        return contentType; 
    }
    
    public void setContentType(BookContent.ContentType contentType) { 
        this.contentType = contentType; 
    }

}