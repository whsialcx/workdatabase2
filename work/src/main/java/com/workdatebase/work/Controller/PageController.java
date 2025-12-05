package com.workdatebase.work.Controller;

import java.util.Map;


import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.workdatebase.work.Service.AuthService;

@Controller
public class PageController {
    
    private final AuthService authService;

    public PageController(AuthService authService) 
    {
        this.authService = authService;
    }

    @GetMapping("/")
    public String home() {
        return "login";
    }

    
     @GetMapping("/login")
    public String login() {
        return "login";
    }
    
    @GetMapping("/register")
    public String register() {
        return "register";
    }
    
    
    @GetMapping("/user/dashboard")
    public String userDashboard() {
        return "dashboard";
    }

    @GetMapping("/booksearch")
    public String bookSearch() {
        return "booksearch";
    }

    // 添加缺失的映射
    @GetMapping("/user/booksearch")
    public String userBookSearch() {
        return "booksearch";
    }

    @GetMapping("/admin/booksearch")
    public String adminBookSearch() {
        return "booksearch";
    }

    @GetMapping("/registrationsuccess")
    public String registrationSuccess() {
        return "registrationsuccess";
    }
    
    @GetMapping("/registrationfailed")
    public String registrationFailed() {
        return "registrationfailed";
    }

    @GetMapping("/bookmanagement")
    public String bookManagement() {
        return "bookmanagement";
    }
    

    @GetMapping("/confirm-registration")
    public String confirmRegistration(
            @RequestParam String token,
            @RequestParam String action,
            Model model) {
        
        try {
            boolean approved = "approve".equalsIgnoreCase(action);
            Map<String, Object> result = authService.verifyAdminRegistration(token, approved);
            
            model.addAttribute("success", result.get("success"));
            model.addAttribute("message", result.get("message"));
            
            return "verification-result";
            
        } catch (Exception e) {
            model.addAttribute("success", false);
            model.addAttribute("message", "验证过程中出现错误: " + e.getMessage());
            return "verification-result";
        }
    }

    @GetMapping("/usermanagement")
    public String userManagement() {
        return "usermanagement";
    }

    @GetMapping("/borrowmanagement")
    public String borrowManagement() {
        return "borrowmanagement";
    }

    @GetMapping("/admin/admindashboard")
    public String adminDashboard() {
        return "admindashboard";
    }
    @GetMapping("/settings")
    public String settings() {
        return "settings";
    }
    @GetMapping("/profile")
    public String profile() {
        return "profile";
    }

    @GetMapping("/booksubmission")
    public String bookSubmission() {
        return "booksubmission";
    }

    @GetMapping("/admin/submissionmanagement")
    public String submissionManagement() {
        return "submissionmanagement";
    }

    @GetMapping("/bookdetail")
    public String bookDetail() {
        return "bookdetail";
    }

    @GetMapping("/readbook")
    public String getMethodName() {
        return "readbook";
    }
    
    
}