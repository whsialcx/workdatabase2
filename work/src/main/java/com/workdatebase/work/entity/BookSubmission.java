package com.workdatebase.work.entity;
import com.workdatebase.work.entity.Status.SubmissionStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
@Entity
@Table(name = "booksubmissions")
public class BookSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false)
    private String author;
    
    private String category;
    private String isbn;
    private String publisher;
    private Integer publishYear;
    
    @Column(name = "introduction", columnDefinition = "TEXT")
    private String introduction;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User submitUser;
    
    @Enumerated(EnumType.STRING)
    private SubmissionStatus status = SubmissionStatus.PENDING;
    
    private LocalDateTime submitTime;
    private LocalDateTime reviewTime;
    
    @ManyToOne
    @JoinColumn(name = "review_admin_id")
    private Admin reviewAdmin;
    
    private String reviewComment; // 审核意见
    
    // 审核通过后创建的图书ID
    private Long createdBookId;

    @Column(name = "cover_base64", columnDefinition = "TEXT")
    private String coverBase64;

    public String getCoverBase64() {
        return coverBase64;
    }

    public void setCoverBase64(String coverBase64) {
        this.coverBase64 = coverBase64;
    }

    public BookSubmission() 
    {
        this.submitTime = LocalDateTime.now();
    }
    public Long getId(){return id;};
    public void setId(Long id){this.id = id;};

    public String getTitle(){return title;};
    public void setTitle(String title){this.title = title;};

    public String getAuthor(){return author;};
    public void setAuthor(String author){this.author = author;};

    public String getCategory() {return category;}
    
    public void setCategory(String category) {this.category = category;}
    
    public String getIsbn() {return isbn;}
    
    public void setIsbn(String isbn) {this.isbn = isbn;}
    
    public String getPublisher() {return publisher;}
    
    public void setPublisher(String publisher) {this.publisher = publisher;}
    
    public Integer getPublishYear() {return publishYear;}
    
    public void setPublishYear(Integer publishYear) {this.publishYear = publishYear;}
    
    public String getDescription() {return introduction;}
    
    public void setDescription(String introduction) {this.introduction = introduction;}
    
    
    public User getSubmitUser() {return submitUser;}
    
    public void setSubmitUser(User submitUser) {this.submitUser = submitUser;}
    
    public SubmissionStatus getStatus() {return status;}
    
    public void setStatus(SubmissionStatus status) {this.status = status;}
    
    public LocalDateTime getSubmitTime() {return submitTime;}
    
    public void setSubmitTime(LocalDateTime submitTime) {this.submitTime = submitTime;}
    
    public LocalDateTime getReviewTime() {return reviewTime;}
    
    public void setReviewTime(LocalDateTime reviewTime) {this.reviewTime = reviewTime;}
    
    public Admin getReviewAdmin() {return reviewAdmin;}
    
    public void setReviewAdmin(Admin reviewAdmin) {this.reviewAdmin = reviewAdmin;}
    
    public String getReviewComment() {return reviewComment;}
    
    public void setReviewComment(String reviewComment) {this.reviewComment = reviewComment;}
    
    public Long getCreatedBookId() {return createdBookId;}
    
    public void setCreatedBookId(Long createdBookId) {this.createdBookId = createdBookId;}


}