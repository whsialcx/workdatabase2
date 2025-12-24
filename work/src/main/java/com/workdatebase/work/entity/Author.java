package com.workdatebase.work.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "authors")
public class Author {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 200)
    private String name;

    @Column(name = "biography", columnDefinition = "TEXT")
    private String biography;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "death_date")
    private LocalDate deathDate;

    @Column(name = "nationality", length = 100)
    private String nationality;

    @Column(name = "photo_base64", columnDefinition = "TEXT")
    private String photoBase64;

    @Column(name = "created_time")
    private Date createdTime;

    @Column(name = "updated_time")
    private Date updatedTime;

    @Column(name = "book_count")
    private Integer bookCount = 0;

    @Column(name = "popularity_score")
    private Double popularityScore = 0.0;

    @PrePersist
    protected void onCreate() {
        createdTime = new Date();
        updatedTime = new Date();
        if (bookCount == null) bookCount = 0;
        if (popularityScore == null) popularityScore = 0.0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedTime = new Date();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBiography() { return biography; }
    public void setBiography(String biography) { this.biography = biography; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public LocalDate getDeathDate() { return deathDate; }
    public void setDeathDate(LocalDate deathDate) { this.deathDate = deathDate; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getPhotoBase64() { return photoBase64; }
    public void setPhotoBase64(String photoBase64) { this.photoBase64 = photoBase64; }

    public Date getCreatedTime() { return createdTime; }
    public void setCreatedTime(Date createdTime) { this.createdTime = createdTime; }

    public Date getUpdatedTime() { return updatedTime; }
    public void setUpdatedTime(Date updatedTime) { this.updatedTime = updatedTime; }

    public Integer getBookCount() { return bookCount; }
    public void setBookCount(Integer bookCount) { this.bookCount = bookCount; }

    public Double getPopularityScore() { return popularityScore; }
    public void setPopularityScore(Double popularityScore) { this.popularityScore = popularityScore; }

    // 计算年龄
    public String getAgeInfo() {
        if (birthDate == null) return "未知";
        
        if (deathDate != null) {
            long years = deathDate.getYear() - birthDate.getYear();
            return years + "岁（逝于" + deathDate.getYear() + "年）";
        } else {
            long years = LocalDate.now().getYear() - birthDate.getYear();
            return years + "岁";
        }
    }
}