package com.workdatebase.work.entity;

import java.io.Serializable;
import com.workdatebase.work.entity.Status.EmailType;;
public class EmailMessage implements Serializable{
    private String toEmail;
    private String username;
    private String bookTitle;
    private String comment;
    private EmailType emailType;

    public EmailMessage(){}

    public EmailMessage(String toEmail, String username, String bookTitle,
                        String comment, EmailType emailType)
    {
        this.toEmail = toEmail;
        this.username = username;
        this.bookTitle = bookTitle;
        this.comment = comment;
        this.emailType = emailType;
    }
    public String getToEmail() { return toEmail; }
    public void setToEmail(String toEmail) { this.toEmail = toEmail; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getBookTitle() { return bookTitle; }
    public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }
    
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    
    public EmailType getEmailType() { return emailType; }
    public void setEmailType(EmailType emailType) { this.emailType = emailType; }
}
