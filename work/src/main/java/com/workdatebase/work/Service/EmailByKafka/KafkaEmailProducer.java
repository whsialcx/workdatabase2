package com.workdatebase.work.Service.EmailByKafka;
import com.workdatebase.work.entity.EmailMessage;

import jakarta.validation.constraints.Email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

import com.workdatebase.work.entity.EmailMessage;
@Service
public class KafkaEmailProducer {
    private static final Logger logger = LoggerFactory.getLogger(KafkaEmailProducer.class);

    private static final String EMAIL_TOPIC = "email-notifications";
    private final KafkaTemplate<String, EmailMessage> kafkaTemplate;

    public KafkaEmailProducer(KafkaTemplate<String, EmailMessage>kafkaTemplate)
    {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendEmailMessage(EmailMessage emailMessage)
    {
        try
        {
            CompletableFuture<SendResult<String, EmailMessage>> future;
            future = kafkaTemplate.send(EMAIL_TOPIC, emailMessage);
            future.whenComplete((result, ex) ->
            {
                if(ex == null)
                {
                    logger.info("邮件消息发送成功，offset: {}", result.getRecordMetadata().offset());
                }
                else
                {
                    logger.error("邮件消息发送失败: {}", ex.getMessage());
                    handleSendFailure(emailMessage, ex);
                }
            });
        }
        catch(Exception e)
        {
            logger.error("发送邮件消息异常: {}", e.getMessage());
            handleSendFailure(emailMessage, e);
        }

    }

    private void handleSendFailure(EmailMessage message, Throwable ex) {
        // 可以在这里实现失败重试或记录到数据库
        logger.warn("邮件发送失败，将尝试直接发送，邮件类型: {}", message.getEmailType());
        // 降级处理：直接发送邮件（可选，根据业务需求）
        // directEmailService.sendDirectEmail(message);
    }
}
