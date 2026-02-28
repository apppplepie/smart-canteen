package com.scs.repository;

import com.scs.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    List<User> findByIsDeletedFalse();

    Page<User> findByIsDeletedFalseAndUsernameContainingAndPhoneContaining(
            String username, String phone, Pageable pageable);
}
