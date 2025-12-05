package com.workdatebase.work.repository;

import com.workdatebase.work.entity.Admin;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long>{
    Optional<Admin> findByAdminname(String adminname);
    Optional<Admin> findByEmail(String email);
    boolean existsByAdminname(String adminname);
    boolean existsByEmail(String email);
}
