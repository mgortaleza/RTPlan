package com.rtplan.repository;

import com.rtplan.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    List<User> findAllByOrderByUserIdDesc();

    List<User> findByStatusIgnoreCase(String status);

    long countByStatusIgnoreCase(String status);
}
