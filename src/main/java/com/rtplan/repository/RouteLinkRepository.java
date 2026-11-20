package com.rtplan.repository;

import com.rtplan.entity.RouteLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteLinkRepository extends JpaRepository<RouteLink, Long> {
    List<RouteLink> findByManifestManifestIdOrderBySequenceChunkAsc(Long manifestId);
}
