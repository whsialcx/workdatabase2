package com.workdatebase.work.Service;

import com.workdatebase.work.entity.Admin;
import com.workdatebase.work.entity.User;
import com.workdatebase.work.entity.VerificationToken;
import com.workdatebase.work.repository.AdminRepository;
import com.workdatebase.work.repository.UserRepository;
import com.workdatebase.work.repository.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.verification.token-expiry-hours:24}")
    private int tokenExpiryHours;

    public AuthService(UserRepository userRepository, AdminRepository adminRepository, 
                      VerificationTokenRepository verificationTokenRepository, EmailService emailService) {
        this.adminRepository = adminRepository;
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public PasswordEncoder getPasswordEncoder() {
        return passwordEncoder;
    }

    private void cleanupExpiredTokens() {
        try {
            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(12);
            verificationTokenRepository.deleteExpiredTokens(cutoffTime);
        } catch (Exception e) {
            System.err.println("清理过期token时出错: " + e.getMessage());
        }
    }

    public Map<String, Object> login(String name, String password, String userType) 
    {
        Map<String, Object> result = new HashMap<>();    
        if ("admin".equals(userType))// 如果是以管理员身份登录
        {
            Optional<Admin> admin = adminRepository.findByAdminname(name); 
            // 如果管理员表存在admin,并且密码是相同的
            if (admin.isPresent() && passwordEncoder.matches(password, admin.get().getPassword())) 
            {
                result.put("success", true);
                result.put("message", "管理员登录成功");
                result.put("role", "admin");
                result.put("name", admin.get().getAdminname());
                result.put("userId", admin.get().getId());
                return result;
            }
        } 
        else //用户登录
        {
            Optional<User> user = userRepository.findByUsername(name);
            if (user.isPresent() && passwordEncoder.matches(password, user.get().getPassword())) {
                result.put("success", true);
                result.put("message", "用户登录成功");
                result.put("role", "user");
                result.put("name", user.get().getUsername());
                result.put("userId", user.get().getId());
                return result;
            }
        }
        // 登录失败
        result.put("success", false);
        result.put("message", "用户名或密码错误");
        return result;
    }

    public Map<String, Object> register(User user, String userType) {
        Map<String, Object> result = new HashMap<>();
        
        // 验证必要字段
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "用户名不能为空");
            return result;
        }
        
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "密码不能为空");
            return result;
        }
        
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "邮箱不能为空");
            return result;
        }

        // 检查用户名是否存在
        if (userRepository.existsByUsername(user.getUsername()) || 
            adminRepository.existsByAdminname(user.getUsername())) {
            result.put("success", false);
            result.put("message", "用户名已存在");
            return result;
        }
        
        // 检查邮箱是否存在
        if (userRepository.existsByEmail(user.getEmail()) || 
            adminRepository.existsByEmail(user.getEmail())) {
            result.put("success", false);
            result.put("message", "邮箱已存在");
            return result;
        }

        try {
            // 加密密码
            String encodedPassword = passwordEncoder.encode(user.getPassword());
            user.setPassword(encodedPassword);
            
            if ("admin".equals(userType)) {
                // 管理员注册：发送验证请求
                return handleAdminRegistration(user);
            } else {
                // 普通用户：直接注册
                return handleUserRegistration(user);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "注册失败: " + e.getMessage());
            return result;
        }
    }

    private Map<String, Object> handleUserRegistration(User user) {
        Map<String, Object> result = new HashMap<>();
        
        if (user.getFullName() == null) {
            user.setFullName(user.getUsername());
        }
        
        userRepository.save(user);
        result.put("success", true);
        result.put("message", "用户注册成功");
        
        return result;
    }

    private Map<String, Object> handleAdminRegistration(User user) {
        Map<String, Object> result = new HashMap<>();
        
        // 先清理超过12小时的预注册用户
        cleanupExpiredTokens();
        
        // 检查是否已经有待处理的验证请求
        if (verificationTokenRepository.existsByEmailAndUserType(user.getEmail(), "admin")) {
            result.put("success", false);
            result.put("message", "该邮箱已有待处理的管理员注册申请");
            return result;
        }

        // 生成验证令牌
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusHours(12);

        // 保存验证令牌（密码已经是加密后的）
        VerificationToken verificationToken = new VerificationToken(
            token, user.getEmail(), user.getUsername(), user.getPassword(), "admin", expiryDate
        );
        verificationTokenRepository.save(verificationToken);

        // 发送验证邮件给管理员
        try {
            emailService.sendVerificationRequest(user.getEmail(), user.getUsername(), token);
            result.put("success", true);
            result.put("message", "管理员注册申请已提交，请等待验证。验证邮件已发送到管理员邮箱。");
        } catch (Exception e) {
            System.err.println("邮件发送失败: " + e.getMessage());
            result.put("success", true);
            result.put("message", "管理员注册申请已提交，但验证邮件发送失败。请联系系统管理员手动处理。");
        }
        
        return result;
    }
    
    // 管理员注册是否成功
    public Map<String, Object> verifyAdminRegistration(String token, boolean approved) 
    {
        Map<String, Object> result = new HashMap<>();
        try
        {
            Optional<VerificationToken> tokenOpt = verificationTokenRepository.findByToken(token);
            if (tokenOpt.isEmpty()) 
            {
                result.put("success", false);
                result.put("message", "无效的验证令牌");
                return result;
            }

            VerificationToken verificationToken = tokenOpt.get();
            
            if (verificationToken.getUsed()) {
                result.put("success", false);
                result.put("message", "该令牌已被使用");
                return result;
            }

            if (verificationToken.isExpired()) {
                result.put("success", false);
                result.put("message", "验证令牌已过期");
                return result;
            }

            if (!"admin".equals(verificationToken.getUserType())) {
                result.put("success", false);
                result.put("message", "无效的用户类型");
                return result;
            }

            if (approved) 
            {
                // 创建管理员账户（密码已经是加密的）
                Admin admin = new Admin(
                    verificationToken.getUsername(),
                    verificationToken.getPassword(), // 加密密码
                    verificationToken.getEmail()
                );
                adminRepository.save(admin);

                // 发送批准通知, SMTP服务
                try 
                {
                    emailService.sendApprovalNotification(verificationToken.getEmail(), verificationToken.getUsername());
                    System.out.println("批准通知邮件发送成功");
                } 
                catch (Exception e)
                {
                    System.err.println("批准通知邮件发送失败: " + e.getMessage());
                    result.put("emailSent", false);
                    result.put("emailError", e.getMessage());
                }
                
                result.put("success", true);
                result.put("message", "管理员账户已成功创建");
                
                System.out.println("管理员账户创建成功: " + verificationToken.getUsername() + 
                                ", 邮箱: " + verificationToken.getEmail());
            } 
            else 
            {
                // 发送拒绝通知
                try 
                {
                    emailService.sendRejectionNotification(verificationToken.getEmail(), verificationToken.getUsername());
                    System.out.println("拒绝通知邮件发送成功");
                } 
                catch (Exception e) 
                {
                    System.err.println("拒绝通知邮件发送失败: " + e.getMessage());
                    result.put("emailSent", false);
                    result.put("emailError", e.getMessage());
                }
                result.put("success", true);
                result.put("message", "管理员注册申请已被拒绝");
            }
            // 标记令牌为已使用
            verificationToken.setUsed(true);
            verificationTokenRepository.save(verificationToken);

            return result;
            
        } 
        catch (Exception e) 
        {
            System.err.println("验证管理员注册时发生错误: " + e.getMessage());
            e.printStackTrace();
            
            result.put("success", false);
            result.put("message", "验证过程中出现错误: " + e.getMessage());
            return result;
        }
    }
}