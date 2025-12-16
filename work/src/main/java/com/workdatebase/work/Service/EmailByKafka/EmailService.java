package com.workdatebase.work.Service.EmailByKafka;

import com.workdatebase.work.entity.EmailMessage;
import com.workdatebase.work.entity.Status.EmailType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final KafkaEmailProducer kafkaEmailProducer;
    
    @Value("${app.verification.admin-email:3247365462@qq.com}")
    private String adminEmail;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(KafkaEmailProducer kafkaEmailProducer) {
        this.kafkaEmailProducer = kafkaEmailProducer;
    }

    public void sendVerificationRequest(String applicantEmail, String applicantUsername, String token) {
        EmailMessage message = new EmailMessage(
            adminEmail,  // 发送给管理员
            applicantUsername,
            null,        // 图书标题为空
            token,       // token放在comment字段
            EmailType.VERIFICATION_REQUEST  // 修改这里
        );
        kafkaEmailProducer.sendEmailMessage(message);
    }

    public void sendApprovalNotification(String toEmail, String username) {
        EmailMessage message = new EmailMessage(
            toEmail,
            username,
            null,
            null,
            EmailType.APPROVAL_NOTIFICATION  // 修改这里
        );
        kafkaEmailProducer.sendEmailMessage(message);
    }

    public void sendRejectionNotification(String toEmail, String username) {
        EmailMessage message = new EmailMessage(
            toEmail,
            username,
            null,
            null,
            EmailType.REJECTION_NOTIFICATION  // 修改这里
        );
        kafkaEmailProducer.sendEmailMessage(message);
    }

    public void sendSubmissionApprovalNotification(String toEmail, String username, String bookTitle) {
        EmailMessage message = new EmailMessage(
            toEmail,
            username,
            bookTitle,
            null,
            EmailType.SUBMISSION_APPROVAL_NOTIFICATION  // 修改这里
        );
        kafkaEmailProducer.sendEmailMessage(message);
    }

    public void sendSubmissionRejectionNotification(String toEmail, String username, String bookTitle, String comment) {
        EmailMessage message = new EmailMessage(
            toEmail,
            username,
            bookTitle,
            comment,
            EmailType.SUBMISSION_REJECTION_NOTIFICATION  // 修改这里
        );
        kafkaEmailProducer.sendEmailMessage(message);
    }
}