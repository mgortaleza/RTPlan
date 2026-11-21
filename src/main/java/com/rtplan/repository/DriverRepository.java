package com.rtplan.repository;

import com.rtplan.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    List<Driver> findByIsActiveTrue();

    Optional<Driver> findByFullNameIgnoreCase(String fullName);

    boolean existsByFullNameIgnoreCase(String fullName);
}
