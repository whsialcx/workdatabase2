package com.workdatebase.work.entity;


import jakarta.persistence.*; 
import java.time.LocalDateTime;
// import jave.time.Date;
@Entity
@Table(name = "users")
public class User {
    @Id// 标记主键
    @GeneratedValue(strategy = GenerationType.IDENTITY)// 指定主键的生成策略
    private Long id;
    
    @Column(name = "username" ,unique = true, nullable = false)//指定列名和特性，这里是唯一且非空
    private String username;
    
    @Column(name = "password",  nullable = false)//非空
    private String password;
    
    @Column(name = "email" ,unique = true)//唯一
    private String email;
    
    @Column(name = "fullname" ,unique = true)//唯一
    private String fullName;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;//创建时间
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;//更新时间
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 构造函数
    public User() {}
    
    public User(String username, String password, String email, String fullName) 
    {
        this.username = username != null ? username : "";
        this.password = password != null ? password : "";
        this.email = email != null ? email : "";
        this.fullName = fullName != null ? fullName : username; // 如果没有全名，使用用户名
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
        
    // Getter 和 Setter 方法，将private的属性暴露出来，以便其他类使用
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}