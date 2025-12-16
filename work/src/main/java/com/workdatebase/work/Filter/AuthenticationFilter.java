package com.workdatebase.work.Filter;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthenticationFilter extends OncePerRequestFilter{

        private static final Set<String> PUBLIC_PATHS = new HashSet<>(Arrays.asList(
        "/",
        "/login",
        "/register",
        "/home",
        "/registrationsuccess",
        "/registrationfailed",
        "/confirm-registration",
        "/api/auth/login",
        "/api/auth/register",
        "/api/books/search",
        "/api/books/related",
        "/api/search/hot",
        "/swagger-ui.html",
        "/swagger-ui/",
        "/v3/api-docs",
        "/v3/api-docs/swagger-config",
        "/webjars/",
        "/swagger-resources"
    ));
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException
    {
        String path = request.getServletPath();
        if(isPublicPath(path))
        {
            filterChain.doFilter(request, response);
            return;
        }

        String userIdStr = request.getHeader("X-User-Id");
        if(userIdStr == null || userIdStr.trim().isEmpty())
        {
            sendUnauthorizedResponse(response, "未提供用户ID，请先登录");
            return;
        }
        try
        {
            Long userId = Long.parseLong(userIdStr);

            request.setAttribute("userId", userId);

            filterChain.doFilter(request, response);
        }
        catch(NumberFormatException e)
        {
            sendUnauthorizedResponse(response, "无效的用户ID格式");
        }
        catch(Exception e)
        {
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "服务器内部错误:", e.getMessage());
        }
    }
    private void sendErrorResponse(HttpServletResponse response, int status, String string,
            String message) throws IOException
    {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        
        Map<String, Object> errorResponse = Map.of(
            "success", false,
            "message", message
        );
        
        objectMapper.writeValue(response.getWriter(), errorResponse);
    }
    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException 
    {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        
        Map<String, Object> errorResponse = Map.of(
            "success", false,
            "message", message,
            "code", "UNAUTHORIZED"
        );
        objectMapper.writeValue(response.getWriter(), errorResponse);
    }
    private boolean isPublicPath(String path) 
    {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }
    

}
