package com.workdatebase.work.entity;
import jakarta.persistence.*; 
import java.util.Date;

@Entity
@Table(name = "borrow_records")
public class BorrowRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "borrow_date", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date borrowDate;

    @Column(name = "return_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date returnDate;

    @Column(name = "dateline")
    @Temporal(TemporalType.TIMESTAMP)
    private Date dateline; // 改为 dateline 保持一致性

    @Column(name = "renewed")
    private Boolean renewed = false;

    public BorrowRecord(){}

    public BorrowRecord(Book book, User user, Date borrowDate, Date datelineDate)
    {
        this.book = book;
        this.user = user;
        this.borrowDate = borrowDate;
        this.dateline = datelineDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Date getBorrowDate() { return borrowDate; }
    public void setBorrowDate(Date borrowDate) { this.borrowDate = borrowDate; }

    public Date getReturnDate(){return returnDate; }
    public void setReturnDate(Date returnDate){ this.returnDate = returnDate; }

    public Date getDateline() { return dateline; }
    public void setDateline(Date dateline) { this.dateline = dateline; }

    public Boolean getRenewed() { return renewed; }
    public void setRenewed(Boolean renewed) { this.renewed = renewed; }

}
