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

    Page<User> findByIsDeletedFalse(Pageable pageable);

    Page<User> findByIsDeletedFalseAndUsernameContainingAndPhoneContaining(
            String username, String phone, Pageable pageable);

    /** 模糊搜索：用户名或手机号包含关键词（供数据管理列表筛选） */
    Page<User> findByIsDeletedFalseAndUsernameContainingOrPhoneContaining(
            String username, String phone, Pageable pageable);
}
