package com.workdatebase.work.repository;

import com.workdatebase.work.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);
    Optional<VerificationToken> findByEmailAndUserType(String email, String userType);
    boolean existsByEmailAndUserType(String email, String userType);

    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.used = false AND vt.createdAt < :cutoffTime")
    void deleteExpiredTokens(@Param("cutoffTime") LocalDateTime cutoffTime);
}