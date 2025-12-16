package com.workdatebase.work.Service.EmailByKafka;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class FallbackEmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(FallbackEmailService.class);
    
    private final JavaMailSender mailSender;
    
    @Value("${app.verification.admin-email:3247365462@qq.com}")
    private String adminEmail;

    @Value("${spring.mail.username}")
    private String fromEmail;
    
    public FallbackEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    public void sendDirectEmail(com.workdatebase.work.entity.EmailMessage message) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromEmail);
            
            // 根据邮件类型设置不同的内容和收件人
            switch (message.getEmailType()) {
                case VERIFICATION_REQUEST:
                    mailMessage.setTo(adminEmail);
                    mailMessage.setSubject("管理员注册申请确认");
                    mailMessage.setText(
                        "请点击以下链接完成注册确认：\n\n" +
                        "批准注册：\n" +
                        "http://localhost:8080/confirm-registration?token=" + message.getComment() + "&action=approve\n\n" +
                        "拒绝注册：\n" +
                        "http://localhost:8080/confirm-registration?token=" + message.getComment() + "&action=reject"
                    );
                    break;
                case APPROVAL_NOTIFICATION:
                    mailMessage.setTo(message.getToEmail());
                    mailMessage.setSubject("管理员注册成功");
                    mailMessage.setText(
                        "用户 " + message.getUsername() + "：\n\n" +
                        "您的管理员账户注册已成功！\n" +
                        "您现在可以使用管理员账户登录系统。\n\n"
                    );
                    break;
                case REJECTION_NOTIFICATION:
                    mailMessage.setTo(message.getToEmail());
                    mailMessage.setSubject("管理员注册未通过");
                    mailMessage.setText(
                        "用户 " + message.getUsername() + "：\n\n" +
                        "您的管理员账户注册申请未被批准。\n" +
                        "如有疑问，请联系系统管理员。\n\n"
                    );
                    break;
                case SUBMISSION_APPROVAL_NOTIFICATION:
                    mailMessage.setTo(message.getToEmail());
                    mailMessage.setSubject("图书提交审核通过");
                    mailMessage.setText(
                        "用户 " + message.getUsername() + "：\n\n" +
                        "您提交的图书《" + message.getBookTitle() + "》已通过审核并上架！\n"
                    );
                    break;
                case SUBMISSION_REJECTION_NOTIFICATION:
                    mailMessage.setTo(message.getToEmail());
                    mailMessage.setSubject("图书提交审核结果");
                    mailMessage.setText(
                        "用户 " + message.getUsername() + "：\n\n" +
                        "您提交的图书《" + message.getBookTitle() + "》未通过审核。\n" +
                        "审核意见：" + (message.getComment() != null ? message.getComment() : "不符合上架标准") + "\n\n"
                    );
                break;
            }
            
            mailSender.send(mailMessage);
            logger.info("降级邮件发送成功: {}", message.getEmailType());
        } catch (Exception e) {
            logger.error("降级邮件发送失败: {}", e.getMessage());
        }
    }
}