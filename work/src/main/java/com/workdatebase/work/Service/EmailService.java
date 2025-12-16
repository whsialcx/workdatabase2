package com.workdatebase.work.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    //设置默认邮箱
    @Value("${app.verification.admin-email:3247365462@qq.com}")
    private String adminEmail;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationRequest(String applicantEmail, String applicantUsername, String token) 
    {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(adminEmail);
        message.setSubject("管理员注册申请确认");
        message.setText(
            "请点击以下链接完成注册确认：\n\n" +
            "批准注册：\n" +
            "http://localhost:8080/confirm-registration?token=" + token + "&action=approve\n\n" +
            "拒绝注册：\n" +
            "http://localhost:8080/confirm-registration?token=" + token + "&action=reject"
        );
        
        mailSender.send(message);
    }

    public void sendApprovalNotification(String toEmail, String username) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("管理员注册成功");
        message.setText(
            "用户 " + username + "：\n\n" +
            "您的管理员账户注册已成功！\n" +
            "您现在可以使用管理员账户登录系统。\n\n"
        );
        
        mailSender.send(message);
    }

    public void sendRejectionNotification(String toEmail, String username) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("管理员注册未通过");
        message.setText(
            "用户 " + username + "：\n\n" +
            "您的管理员账户注册申请未被批准。\n" +
            "如有疑问，请联系系统管理员。\n\n"
        );
        
        mailSender.send(message);
    }

    public void sendSubmissionApprovalNotification(String toEmail, String username, String bookTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("图书提交审核通过");
        message.setText(
            "用户 " + username + "：\n\n" +
            "您提交的图书《" + bookTitle + "》已通过审核并上架！\n"
        );
        
        mailSender.send(message);
    }

    public void sendSubmissionRejectionNotification(String toEmail, String username, String bookTitle, String comment) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("图书提交审核结果");
        message.setText(
            "用户 " + username + "：\n\n" +
            "您提交的图书《" + bookTitle + "》未通过审核。\n" +
            "审核意见：" + (comment != null ? comment : "不符合上架标准") + "\n\n"
        );
        mailSender.send(message);
    }
}