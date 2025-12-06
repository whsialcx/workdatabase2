package com.workdatebase.work.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import io.swagger.v3.oas.annotations.tags.Tag;

@Controller
@Tag(name = "首页", description = "首页重定向相关接口")
public class HomeController {
    
    @GetMapping("/home")
    public String home() {
        return "redirect:/login";
    }
}