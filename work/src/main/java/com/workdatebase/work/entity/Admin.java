package com.workdatebase.work.entity;
import jakarta.persistence.*; 
import java.time.LocalDateTime;
@Entity
@Table(name = "Admin")
public class Admin {
    @Id// 标记主键
    @GeneratedValue(strategy = GenerationType.IDENTITY)// 指定主键的生成策略
    private Long id;
    
    @Column(name = "adminname" ,unique = true, nullable = false)//指定列名和特性，这里是唯一且非空
    private String adminname;
    
    @Column(name = "password",  nullable = false)//非空
    private String password;
    
    @Column(name = "email" ,unique = true)//唯一
    private String email;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;//创建时间
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;//更新时间
    
    // 构造函数
    public Admin() {}
    
    public Admin(String adminname, String password, String email) {
        this.adminname = adminname;
        this.password = password;
        this.email = email;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getAdminname() { return adminname; }
    public void setAdminname(String adminname) { this.adminname = adminname; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

}
