package com.workdatebase.work.Controller;

import com.workdatebase.work.Service.AuthService;
import com.workdatebase.work.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) 
    {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) 
    {
        String name = loginRequest.get("name");
        String password = loginRequest.get("password");
        String userType = loginRequest.get("userType");

        Map<String, Object> result = authService.login(name, password, userType);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, Object> registerRequest) 
    {
        // 提取用户信息和用户类型
        String userType = (String) registerRequest.get("userType");
        if (userType == null) {
            userType = "user"; // 默认用户类型
        }
        
        User user = new User();
        user.setUsername((String) registerRequest.get("username"));
        user.setPassword((String) registerRequest.get("password"));
        user.setEmail((String) registerRequest.get("email"));
        user.setFullName((String) registerRequest.get("fullName"));
        
        // 基本验证
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) 
        {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "用户名不能为空");
            return ResponseEntity.badRequest().body(result);
        }
        
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) 
        {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "密码不能为空");
            return ResponseEntity.badRequest().body(result);
        }
        
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) 
        {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "邮箱不能为空");
            return ResponseEntity.badRequest().body(result);
        }
        
        Map<String, Object> result = authService.register(user, userType);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/verifyadmin")
    public ResponseEntity<Map<String, Object>> verifyAdminRegistration(
            @RequestParam String token,
            @RequestParam(defaultValue = "true") boolean approved) {
        
        Map<String, Object> result = authService.verifyAdminRegistration(token, approved);
        return ResponseEntity.ok(result);
    }

}