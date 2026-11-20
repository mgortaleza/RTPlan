package com.rtplan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "route_links")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LinkID")
    private Long linkId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ManifestID", nullable = false)
    private RouteManifest manifest;

    @Column(name = "SequenceChunk", nullable = false)
    private Integer sequenceChunk;

    @Column(name = "GoogleMapsUrl", nullable = false, length = 2048)
    private String googleMapsUrl;

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
