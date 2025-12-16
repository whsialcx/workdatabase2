package com.workdatebase.work.Service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class EmailMetricsService {
    
    private final Counter emailSentCounter;
    private final Counter emailFailedCounter;
    private final ConcurrentHashMap<String, AtomicLong> emailTypeCounter;
    
    public EmailMetricsService(MeterRegistry meterRegistry) {
        this.emailSentCounter = meterRegistry.counter("email.sent.total");
        this.emailFailedCounter = meterRegistry.counter("email.failed.total");
        this.emailTypeCounter = new ConcurrentHashMap<>();
    }
    
    public void incrementSent(String emailType) {
        emailSentCounter.increment();
        emailTypeCounter.computeIfAbsent(emailType, k -> new AtomicLong(0)).incrementAndGet();
    }
    
    public void incrementFailed(String emailType) {
        emailFailedCounter.increment();
    }
}