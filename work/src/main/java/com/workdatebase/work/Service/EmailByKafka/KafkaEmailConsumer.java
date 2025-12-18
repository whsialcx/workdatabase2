package com.workdatebase.work.Service.EmailByKafka;
import com.workdatebase.work.entity.EmailMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
@Component
public class KafkaEmailConsumer {

    private static final Logger logger = LoggerFactory.getLogger(KafkaEmailConsumer.class);

    private final JavaMailSender mailSender;
    private final EmailService emailService;

    @Value("${app.verification.admin-email:3247365462@qq.com}")
    private String adminEmail;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public KafkaEmailConsumer(JavaMailSender mailSender, EmailService emailService)
    {
        this.emailService = emailService;
        this.mailSender = mailSender;
    }

    @KafkaListener(topics =  "email-notifications", groupId = "email-group")
    public void consumeEmailMessage(EmailMessage emailMessage)
    {
        try
        {
            logger.info("收到邮件发送请求，类型: {}", emailMessage.getEmailType());
            switch (emailMessage.getEmailType()) {
                case VERIFICATION_REQUEST:
                    sendVerificationRequest(emailMessage);
                    break;
                case APPROVAL_NOTIFICATION:
                    sendApprovalNotification(emailMessage);
                    break;
                case REJECTION_NOTIFICATION:
                    sendRejectionNotification(emailMessage);
                    break;
                case SUBMISSION_APPROVAL_NOTIFICATION:
                    sendSubmissionApprovalNotification(emailMessage);
                    break;
                case SUBMISSION_REJECTION_NOTIFICATION:
                    sendSubmissionRejectionNotification(emailMessage);
                    break;
                default:
                    logger.warn("未知的邮件类型: {}", emailMessage.getEmailType());
            }
            logger.info("邮件发送成功: {}", emailMessage.getEmailType());
        }
        catch(Exception e)
        {
            logger.error("处理邮件消息失败: {}", e.getMessage(), e);
        }
    }

    private void sendVerificationRequest(EmailMessage message) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(fromEmail);
        mailMessage.setTo(adminEmail);
        mailMessage.setSubject("管理员注册申请确认");
        mailMessage.setText(
            "请点击以下链接完成注册确认：\n\n" +
            "批准注册：\n" +
            "http://localhost:8080/confirm-registration?token=" + message.getComment() + "&action=approve\n\n" +
            "拒绝注册：\n" +
            "http://localhost:8080/confirm-registration?token=" + message.getComment() + "&action=reject"
        );
        mailSender.send(mailMessage);
    }
    
    private void sendApprovalNotification(EmailMessage message) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(fromEmail);
        mailMessage.setTo(message.getToEmail());
        mailMessage.setSubject("管理员注册成功");
        mailMessage.setText(
            "用户 " + message.getUsername() + "：\n\n" +
            "您的管理员账户注册已成功！\n" +
            "您现在可以使用管理员账户登录系统。\n\n"
        );
        mailSender.send(mailMessage);
    }
    
    private void sendRejectionNotification(EmailMessage message) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(fromEmail);
        mailMessage.setTo(message.getToEmail());
        mailMessage.setSubject("管理员注册未通过");
        mailMessage.setText(
            "用户 " + message.getUsername() + "：\n\n" +
            "您的管理员账户注册申请未被批准。\n" +
            "如有疑问，请联系系统管理员。\n\n"
        );
        mailSender.send(mailMessage);
    }
    
    private void sendSubmissionApprovalNotification(EmailMessage message) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(fromEmail);
        mailMessage.setTo(message.getToEmail());
        mailMessage.setSubject("图书提交审核通过");
        mailMessage.setText(
            "用户 " + message.getUsername() + "：\n\n" +
            "您提交的图书《" + message.getBookTitle() + "》已通过审核并上架！\n"
        );
        mailSender.send(mailMessage);
    }
    
    private void sendSubmissionRejectionNotification(EmailMessage message) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(fromEmail);
        mailMessage.setTo(message.getToEmail());
        mailMessage.setSubject("图书提交审核结果");
        mailMessage.setText(
            "用户 " + message.getUsername() + "：\n\n" +
            "您提交的图书《" + message.getBookTitle() + "》未通过审核。\n" +
            "审核意见：" + (message.getComment() != null ? message.getComment() : "不符合上架标准") + "\n\n"
        );
        mailSender.send(mailMessage);
    }


}
