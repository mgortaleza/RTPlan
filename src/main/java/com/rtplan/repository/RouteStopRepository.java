package com.rtplan.repository;

import com.rtplan.entity.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteStopRepository extends JpaRepository<RouteStop, Long> {
    List<RouteStop> findByManifestManifestIdOrderByOptimizedSequenceAsc(Long manifestId);
}
