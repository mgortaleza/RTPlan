package com.rtplan.repository;

import com.rtplan.entity.RouteManifest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteManifestRepository extends JpaRepository<RouteManifest, Long> {

    @Query("SELECT DISTINCT m FROM RouteManifest m " +
           "JOIN FETCH m.driver d " +
           "LEFT JOIN FETCH m.stops s " +
           "WHERE m.manifestId = :id")
    Optional<RouteManifest> findByIdWithDriverAndStops(@Param("id") Long id);

    List<RouteManifest> findTop15ByOrderByManifestIdDesc();

    @Query("SELECT DISTINCT m FROM RouteManifest m " +
           "JOIN FETCH m.driver d " +
           "LEFT JOIN FETCH m.stops s " +
           "WHERE (LOWER(m.createdBy) = LOWER(:username) OR LOWER(d.fullName) = LOWER(:username)) " +
           "ORDER BY m.manifestId DESC")
    List<RouteManifest> findRecentByUsername(@Param("username") String username);
}
