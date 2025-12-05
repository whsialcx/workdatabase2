package com.workdatebase.work.entity.Status;

public enum BookStatus {
    AVAILABLE("仍存"),
    BORROWED("借出");

    private final String label;

    BookStatus(String label) { this.label = label; }

    public String getLabel() { return label; }

    @Override
    public String toString() { return label; }
}